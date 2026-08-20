import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Mail, ArrowLeft, Check, AlertCircle, Phone, Lock, Key } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import apiClient from '../utils/api'

export const ForgotPassword = () => {
  const navigate = useNavigate()
  const [step, setStep] = useState(1) // 1: Enter email/phone, 2: Verify OTP, 3: Reset password
  const [method, setMethod] = useState('email') // 'email' or 'phone'
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [otp, setOtp] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [resetToken, setResetToken] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [sentMethod, setSentMethod] = useState('') // Track which method was used
  const [cooldown, setCooldown] = useState(0) // OTP resend cooldown in seconds (mirrors server's 60s limit)

  // Countdown timer for the OTP resend cooldown
  useEffect(() => {
    if (cooldown <= 0) return
    const timer = setTimeout(() => setCooldown((c) => c - 1), 1000)
    return () => clearTimeout(timer)
  }, [cooldown])

  const handleSendOTP = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess('')
    
    const identifier = method === 'email' ? email : phone
    
    if (!identifier) {
      setError(`Please enter your ${method}`)
      return
    }

    try {
      setLoading(true)
      const payload = method === 'email' ? { email } : { phone }
      const response = await apiClient.post('/api/auth/forgot-password', payload)
      
      if (response.data.success) {
        setSentMethod(response.data.method || method)
        const methodText = response.data.method === 'email' ? 'email' : 'phone number'
        const testMsg = response.data.testMode
          ? `⚠️ TEST MODE: Your OTP is ${response.data.debugOtp}`
          : ''
        setSuccess(`OTP sent to your ${methodText}. ${testMsg}`)
        setCooldown(60)
        setStep(2)
      }
    } catch (err) {
      if (err.notRegistered || err.response?.data?.notRegistered) {
        setError(err.message || err.response?.data?.message || 'No account found. Contact your school administrator to get access.')
      } else if (err.status === 429 && err.retryAfter) {
        setError(err.message || 'Too many requests. Please try again later.')
        setCooldown(err.retryAfter)
      } else {
        setError(err.message || err.response?.data?.message || `Failed to send OTP. Please check your ${method}.`)
      }
    } finally {
      setLoading(false)
    }
  }

  const handleVerifyOTP = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess('')
    
    if (!otp) {
      setError('Please enter the OTP')
      return
    }

    try {
      setLoading(true)
      const payload = method === 'email' ? { email, otp } : { phone, otp }
      const response = await apiClient.post('/api/auth/verify-otp', payload)
      
      if (response.data.success) {
        setResetToken(response.data.resetToken)
        // If email wasn't provided initially, get it from response
        if (response.data.email && !email) {
          setEmail(response.data.email)
        }
        setSuccess('OTP verified successfully')
        setStep(3)
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid OTP. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleResetPassword = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess('')
    
    if (!newPassword || !confirmPassword) {
      setError('Please fill in all fields')
      return
    }

    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters')
      return
    }

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match')
      return
    }

    try {
      setLoading(true)
      const payload = {
        resetToken,
        newPassword
      }
      // Include email or phone
      if (email) payload.email = email
      if (phone) payload.phone = phone
      
      const response = await apiClient.post('/api/auth/reset-password', payload)
      
      if (response.data.success) {
        setSuccess('Password reset successfully! Redirecting to login...')
        setTimeout(() => {
          navigate('/login')
        }, 2000)
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to reset password. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleResendOTP = async () => {
    setError('')
    setSuccess('')
    
    try {
      setLoading(true)
      const payload = method === 'email' ? { email } : { phone }
      const response = await apiClient.post('/api/auth/resend-otp', payload)
      
      if (response.data.success) {
        const methodText = response.data.method === 'email' ? 'email' : 'phone number'
        const testMsg = response.data.testMode
          ? `⚠️ TEST MODE: Your new OTP is ${response.data.debugOtp}`
          : ''
        setSuccess(`New OTP sent to your ${methodText}. ${testMsg}`)
        setCooldown(60)
      }
    } catch (err) {
      if (err.status === 429) {
        setError(err.message || 'Too many requests. Please try again later.')
        if (err.retryAfter) setCooldown(err.retryAfter)
      } else {
        setError('Failed to resend OTP. Please try again.')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        {/* Back to Login */}
        <motion.button
          whileHover={{ x: -5 }}
          onClick={() => navigate('/login')}
          className="flex items-center gap-2 text-gray-600 dark:text-gray-400 mb-6 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
        >
          <ArrowLeft size={20} />
          <span>Back to Login</span>
        </motion.button>

        {/* Card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-8"
        >
          {/* Icon */}
          <div className="flex justify-center mb-6">
            <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center">
              {step === 1 && <Phone className="w-8 h-8 text-blue-600" />}
              {step === 2 && <Key className="w-8 h-8 text-blue-600" />}
              {step === 3 && <Lock className="w-8 h-8 text-blue-600" />}
            </div>
          </div>

          {/* Title */}
          <h2 className="text-2xl font-bold text-center text-gray-800 dark:text-white mb-2">
            {step === 1 && 'Forgot Password'}
            {step === 2 && 'Verify OTP'}
            {step === 3 && 'Reset Password'}
          </h2>
          <p className="text-center text-gray-600 dark:text-gray-400 mb-6 text-sm">
            {step === 1 && `Enter your email to receive an OTP`}
            {step === 2 && `Enter the OTP code sent to your ${sentMethod === 'email' ? 'email' : 'phone'}`}
            {step === 3 && 'Create a new password for your account'}
          </p>

          {/* Progress Steps */}
          <div className="flex justify-between mb-8">
            {[1, 2, 3].map((s) => (
              <div key={s} className="flex items-center flex-1">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-colors ${
                    step >= s
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-200 dark:bg-gray-700 text-gray-500'
                  }`}
                >
                  {step > s ? <Check size={16} /> : s}
                </div>
                {s < 3 && (
                  <div
                    className={`h-1 flex-1 mx-2 rounded transition-colors ${
                      step > s ? 'bg-blue-600' : 'bg-gray-200 dark:bg-gray-700'
                    }`}
                  />
                )}
              </div>
            ))}
          </div>

          {/* Error/Success Messages */}
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-center gap-2 text-red-700 dark:text-red-400 text-sm"
            >
              <AlertCircle size={18} />
              <span>{error}</span>
            </motion.div>
          )}

          {success && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-4 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg flex items-center gap-2 text-green-700 dark:text-green-400 text-sm"
            >
              <Check size={18} />
              <div>
                <p className="font-semibold">{success}</p>

              </div>
            </motion.div>
          )}

          {/* Step 1: Enter Email or Phone */}
          {step === 1 && (
            <form onSubmit={handleSendOTP} className="space-y-4">
              {/* Method Selector */}
              <div className="flex gap-2 mb-4">
                <button
                  type="button"
                  onClick={() => setMethod('email')}
                  className={`flex-1 py-2 px-4 rounded-lg font-medium transition-colors flex items-center justify-center gap-2 ${
                    method === 'email'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
                  }`}
                >
                  <Mail size={18} />
                  <span>Email</span>
                </button>
                <button
                  type="button"
                  onClick={() => setMethod('phone')}
                  className={`flex-1 py-2 px-4 rounded-lg font-medium transition-colors flex items-center justify-center gap-2 ${
                    method === 'phone'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
                  }`}
                >
                  <Phone size={18} />
                  <span>Phone</span>
                </button>
              </div>

              {/* Info Banner */}
              <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg text-blue-700 dark:text-blue-400 text-xs">
                <p><strong>📧 OTP Delivery:</strong> Choose email or phone. In test mode, the OTP is logged to the server console — check it there if you don't receive a message.</p>
              </div>

              {/* Email Input */}
              {method === 'email' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3.5 text-gray-400" size={18} />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="Enter your email address"
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      required
                    />
                  </div>
                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                    OTP will be sent to your email (check spam folder too)
                  </p>
                </div>
              )}

              {/* Phone Input */}
              {method === 'phone' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Phone Number
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-3.5 text-gray-400" size={18} />
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="09XXXXXXXX or +251XXXXXXXXX"
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      required
                    />
                  </div>
                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                    Enter the phone number registered with your account
                  </p>
                </div>
              )}

              <button
                type="submit"
                disabled={loading || cooldown > 0}
                className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    <span>Sending OTP...</span>
                  </>
                ) : cooldown > 0 ? (
                  <span>Resend OTP in {cooldown}s</span>
                ) : (
                  <span>Send OTP</span>
                )}
              </button>
            </form>
          )}

          {/* Step 2: Verify OTP */}
          {step === 2 && (
            <form onSubmit={handleVerifyOTP} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  OTP Code
                </label>
                <div className="relative">
                  <Key className="absolute left-3 top-3.5 text-gray-400" size={18} />
                  <input
                    type="text"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                    placeholder="Enter 6-digit OTP"
                    maxLength={6}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-center text-2xl tracking-widest font-mono"
                    required
                  />
                </div>
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  {sentMethod === 'email' ? `OTP sent to ${email}` : `OTP sent to ${phone}`}
                </p>
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="flex-1 py-3 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 font-semibold rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                >
                  Back
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                      <span>Verifying...</span>
                    </>
                  ) : (
                    <span>Verify OTP</span>
                  )}
                </button>
              </div>

              <button
                type="button"
                onClick={handleResendOTP}
                disabled={loading || cooldown > 0}
                className="w-full text-sm text-blue-600 dark:text-blue-400 hover:underline disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {cooldown > 0 ? `Resend OTP in ${cooldown}s` : "Didn't receive OTP? Resend"}
              </button>
            </form>
          )}

          {/* Step 3: Reset Password */}
          {step === 3 && (
            <form onSubmit={handleResetPassword} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  New Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3.5 text-gray-400" size={18} />
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Enter new password"
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Confirm Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3.5 text-gray-400" size={18} />
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Confirm new password"
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    required
                  />
                </div>
              </div>

              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3 text-xs text-blue-700 dark:text-blue-400">
                <p className="font-semibold mb-1">Password Requirements:</p>
                <ul className="list-disc list-inside space-y-1">
                  <li>At least 6 characters long</li>
                  <li>Both passwords must match</li>
                </ul>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    <span>Resetting Password...</span>
                  </>
                ) : (
                  <span>Reset Password</span>
                )}
              </button>
            </form>
          )}
        </motion.div>

        {/* Help Text */}
        <p className="text-center text-gray-600 dark:text-gray-400 text-sm mt-6">
          Need help? Contact your school administrator
        </p>
      </motion.div>
    </div>
  )
}
