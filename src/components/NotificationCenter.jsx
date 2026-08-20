import React, { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Bell, 
  Check, 
  CheckCheck, 
  X, 
  Trash2,
  BookOpen,
  Award,
  Calendar,
  Users,
  MessageSquare,
  AlertCircle,
  Info,
  CheckCircle,
  AlertTriangle
} from 'lucide-react'
import { 
  getRecentNotifications, 
  getUnreadCount, 
  markAsRead, 
  markAllAsRead,
  deleteNotification 
} from '../services/notificationApi'

export const NotificationCenter = () => {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [isOpen, setIsOpen] = useState(false)
  const [notifications, setNotifications] = useState([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [loading, setLoading] = useState(false)
  const dropdownRef = useRef(null)
  const buttonRef = useRef(null)
  const [dropdownStyle, setDropdownStyle] = useState({})

  // Fetch unread count on mount and set up polling
  useEffect(() => {
    fetchUnreadCount()
    
    // Poll for new notifications every 30 seconds
    const interval = setInterval(() => {
      fetchUnreadCount()
      if (isOpen) {
        fetchNotifications()
      }
    }, 30000)

    return () => clearInterval(interval)
  }, [isOpen])

  // Fetch notifications when dropdown opens
  useEffect(() => {
    if (isOpen) {
      fetchNotifications()
    }
  }, [isOpen])

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

  // Reposition dropdown to stay within the viewport
  const repositionDropdown = () => {
    if (!buttonRef.current) return
    const rect = buttonRef.current.getBoundingClientRect()
    const ddWidth = Math.min(384, window.innerWidth - 32) // w-96 but capped
    const gap = 8
    // Center the dropdown under the bell button
    let left = rect.left + rect.width / 2 - ddWidth / 2
    // Clamp to viewport
    if (left < 16) left = 16
    if (left + ddWidth > window.innerWidth - 16) left = window.innerWidth - ddWidth - 16
    setDropdownStyle({
      position: 'fixed',
      top: rect.bottom + gap,
      left,
      width: ddWidth,
      maxHeight: window.innerHeight - rect.bottom - gap - 32,
    })
  }

  useEffect(() => {
    if (isOpen) {
      repositionDropdown()
      window.addEventListener('resize', repositionDropdown)
      window.addEventListener('scroll', repositionDropdown, true)
      return () => {
        window.removeEventListener('resize', repositionDropdown)
        window.removeEventListener('scroll', repositionDropdown, true)
      }
    }
  }, [isOpen])

  const fetchUnreadCount = async () => {
    try {
      const count = await getUnreadCount()
      setUnreadCount(count)
    } catch (error) {
      console.error('Error fetching unread count:', error)
    }
  }

  const fetchNotifications = async () => {
    setLoading(true)
    try {
      const data = await getRecentNotifications()
      setNotifications(data || [])
    } catch (error) {
      console.error('Error fetching notifications:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleMarkAsRead = async (notificationId, actionUrl) => {
    try {
      await markAsRead(notificationId)
      
      // Update local state
      setNotifications(prev =>
        prev.map(n => n._id === notificationId ? { ...n, isRead: true } : n)
      )
      setUnreadCount(prev => Math.max(0, prev - 1))

      // Navigate if actionUrl exists
      if (actionUrl) {
        setIsOpen(false)
        navigate(actionUrl)
      }
    } catch (error) {
      console.error('Error marking notification as read:', error)
    }
  }

  const handleMarkAllAsRead = async () => {
    try {
      await markAllAsRead()
      
      // Update local state
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })))
      setUnreadCount(0)
    } catch (error) {
      console.error('Error marking all as read:', error)
    }
  }

  const handleDelete = async (notificationId, e) => {
    e.stopPropagation()
    try {
      await deleteNotification(notificationId)
      
      // Update local state
      const deletedNotification = notifications.find(n => n._id === notificationId)
      setNotifications(prev => prev.filter(n => n._id !== notificationId))
      
      if (deletedNotification && !deletedNotification.isRead) {
        setUnreadCount(prev => Math.max(0, prev - 1))
      }
    } catch (error) {
      console.error('Error deleting notification:', error)
    }
  }

  const getNotificationIcon = (type) => {
    const iconProps = { size: 18, className: 'shrink-0' }
    
    switch (type) {
      case 'assignment':
        return <BookOpen {...iconProps} className="text-blue-500" />
      case 'result':
      case 'grade':
        return <Award {...iconProps} className="text-yellow-500" />
      case 'attendance':
        return <Calendar {...iconProps} className="text-purple-500" />
      case 'class_assignment':
        return <Users {...iconProps} className="text-green-500" />
      case 'announcement':
        return <MessageSquare {...iconProps} className="text-indigo-500" />
      case 'error':
        return <AlertCircle {...iconProps} className="text-red-500" />
      case 'warning':
        return <AlertTriangle {...iconProps} className="text-orange-500" />
      case 'success':
        return <CheckCircle {...iconProps} className="text-green-500" />
      default:
        return <Info {...iconProps} className="text-gray-500" />
    }
  }

  const getTimeAgo = (date) => {
    const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000)
    
    if (seconds < 60) return t('notifications.justNow', 'Just now')
    if (seconds < 3600) return `${Math.floor(seconds / 60)}${t('notifications.minutesAgo', 'm ago')}`
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}${t('notifications.hoursAgo', 'h ago')}`
    if (seconds < 604800) return `${Math.floor(seconds / 86400)}${t('notifications.daysAgo', 'd ago')}`
    return new Date(date).toLocaleDateString()
  }

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Icon with Badge */}
      <button
        ref={buttonRef}
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
        aria-label={t('notifications.notifications', 'Notifications')}
      >
        <Bell size={20} className="text-gray-700 dark:text-gray-300" />
        {unreadCount > 0 && (
          <motion.span
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full min-w-[20px] h-5 flex items-center justify-center px-1"
          >
            {unreadCount > 99 ? '99+' : unreadCount}
          </motion.span>
        )}
      </button>

      {/* Dropdown */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            style={dropdownStyle}
            className="bg-white dark:bg-gray-800 rounded-lg shadow-2xl border border-gray-200 dark:border-gray-700 z-50 flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
              <h3 className="font-semibold text-gray-900 dark:text-white">
                {t('notifications.notifications', 'Notifications')}
                {unreadCount > 0 && (
                  <span className="ml-2 text-sm text-gray-500">
                    ({unreadCount})
                  </span>
                )}
              </h3>
              {notifications.length > 0 && unreadCount > 0 && (
                <button
                  onClick={handleMarkAllAsRead}
                  className="flex items-center gap-1 text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors"
                  title={t('notifications.markAllAsRead', 'Mark all as read')}
                >
                  <CheckCheck size={16} />
                  <span className="hidden sm:inline">{t('notifications.markAllAsRead', 'Mark all')}</span>
                </button>
              )}
            </div>

            {/* Notifications List */}
            <div className="overflow-y-auto flex-1">
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                </div>
              ) : notifications.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
                  <Bell size={48} className="text-gray-300 dark:text-gray-600 mb-3" />
                  <p className="text-gray-500 dark:text-gray-400">
                    {t('notifications.noNotifications', 'No notifications')}
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-gray-100 dark:divide-gray-700">
                  {notifications.map((notification) => (
                    <motion.div
                      key={notification._id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className={`p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors cursor-pointer relative ${
                        !notification.isRead ? 'bg-blue-50/50 dark:bg-blue-900/10' : ''
                      }`}
                      onClick={() => handleMarkAsRead(notification._id, notification.actionUrl)}
                    >
                      {/* Unread Indicator */}
                      {!notification.isRead && (
                        <div className="absolute left-2 top-1/2 -translate-y-1/2 w-2 h-2 bg-blue-600 rounded-full"></div>
                      )}

                      <div className="flex gap-3 pl-3">
                        {/* Icon */}
                        <div className="mt-1">
                          {getNotificationIcon(notification.type)}
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <h4 className="text-sm font-medium text-gray-900 dark:text-white line-clamp-1">
                              {notification.title}
                            </h4>
                            <button
                              onClick={(e) => handleDelete(notification._id, e)}
                              className="text-gray-400 hover:text-red-500 dark:hover:text-red-400 transition-colors p-1"
                              title={t('common.delete', 'Delete')}
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                          <p className="text-sm text-gray-600 dark:text-gray-300 mt-1 line-clamp-2">
                            {notification.message}
                          </p>
                          <div className="flex items-center gap-2 mt-2">
                            <span className="text-xs text-gray-500 dark:text-gray-400">
                              {getTimeAgo(notification.createdAt)}
                            </span>
                            {notification.priority === 'urgent' && (
                              <span className="text-xs px-2 py-0.5 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 rounded-full">
                                {t('notifications.urgent', 'Urgent')}
                              </span>
                            )}
                            {notification.priority === 'high' && (
                              <span className="text-xs px-2 py-0.5 bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400 rounded-full">
                                {t('notifications.high', 'High')}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>

            {/* Footer */}
            {notifications.length > 0 && (
              <div className="border-t border-gray-200 dark:border-gray-700 p-3">
                <button
                  onClick={() => {
                    setIsOpen(false)
                    navigate('/notifications')
                  }}
                  className="w-full text-center text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium transition-colors"
                >
                  {t('notifications.viewAll', 'View all notifications')}
                </button>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default NotificationCenter
