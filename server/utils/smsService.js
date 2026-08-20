/**
 * SMS Service for sending OTP messages
 * Supports Ethiopian phone numbers (+251)
 * 
 * SMS Provider: Africa's Talking / Twilio / Custom
 * Environment Variables Required:
 * - SMS_PROVIDER: 'africas_talking' | 'twilio' | 'test'
 * - SMS_API_KEY
 * - SMS_API_SECRET (if needed)
 * - SMS_SENDER_ID
 */

import crypto from 'crypto'

/**
 * Normalize Ethiopian phone number to +251XXXXXXXXX format
 * @param {string} phone - Phone number in various formats
 * @returns {string} Normalized phone number
 */
export const normalizePhone = (phone) => {
  if (!phone) return null
  
  // Remove all non-digit characters
  let cleaned = phone.replace(/\D/g, '')
  
  // Handle Ethiopian numbers
  if (cleaned.startsWith('251')) {
    // +251XXXXXXXXX or 251XXXXXXXXX
    cleaned = cleaned.substring(3)
  } else if (cleaned.startsWith('0')) {
    // 09XXXXXXXX
    cleaned = cleaned.substring(1)
  }
  
  // Validate length (Ethiopian mobile: 9 digits after country code)
  if (cleaned.length !== 9) {
    throw new Error('Invalid Ethiopian phone number format')
  }
  
  return `+251${cleaned}`
}

/**
 * Generate a secure 6-digit OTP
 * @returns {string} 6-digit OTP
 */
export const generateOTP = () => {
  // Use crypto for secure random number generation
  const buffer = crypto.randomBytes(4)
  const number = buffer.readUInt32BE(0)
  const otp = String(number % 1000000).padStart(6, '0')
  return otp
}

/**
 * Send SMS using configured provider
 * @param {string} phone - Normalized phone number
 * @param {string} message - SMS message content
 * @returns {Promise<{success: boolean, messageId?: string, error?: string}>}
 */
export const sendSMS = async (phone, message) => {
  const provider = process.env.SMS_PROVIDER || 'test'
  
  console.log(`📱 SMS Provider: ${provider}`)
  console.log(`📱 Sending SMS to: ${phone}`)
  
  try {
    switch (provider) {
      case 'africas_talking':
        return await sendViaAfricasTalking(phone, message)
      
      case 'twilio':
        return await sendViaTwilio(phone, message)
      
      case 'test':
      default:
        return await sendViaTestMode(phone, message)
    }
  } catch (error) {
    console.error('❌ SMS sending failed:', error.message)
    return {
      success: false,
      error: error.message
    }
  }
}

/**
 * Send SMS via Africa's Talking
 * Good for Ethiopian numbers
 */
const sendViaAfricasTalking = async (phone, message) => {
  const apiKey = process.env.SMS_API_KEY
  const username = process.env.SMS_USERNAME || 'sandbox'
  
  if (!apiKey) {
    throw new Error('SMS_API_KEY not configured')
  }
  
  // Africa's Talking API endpoint
  const url = 'https://api.africastalking.com/version1/messaging'
  
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'apiKey': apiKey,
      'Accept': 'application/json'
    },
    body: new URLSearchParams({
      username,
      to: phone,
      message,
      from: process.env.SMS_SENDER_ID || 'SmartSMS'
    })
  })
  
  const data = await response.json()
  
  if (data.SMSMessageData && data.SMSMessageData.Recipients && data.SMSMessageData.Recipients.length > 0) {
    const recipient = data.SMSMessageData.Recipients[0]
    if (recipient.statusCode === 101) {
      return {
        success: true,
        messageId: recipient.messageId
      }
    }
  }
  
  throw new Error(data.SMSMessageData?.Message || 'SMS sending failed')
}

/**
 * Send SMS via Twilio
 * Alternative provider
 */
const sendViaTwilio = async (phone, message) => {
  const accountSid = process.env.TWILIO_ACCOUNT_SID
  const authToken = process.env.TWILIO_AUTH_TOKEN
  const fromNumber = process.env.TWILIO_PHONE_NUMBER
  
  if (!accountSid || !authToken || !fromNumber) {
    throw new Error('Twilio credentials not configured')
  }
  
  const url = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`
  
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': 'Basic ' + Buffer.from(`${accountSid}:${authToken}`).toString('base64'),
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: new URLSearchParams({
      To: phone,
      From: fromNumber,
      Body: message
    })
  })
  
  const data = await response.json()
  
  if (data.sid) {
    return {
      success: true,
      messageId: data.sid
    }
  }
  
  throw new Error(data.message || 'SMS sending failed')
}

/**
 * Test mode - logs OTP to console instead of sending SMS
 * Use for development/testing
 */
const sendViaTestMode = async (phone, message) => {
  console.log('📱 ================== TEST MODE SMS ==================')
  console.log(`📱 To: ${phone}`)
  console.log(`📱 Message: ${message}`)
  console.log('📱 ===================================================')
  
  // In test mode, always succeed
  return {
    success: true,
    messageId: `test-${Date.now()}`
  }
}

/**
 * Send OTP SMS
 * @param {string} phone - Normalized phone number
 * @param {string} otp - 6-digit OTP
 * @returns {Promise<{success: boolean}>}
 */
export const sendOTPSMS = async (phone, otp) => {
  const message = `Your Smart SMS verification code is: ${otp}. Valid for 5 minutes. Do not share this code.`
  
  const result = await sendSMS(phone, message)
  
  if (result.success) {
    console.log(`✅ OTP SMS sent successfully to ${phone}`)
  } else {
    console.error(`❌ Failed to send OTP SMS to ${phone}:`, result.error)
  }
  
  return result
}
