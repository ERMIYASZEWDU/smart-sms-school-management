import apiClient from '../utils/api'

/**
 * Notification API Service
 * Handles all notification-related API calls
 */

/**
 * Get paginated notifications for authenticated user
 */
export const getNotifications = async (page = 1, limit = 20, unreadOnly = false) => {
  const response = await apiClient.get('/api/notifications', {
    params: { page, limit, unreadOnly: unreadOnly ? 'true' : 'false' }
  })
  return response.data
}

/**
 * Get recent notifications (last 10) for navbar
 */
export const getRecentNotifications = async () => {
  const response = await apiClient.get('/api/notifications/recent')
  return response.data.notifications
}

/**
 * Get unread notification count
 */
export const getUnreadCount = async () => {
  const response = await apiClient.get('/api/notifications/unread-count')
  return response.data.count
}

/**
 * Mark a notification as read
 */
export const markAsRead = async (notificationId) => {
  const response = await apiClient.put(`/api/notifications/${notificationId}/read`)
  return response.data
}

/**
 * Mark all notifications as read
 */
export const markAllAsRead = async () => {
  const response = await apiClient.put('/api/notifications/read-all')
  return response.data
}

/**
 * Delete a notification
 */
export const deleteNotification = async (notificationId) => {
  const response = await apiClient.delete(`/api/notifications/${notificationId}`)
  return response.data
}

/**
 * Get announcements for authenticated user
 */
export const getAnnouncements = async (page = 1, limit = 20) => {
  const response = await apiClient.get('/api/announcements', {
    params: { page, limit }
  })
  return response.data
}

/**
 * Get a specific announcement
 */
export const getAnnouncement = async (announcementId) => {
  const response = await apiClient.get(`/api/announcements/${announcementId}`)
  return response.data.announcement
}

/**
 * Create an announcement (Admin only)
 */
export const createAnnouncement = async (announcementData) => {
  const response = await apiClient.post('/api/announcements', announcementData)
  return response.data
}

/**
 * Update an announcement (Admin only)
 */
export const updateAnnouncement = async (announcementId, announcementData) => {
  const response = await apiClient.put(`/api/announcements/${announcementId}`, announcementData)
  return response.data
}

/**
 * Delete an announcement (Admin only)
 */
export const deleteAnnouncement = async (announcementId) => {
  const response = await apiClient.delete(`/api/announcements/${announcementId}`)
  return response.data
}

/**
 * Get all announcements (Admin only)
 */
export const getAllAnnouncements = async (page = 1, limit = 20) => {
  const response = await apiClient.get('/api/announcements/admin/all', {
    params: { page, limit }
  })
  return response.data
}

export default {
  getNotifications,
  getRecentNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  getAnnouncements,
  getAnnouncement,
  createAnnouncement,
  updateAnnouncement,
  deleteAnnouncement,
  getAllAnnouncements
}
