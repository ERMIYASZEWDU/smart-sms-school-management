import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { motion } from 'framer-motion'
import { useAuthStore } from '../store/authStore'
import { Mail, Lock, Eye, EyeOff, BookOpen, Users, Calendar, FileText, BarChart3, Leaf } from 'lucide-react'
import { LanguageSwitcher } from '../components/LanguageSwitcher'
import apiClient from '../utils/api'

export const LoginPageNew = () => {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const login = useAuthStore((state) => state.login)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [rememberMe, setRememberMe] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    const startTime = performance.now()

    try {
      console.log('🔑 [FRONTEND] Login attempt started...', { email })
      console.log('🌐 [FRONTEND] API Base URL:', apiClient.defaults.baseURL)
      
      // Call the real backend API
      const requestStart = performance.now()
      const response = await apiClient.post('/api/auth/login', {
        email,
        password
      })
      const requestTime = performance.now() - requestStart
      console.log(`⏱️  [FRONTEND] API request time: ${requestTime.toFixed(0)}ms`)

      console.log('✅ [FRONTEND] Login successful!', response.data)

      const { token, user } = response.data

      // Store the token and user in the auth store
      const storeStart = performance.now()
      login(token, user)
      const storeTime = performance.now() - storeStart
      console.log(`⏱️  [FRONTEND] Auth store update time: ${storeTime.toFixed(0)}ms`)

      // Navigate based on user role
      const roleRoutes = {
        admin: '/admin',
        teacher: '/teacher',
        student: '/student',
        parent: '/parent',
        superadmin: '/superadmin'
      }

      const totalTime = performance.now() - startTime
      console.log(`✅ [FRONTEND] Total login time: ${totalTime.toFixed(0)}ms | Navigating to: ${roleRoutes[user.role]}`)
      
      // Navigate immediately - dashboard will load after
      navigate(roleRoutes[user.role] || '/')
    } catch (err) {
      const errorTime = performance.now() - startTime
      console.error(`❌ [FRONTEND] Login error after ${errorTime.toFixed(0)}ms:`, err)
      
      // Detailed error logging
      if (err.type === 'network_error' || err.code === 'ERR_NETWORK') {
        console.error('Network Error: Backend server is not responding')
        setError('Cannot connect to server. Server may be starting up - please wait 30 seconds and try again.')
      } else if (err.message) {
        console.error('Server responded with error:', err.status, err.message)
        setError(err.message || 'Login failed. Please check your credentials.')
      } else {
        console.error('Unexpected error:', err)
        setError('An unexpected error occurred. Please try again.')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950 flex flex-col lg:flex-row">
      {/* Mobile header */}
      <div className="lg:hidden flex items-center gap-3 px-4 py-4 bg-white/90 dark:bg-gray-900/90 border-b border-gray-200 dark:border-gray-800 justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-blue-700 rounded-full flex items-center justify-center shadow-md">
            <BookOpen size={20} className="text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-gray-800 dark:text-white">{t('auth.schoolManagement')}</h1>
            <p className="text-xs text-gray-500 dark:text-gray-400">{t('auth.signInToContinue')}</p>
          </div>
        </div>
        <LanguageSwitcher />
      </div>

      {/* Left Side - School Info */}
      <motion.div
        initial={{ opacity: 0, x: -100 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.8 }}
        className="hidden lg:flex lg:w-3/5 bg-gradient-to-br from-blue-100 via-blue-50 to-white p-12 flex-col justify-center relative overflow-hidden"
      >
        {/* Animated Background Elements */}
        <motion.div
          animate={{ 
            rotate: [0, 360],
            scale: [1, 1.2, 1]
          }}
          transition={{ 
            duration: 20, 
            repeat: Infinity, 
            ease: "linear" 
          }}
          className="absolute top-10 right-20 w-32 h-32 bg-blue-200 rounded-full opacity-20"
        />
        <motion.div
          animate={{ 
            y: [-20, 20, -20],
            rotate: [0, 10, 0]
          }}
          transition={{ 
            duration: 6, 
            repeat: Infinity, 
            ease: "easeInOut" 
          }}
          className="absolute bottom-20 left-10 w-24 h-24 bg-green-200 rounded-full opacity-30"
        />
        
        <Leaf className="absolute top-16 left-16 text-green-400 opacity-40" size={40} />

        <div className="relative z-10 max-w-2xl">
          {/* Main Title */}
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.8 }}
          >
            <h1 className="text-6xl font-bold text-gray-800 mb-4 leading-tight">
              {t('auth.schoolManagement')}
              <br />
              <span className="text-blue-600">{t('auth.system')}</span>
            </h1>
            <p className="text-2xl text-gray-600 mb-12 font-light">
              {t('auth.completeSolution')}
            </p>
          </motion.div>

          {/* Features Grid */}
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 0.8 }}
            className="grid grid-cols-2 gap-8"
          >
            {[
              { icon: Users, title: t('auth.features.students'), subtitle: t('auth.features.management'), color: 'text-blue-600' },
              { icon: Calendar, title: t('auth.features.attendance'), subtitle: t('auth.features.management'), color: 'text-green-600' },
              { icon: FileText, title: t('auth.features.examination'), subtitle: t('auth.features.management'), color: 'text-purple-600' },
              { icon: BarChart3, title: t('auth.features.reports'), subtitle: t('auth.features.analytics'), color: 'text-indigo-600' }
            ].map((feature, idx) => {
              const IconComponent = feature.icon
              return (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.8 + idx * 0.1, duration: 0.5 }}
                  whileHover={{ scale: 1.05, y: -5 }}
                  className="flex items-center gap-4 p-4 bg-white/70 rounded-xl backdrop-blur-sm shadow-sm hover:shadow-md transition-all duration-300"
                >
                  <IconComponent size={32} className={feature.color} />
                  <div>
                    <p className="font-semibold text-gray-800 text-lg">{feature.title}</p>
                    <p className="text-gray-600">{feature.subtitle}</p>
                  </div>
                </motion.div>
              )
            })}
          </motion.div>

          {/* School Building Illustration */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 1.2, duration: 0.8 }}
            className="mt-16"
          >
            <div className="relative">
              <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-2xl p-8 shadow-2xl">
                <div className="flex items-center justify-center">
                  <div className="text-white text-center">
                    <BookOpen size={64} className="mx-auto mb-4" />
                    <h3 className="text-2xl font-bold">{t('auth.welcomeToFuture')}</h3>
                    <h3 className="text-2xl font-bold">{t('auth.educationManagement')}</h3>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </motion.div>

      {/* Right Side - Login Form */}
      <motion.div
        initial={{ opacity: 0, x: 100 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.8 }}
        className="w-full lg:w-2/5 flex flex-col justify-center items-center p-6 sm:p-8 lg:p-12 bg-white dark:bg-gray-900 flex-1"
      >
        <div className="w-full max-w-md">
          {/* Header with Icon */}
          <motion.div
            initial={{ opacity: 0, y: -30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.6 }}
            className="text-center mb-10"
          >
            {/* Language switcher only shown on desktop - mobile has it in header */}
            <div className="hidden lg:flex justify-end mb-4">
              <LanguageSwitcher />
            </div>
            <motion.div
              whileHover={{ scale: 1.1, rotate: 5 }}
              className="w-20 h-20 bg-gradient-to-r from-blue-600 to-blue-700 rounded-full mx-auto mb-6 flex items-center justify-center shadow-lg"
            >
              <BookOpen size={40} className="text-white" />
            </motion.div>
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-800 dark:text-white mb-2">{t('auth.loginTitle')}</h2>
            <p className="text-gray-600 dark:text-gray-400 text-base sm:text-lg">{t('auth.loginSubtitle')}</p>
          </motion.div>

          {/* Error Message */}
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-6 p-4 bg-red-50 border-l-4 border-red-400 text-red-700 rounded-r-lg"
            >
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium">{error}</p>
                </div>
              </div>
            </motion.div>
          )}

          {/* Login Form */}
          <motion.form
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 0.6 }}
            onSubmit={handleSubmit}
            className="space-y-6"
          >
            <div>
              <label className="block text-gray-700 dark:text-gray-300 text-sm font-semibold mb-3">
                {t('auth.email')}
              </label>
              <div className="relative">
                <Mail size={20} className="absolute left-4 top-4 text-gray-400" />
                <motion.input
                  whileFocus={{ scale: 1.02 }}
                  type="text"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-12 pr-4 py-3.5 sm:py-4 border-2 border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white bg-white dark:bg-gray-800 placeholder-gray-400 focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100 dark:focus:ring-blue-900/30 transition-all duration-300"
                  placeholder={t('auth.emailPlaceholder')}
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-gray-700 dark:text-gray-300 text-sm font-semibold mb-3">
                {t('auth.password')}
              </label>
              <div className="relative">
                <Lock size={20} className="absolute left-4 top-4 text-gray-400" />
                <motion.input
                  whileFocus={{ scale: 1.02 }}
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-12 pr-12 py-3.5 sm:py-4 border-2 border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white bg-white dark:bg-gray-800 placeholder-gray-400 focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100 dark:focus:ring-blue-900/30 transition-all duration-300"
                  placeholder={t('auth.passwordPlaceholder')}
                  required
                />
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-4 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </motion.button>
              </div>
            </div>

            {/* Remember & Forgot */}
            <div className="flex items-center justify-between">
              <motion.label
                whileHover={{ scale: 1.02 }}
                className="flex items-center gap-3 cursor-pointer"
              >
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-5 h-5 rounded border-2 border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-gray-700 dark:text-gray-300 font-medium">{t('auth.rememberMe')}</span>
              </motion.label>
              <motion.a
                whileHover={{ scale: 1.05 }}
                href="/forgot-password"
                className="text-blue-600 hover:text-blue-700 font-semibold transition-colors"
              >
                {t('auth.forgotPassword')}
              </motion.a>
            </div>

            {/* Login Button */}
            <motion.button
              whileHover={{ scale: loading ? 1 : 1.02, boxShadow: loading ? "" : "0 10px 25px rgba(59, 130, 246, 0.3)" }}
              whileTap={{ scale: loading ? 1 : 0.98 }}
              type="submit"
              disabled={loading}
              className={`w-full py-4 bg-gradient-to-r from-blue-600 to-blue-700 text-white font-bold text-lg rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all duration-300 shadow-lg flex items-center justify-center gap-2 ${loading ? 'opacity-70 cursor-not-allowed' : ''}`}
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  <span>{t('auth.loggingIn')}</span>
                </>
              ) : (
                <span>{t('auth.loginButton')}</span>
              )}
            </motion.button>
          </motion.form>

          {/* Footer */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.4, duration: 0.6 }}
            className="mt-8 text-center text-gray-600 dark:text-gray-400"
          >
            <p className="text-sm">
              {t('auth.contactAdmin')}
            </p>
          </motion.div>
        </div>

        {/* Bottom Copyright */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.6, duration: 0.6 }}
          className="mt-12 text-center text-sm text-gray-500 dark:text-gray-400"
        >
          <p>{t('landing.footer')}</p>
        </motion.div>
      </motion.div>
    </div>
  )
}