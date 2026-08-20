import React from 'react'
import { useTranslation } from 'react-i18next'
import { Menu, Moon, Sun, LogOut, ChevronDown, User } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { getInitialTheme, toggleTheme } from '../../utils/theme'
import { resolvePhotoUrl } from '../../utils/api'
import { LanguageSwitcher } from '../LanguageSwitcher'
import { NotificationCenter } from '../NotificationCenter'

export const Header = ({ toggleSidebar, user, onLogout, sidebarOpen, isMobile }) => {
  const { t, i18n } = useTranslation()
  const navigate = useNavigate()
  const [isDark, setIsDark] = React.useState(() => getInitialTheme() === 'dark')
  const [profileOpen, setProfileOpen] = React.useState(false)
  const profileRef = React.useRef(null)

  // Close profile dropdown when clicking outside
  React.useEffect(() => {
    const handleClickOutside = (event) => {
      if (profileRef.current && !profileRef.current.contains(event.target)) {
        setProfileOpen(false)
      }
    }

    if (profileOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [profileOpen])

  const handleNavigateProfile = () => {
    setProfileOpen(false)
    navigate(`/${user?.role}/profile`)
  }

  const handleLogout = () => {
    setProfileOpen(false)
    onLogout()
  }

  const handleToggleDarkMode = () => {
    const next = toggleTheme()
    setIsDark(next === 'dark')
  }

  return (
    <motion.header
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className={`fixed top-0 right-0 z-30 bg-white/95 dark:bg-gray-900/95 backdrop-blur-md border-b border-gray-200 dark:border-gray-800 h-16 flex items-center px-4 md:px-6 shadow-sm transition-all duration-300 ${
        sidebarOpen && !isMobile ? 'left-64' : 'left-0'
      }`}
    >
      <div className="flex items-center justify-between w-full gap-3">
        <button
          onClick={toggleSidebar}
          aria-label="Toggle sidebar"
          className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
        >
          <Menu size={20} className="text-gray-700 dark:text-gray-300" />
        </button>

        <div className="flex items-center gap-2 sm:gap-3 md:gap-4 min-w-0">
          {/* Notification Center */}
          <NotificationCenter />

          {/* Language Switcher - Single instance */}
          <LanguageSwitcher />

          <button
            onClick={handleToggleDarkMode}
            aria-label="Toggle dark mode"
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition text-gray-700 dark:text-gray-300 shrink-0"
          >
            {isDark ? <Sun size={18} /> : <Moon size={18} />}
          </button>

          <div className="relative shrink-0" ref={profileRef}>
            <button
              onClick={() => setProfileOpen(!profileOpen)}
              aria-label="User menu"
              aria-haspopup="menu"
              aria-expanded={profileOpen}
              className="flex items-center gap-2 sm:gap-3 pl-3 sm:pl-4 border-l border-gray-200 dark:border-gray-700 rounded-lg py-1 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            >
              <div className="hidden sm:block text-right min-w-0">
                <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{user?.name}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400 capitalize">{user?.role}</p>
              </div>
              <img
                src={user?.profilePhoto ? resolvePhotoUrl(user.profilePhoto) : `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='40' height='40' viewBox='0 0 40 40'%3E%3Crect width='40' height='40' rx='20' fill='%236366f1'/%3E%3Ctext x='20' y='26' text-anchor='middle' font-size='18' font-family='Arial,sans-serif' font-weight='bold' fill='white'%3E${encodeURIComponent((user?.name || 'U').charAt(0).toUpperCase())}%3C/text%3E%3C/svg%3E`}
                alt="Profile"
                className="w-8 h-8 md:w-10 md:h-10 rounded-full object-cover border-2 border-gray-200 dark:border-gray-700"
              />
              <ChevronDown
                size={16}
                className={`hidden sm:block text-gray-500 dark:text-gray-400 transition-transform ${profileOpen ? 'rotate-180' : ''}`}
              />
            </button>

            <AnimatePresence>
              {profileOpen && (
                <motion.div
                  initial={{ opacity: 0, y: -10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -10, scale: 0.95 }}
                  transition={{ duration: 0.2 }}
                  className="absolute right-0 mt-2 w-56 bg-white dark:bg-gray-800 rounded-lg shadow-2xl border border-gray-200 dark:border-gray-700 z-50 overflow-hidden"
                >
                  <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700">
                    <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{user?.name}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 capitalize">{user?.role}</p>
                  </div>

                  {user?.role !== 'superadmin' && (
                    <button
                      onClick={handleNavigateProfile}
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700/50 transition-colors"
                    >
                      <User size={16} className="text-gray-500 dark:text-gray-400 shrink-0" />
                      {t('nav.profile', 'Profile')}
                    </button>
                  )}

                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 transition-colors border-t border-gray-100 dark:border-gray-700"
                  >
                    <LogOut size={16} className="shrink-0" />
                    {t('nav.logout', 'Logout')}
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </motion.header>
  )
}
