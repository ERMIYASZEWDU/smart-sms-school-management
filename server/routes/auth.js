import express from 'express'
import jwt from 'jsonwebtoken'
import bcrypt from 'bcryptjs'
import crypto from 'crypto'
import User from '../models/User.js'
import { verifyToken } from '../middleware/auth.js'
import { validateLogin } from '../middleware/validator.js'
import { authLimiter, strictLimiter } from '../middleware/rateLimiter.js'
import { asyncHandler } from '../middleware/errorHandler.js'
import { logAuthEvent } from '../middleware/auditLogger.js'
import { normalizePhone, generateOTP, sendOTPSMS } from '../utils/smsService.js'
import { sendOTPEmail, sendPasswordResetConfirmation } from '../utils/emailService.js'

const router = express.Router()

// Apply rate limiting to auth routes
router.use(authLimiter)

/**
 * Find a user by phone number, tolerating any common formatting.
 * Users may store their phone as '+251-91-111-2222', '0911112222',
 * '+251911112222', '251 91 111 2222', etc.
 */
const findUserByPhone = async (phone) => {
  const normalizedPhone = normalizePhone(phone) // '+251911112222'
  const digits = normalizedPhone.replace(/\D/g, '') // '251911112222'
  const localDigits = digits.slice(3) // '911112222'
  const spaced = (s) => s.split('').join('[\\s-]*')
  return User.findOne({
    $or: [
      { phoneNormalized: normalizedPhone },
      { phone: normalizedPhone },
      { phone: digits },
      { phone: '0' + localDigits },
      { phone: { $regex: new RegExp(`^\\+?251[\\s-]*${spaced(localDigits)}$`) } },
      { phone: { $regex: new RegExp(`^0?${spaced(localDigits)}$`) } }
    ]
  })
}

// Apply audit logging to auth routes
router.use(logAuthEvent)

// NOTE: Self-registration has been removed. User accounts (student, teacher,
// parent, admin) are created exclusively by admins via POST /api/admin/user.

router.post('/login', validateLogin, asyncHandler(async (req, res) => {
  const startTime = Date.now()
  const { email, password } = req.body

  console.log('🔐 Login attempt for:', email)

  // Performance checkpoint 1: Query start
  const queryStart = Date.now()
  
  // Normalize email for consistent lookup
  const normalizedEmail = email.trim().toLowerCase()
  
  const user = await User.findOne({ email: normalizedEmail }).select('+password').lean()
  const queryTime = Date.now() - queryStart
  console.log(`⏱️  MongoDB query time: ${queryTime}ms`)
  
  if (!user) {
    console.log('❌ User not found:', email)
    return res.status(401).json({ 
      success: false,
      notRegistered: true,
      message: 'This email is not registered. Please create an account first.' 
    })
  }

  // Performance checkpoint 2: Password comparison start
  const bcryptStart = Date.now()
  const isPasswordValid = await bcrypt.compare(password, user.password)
  const bcryptTime = Date.now() - bcryptStart
  console.log(`⏱️  Bcrypt comparison time: ${bcryptTime}ms`)
  
  if (!isPasswordValid) {
    console.log('❌ Invalid password for:', email)
    return res.status(401).json({ 
      success: false,
      message: 'Incorrect password. Please try again.' 
    })
  }

  // Performance checkpoint 3: JWT generation start
  const jwtStart = Date.now()
  const token = jwt.sign(
    { id: user._id, email: user.email, role: user.role },
    process.env.JWT_SECRET || 'secret',
    { expiresIn: '7d' }
  )
  const jwtTime = Date.now() - jwtStart
  console.log(`⏱️  JWT generation time: ${jwtTime}ms`)

  const totalTime = Date.now() - startTime
  console.log(`✅ Login successful for: ${email} | Role: ${user.role} | Total time: ${totalTime}ms (Query: ${queryTime}ms, Bcrypt: ${bcryptTime}ms, JWT: ${jwtTime}ms)`)

  // Return MINIMAL user data - no relationships, no extra queries
  res.json({
    success: true,
    token,
    user: {
      id: user._id,
      email: user.email,
      name: user.name,
      role: user.role,
      profilePhoto: user.profilePhoto
    }
  })
}))

// Get current user profile
router.get('/me', verifyToken, asyncHandler(async (req, res) => {
  const user = await User.findById(req.user.id).select('-password').lean()
  
  if (!user) {
    return res.status(404).json({ message: 'User not found' })
  }

  res.json({
    user: {
      id: user._id,
      email: user.email,
      name: user.name,
      role: user.role,
      profilePhoto: user.profilePhoto,
      phone: user.phone
    }
  })
}))

// Verify token endpoint
router.post('/verify', verifyToken, asyncHandler(async (req, res) => {
  res.json({
    valid: true,
    user: {
      id: req.user.id,
      email: req.user.email,
      role: req.user.role
    }
  })
}))

// ============================================
// PASSWORD RESET VIA PHONE OTP
// ============================================

// Step 1: Send OTP to registered email or phone number
router.post('/forgot-password', strictLimiter, asyncHandler(async (req, res) => {
  const { phone, email } = req.body
  
  console.log('🔐 Password reset request for:', { email, phone })
  
  if (!phone && !email) {
    return res.status(400).json({ 
      success: false,
      message: 'Email or phone number is required' 
    })
  }
  
  try {
    let user = null
    let sendMethod = null
    let identifier = null
    
    // Try to find user by email first
    if (email) {
      const normalizedEmail = email.trim().toLowerCase()
      user = await User.findOne({ email: normalizedEmail })
      if (user) {
        sendMethod = 'email'
        identifier = normalizedEmail
        console.log('📧 Found user by email:', normalizedEmail)
      }
    }
    
    // If not found by email, try phone
    if (!user && phone) {
      user = await findUserByPhone(phone)
      if (user) {
        sendMethod = 'phone'
        identifier = normalizePhone(phone)
        console.log('📱 Found user by phone:', identifier)
      }
    }
    
    if (!user) {
      console.log('⚠️ No user found')
      return res.status(404).json({
        success: false,
        notRegistered: true,
        message: 'No account found with this email/phone. Please register first.'
      })
    }
    
    // Check rate limiting (60 seconds between OTP requests)
    if (user.otpLastSentAt) {
      const timeSinceLastOTP = Date.now() - user.otpLastSentAt.getTime()
      const cooldownMs = 60 * 1000 // 60 seconds
      
      if (timeSinceLastOTP < cooldownMs) {
        const remainingSeconds = Math.ceil((cooldownMs - timeSinceLastOTP) / 1000)
        return res.status(429).json({
          success: false,
          message: `Please wait ${remainingSeconds} seconds before requesting another OTP`,
          retryAfter: remainingSeconds
        })
      }
    }
    
    // Generate OTP
    const otp = generateOTP()
    console.log('🔐 Generated OTP:', otp, 'for user:', user.email)
    
    // Hash OTP before storing
    const otpHash = await bcrypt.hash(otp, 10)
    
    // Set OTP expiration (5 minutes)
    const otpExpiresAt = new Date(Date.now() + 5 * 60 * 1000)
    
    // Update user with OTP data
    user.otpHash = otpHash
    user.otpExpiresAt = otpExpiresAt
    user.otpAttempts = 0
    user.otpLastSentAt = new Date()
    user.updatedAt = new Date()
    await user.save()
    
    // Send OTP via email or SMS based on what was provided
    let sendResult
    if (sendMethod === 'email') {
      sendResult = await sendOTPEmail(user.email, otp, user.name)
      console.log('📧 Sending OTP via email to:', user.email)
    } else {
      sendResult = await sendOTPSMS(identifier, otp)
      console.log('📱 Sending OTP via SMS to:', identifier)
    }
    
    if (!sendResult.success) {
      console.error(`❌ Failed to send OTP via ${sendMethod}:`, sendResult.error)
      return res.status(500).json({
        success: false,
        message: 'Failed to send OTP. Please try again later.'
      })
    }
    
    console.log(`✅ OTP sent successfully via ${sendMethod}`)
    
    // Return response with masked identifier
    let maskedIdentifier
    if (sendMethod === 'email') {
      const [localPart, domain] = user.email.split('@')
      maskedIdentifier = `${localPart.substring(0, 2)}***@${domain}`
    } else {
      maskedIdentifier = identifier.replace(/(\+251)(\d{2})(\d{3})(\d{4})/, '$1 $2 *** $4')
    }
    
    // Match the delivery behavior of emailService/smsService: when no real
    // provider credentials are configured, OTPs are only logged to the server
    // console, so expose them to the client to keep the flow usable.
    const isTestMode = sendMethod === 'email'
      ? !process.env.EMAIL_USER
      : (process.env.SMS_PROVIDER || 'test') === 'test'

    res.json({
      success: true,
      message: `OTP sent successfully via ${sendMethod}`,
      method: sendMethod,
      identifier: maskedIdentifier,
      testMode: isTestMode,
      // In test mode no real email/SMS is delivered, so expose the OTP
      // so users can complete the reset. Never returned in production.
      debugOtp: isTestMode ? otp : undefined
    })
    
  } catch (error) {
    console.error('❌ Error in forgot-password:', error)
    
    if (error.message.includes('Invalid') && error.message.includes('phone')) {
      return res.status(400).json({
        success: false,
        message: 'Invalid phone number format. Please use Ethiopian format (09XXXXXXXX or +251XXXXXXXXX)'
      })
    }
    
    return res.status(500).json({
      success: false,
      message: 'An error occurred. Please try again later.'
    })
  }
}))

// Step 2: Verify OTP
router.post('/verify-otp', strictLimiter, asyncHandler(async (req, res) => {
  const { phone, email, otp } = req.body
  
  console.log('🔐 OTP verification request for:', { email, phone })
  
  if ((!phone && !email) || !otp) {
    return res.status(400).json({
      success: false,
      message: 'Email/phone number and OTP are required'
    })
  }
  
  try {
    let user = null
    
    // Find user by email or phone
    if (email) {
      const normalizedEmail = email.trim().toLowerCase()
      user = await User.findOne({ email: normalizedEmail })
    } else if (phone) {
      user = await findUserByPhone(phone)
    }
    
    if (!user || !user.otpHash) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired OTP'
      })
    }
    
    // Check if OTP expired
    if (!user.otpExpiresAt || user.otpExpiresAt < new Date()) {
      console.log('⏱️ OTP expired for user:', user.email)
      return res.status(400).json({
        success: false,
        message: 'OTP has expired. Please request a new one.',
        expired: true
      })
    }
    
    // Check attempt limit
    if (user.otpAttempts >= 5) {
      console.log('🚫 Too many OTP attempts for user:', user.email)
      // Invalidate OTP
      user.otpHash = null
      user.otpExpiresAt = null
      await user.save()
      
      return res.status(429).json({
        success: false,
        message: 'Too many incorrect attempts. Please request a new OTP.'
      })
    }
    
    // Verify OTP
    const isOTPValid = await bcrypt.compare(otp, user.otpHash)
    
    if (!isOTPValid) {
      // Increment attempt counter
      user.otpAttempts += 1
      await user.save()
      
      console.log(`❌ Invalid OTP attempt ${user.otpAttempts}/5 for user:`, user.email)
      
      return res.status(400).json({
        success: false,
        message: `Invalid OTP. ${5 - user.otpAttempts} attempts remaining.`
      })
    }
    
    // OTP verified successfully
    console.log('✅ OTP verified successfully for user:', user.email)
    
    // Generate reset token (short-lived, 10 minutes)
    const resetToken = crypto.randomBytes(32).toString('hex')
    const resetTokenHash = await bcrypt.hash(resetToken, 10)
    
    user.resetToken = resetTokenHash
    user.resetTokenExpiresAt = new Date(Date.now() + 10 * 60 * 1000) // 10 minutes
    user.otpHash = null // Invalidate OTP after successful verification
    user.otpExpiresAt = null
    user.otpAttempts = 0
    user.updatedAt = new Date()
    await user.save()
    
    res.json({
      success: true,
      message: 'OTP verified successfully',
      resetToken, // Client will send this back when resetting password
      email: user.email // Send email so client knows which account
    })
    
  } catch (error) {
    console.error('❌ Error in verify-otp:', error)
    
    if (error.message.includes('Invalid') && error.message.includes('phone')) {
      return res.status(400).json({
        success: false,
        message: 'Invalid phone number format'
      })
    }
    
    return res.status(500).json({
      success: false,
      message: 'An error occurred. Please try again later.'
    })
  }
}))

// Step 3: Reset password with verified token
router.post('/reset-password', strictLimiter, asyncHandler(async (req, res) => {
  const { phone, email, resetToken, newPassword } = req.body
  
  console.log('🔑 Password reset request for:', { email, phone })
  
  if ((!phone && !email) || !resetToken || !newPassword) {
    return res.status(400).json({
      success: false,
      message: 'Email/phone, reset token, and new password are required'
    })
  }
  
  // Validate password strength
  if (newPassword.length < 6) {
    return res.status(400).json({
      success: false,
      message: 'Password must be at least 6 characters long'
    })
  }
  
  try {
    let user = null
    
    // Find user by email or phone
    if (email) {
      const normalizedEmail = email.trim().toLowerCase()
      user = await User.findOne({ email: normalizedEmail })
    } else if (phone) {
      user = await findUserByPhone(phone)
    }
    
    if (!user || !user.resetToken) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired reset token'
      })
    }
    
    // Check if reset token expired
    if (!user.resetTokenExpiresAt || user.resetTokenExpiresAt < new Date()) {
      console.log('⏱️ Reset token expired for user:', user.email)
      return res.status(400).json({
        success: false,
        message: 'Reset token has expired. Please start the process again.'
      })
    }
    
    // Verify reset token
    const isTokenValid = await bcrypt.compare(resetToken, user.resetToken)
    
    if (!isTokenValid) {
      console.log('❌ Invalid reset token for user:', user.email)
      return res.status(400).json({
        success: false,
        message: 'Invalid reset token'
      })
    }
    
    // Update password (pre-save hook will hash it)
    user.password = newPassword
    user.resetToken = null
    user.resetTokenExpiresAt = null
    user.otpHash = null
    user.otpExpiresAt = null
    user.otpAttempts = 0
    user.updatedAt = new Date()
    await user.save()
    
    console.log('✅ Password reset successfully for user:', user.email)
    
    // Send confirmation email
    await sendPasswordResetConfirmation(user.email, user.name)
    
    res.json({
      success: true,
      message: 'Password reset successfully. You can now login with your new password.'
    })
    
  } catch (error) {
    console.error('❌ Error in reset-password:', error)
    
    if (error.message.includes('Invalid') && error.message.includes('phone')) {
      return res.status(400).json({
        success: false,
        message: 'Invalid phone number format'
      })
    }
    
    return res.status(500).json({
      success: false,
      message: 'An error occurred. Please try again later.'
    })
  }
}))

// Resend OTP (with rate limiting)
router.post('/resend-otp', strictLimiter, asyncHandler(async (req, res) => {
  const { phone, email } = req.body
  
  console.log('🔄 Resend OTP request for:', { email, phone })
  
  if (!phone && !email) {
    return res.status(400).json({
      success: false,
      message: 'Email or phone number is required'
    })
  }
  
  try {
    let user = null
    let sendMethod = null
    let identifier = null
    
    // Find user by email or phone
    if (email) {
      const normalizedEmail = email.trim().toLowerCase()
      user = await User.findOne({ email: normalizedEmail })
      if (user) {
        sendMethod = 'email'
        identifier = normalizedEmail
      }
    } else if (phone) {
      user = await findUserByPhone(phone)
      if (user) {
        sendMethod = 'phone'
        identifier = normalizePhone(phone)
      }
    }
    
    if (!user) {
      console.log('⚠️ No user found')
      return res.status(404).json({
        success: false,
        notRegistered: true,
        message: 'No account found with this email/phone. Please register first.'
      })
    }
    
    // Check cooldown (60 seconds)
    if (user.otpLastSentAt) {
      const timeSinceLastOTP = Date.now() - user.otpLastSentAt.getTime()
      const cooldownMs = 60 * 1000
      
      if (timeSinceLastOTP < cooldownMs) {
        const remainingSeconds = Math.ceil((cooldownMs - timeSinceLastOTP) / 1000)
        return res.status(429).json({
          success: false,
          message: `Please wait ${remainingSeconds} seconds before requesting another OTP`,
          retryAfter: remainingSeconds
        })
      }
    }
    
    // Generate new OTP
    const otp = generateOTP()
    console.log('🔐 Generated new OTP:', otp, 'for user:', user.email)
    
    // Hash and store OTP
    const otpHash = await bcrypt.hash(otp, 10)
    const otpExpiresAt = new Date(Date.now() + 5 * 60 * 1000)
    
    user.otpHash = otpHash
    user.otpExpiresAt = otpExpiresAt
    user.otpAttempts = 0 // Reset attempts
    user.otpLastSentAt = new Date()
    user.updatedAt = new Date()
    await user.save()
    
    // Send OTP
    let sendResult
    if (sendMethod === 'email') {
      sendResult = await sendOTPEmail(user.email, otp, user.name)
    } else {
      sendResult = await sendOTPSMS(identifier, otp)
    }
    
    if (!sendResult.success) {
      return res.status(500).json({
        success: false,
        message: 'Failed to send OTP. Please try again later.'
      })
    }
    
    console.log(`✅ OTP resent successfully via ${sendMethod}`)
    
    const isTestMode = sendMethod === 'email'
      ? !process.env.EMAIL_USER
      : (process.env.SMS_PROVIDER || 'test') === 'test'

    res.json({
      success: true,
      message: `OTP resent successfully via ${sendMethod}`,
      method: sendMethod,
      testMode: isTestMode,
      debugOtp: isTestMode ? otp : undefined
    })
    
  } catch (error) {
    console.error('❌ Error in resend-otp:', error)
    
    if (error.message.includes('Invalid') && error.message.includes('phone')) {
      return res.status(400).json({
        success: false,
        message: 'Invalid phone number format'
      })
    }
    
    return res.status(500).json({
      success: false,
      message: 'An error occurred. Please try again later.'
    })
  }
}))

export default router
