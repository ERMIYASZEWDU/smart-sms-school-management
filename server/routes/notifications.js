import express from 'express'
import { verifyToken } from '../middleware/auth.js'
import Notification from '../models/Notification.js'
import { getUnreadCount, markAsRead, markAllAsRead } from '../services/notificationService.js'

const router = express.Router()

// Apply authentication to all routes
router.use(verifyToken)

/**
 * GET /api/notifications
 * Get notifications for authenticated user (paginated)
 */
router.get('/', async (req, res) => {
  try {
    const userId = req.user.id
    const { page = 1, limit = 20, unreadOnly = 'false' } = req.query

    const query = { recipientUserId: userId }
    
    // Filter for unread only if requested
    if (unreadOnly === 'true') {
      query.isRead = false
    }

    const skip = (parseInt(page) - 1) * parseInt(limit)

    const [notifications, total] = await Promise.all([
      Notification.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .populate('senderUserId', 'name email')
        .lean(),
      Notification.countDocuments(query)
    ])

    res.json({
      notifications,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    })
  } catch (error) {
    console.error('❌ Error fetching notifications:', error)
    res.status(500).json({ error: 'Failed to fetch notifications' })
  }
})

/**
 * GET /api/notifications/unread-count
 * Get count of unread notifications for authenticated user
 */
router.get('/unread-count', async (req, res) => {
  try {
    const userId = req.user.id
    const count = await getUnreadCount(userId)
    res.json({ count })
  } catch (error) {
    console.error('❌ Error getting unread count:', error)
    res.status(500).json({ error: 'Failed to get unread count' })
  }
})

/**
 * PUT /api/notifications/:id/read
 * Mark a notification as read
 */
router.put('/:id/read', async (req, res) => {
  try {
    const userId = req.user.id
    const { id } = req.params

    // Verify the notification belongs to the user
    const notification = await Notification.findOne({
      _id: id,
      recipientUserId: userId
    })

    if (!notification) {
      return res.status(404).json({ error: 'Notification not found' })
    }

    // Mark as read
    notification.isRead = true
    notification.readAt = new Date()
    await notification.save()

    res.json({ 
      message: 'Notification marked as read',
      notification 
    })
  } catch (error) {
    console.error('❌ Error marking notification as read:', error)
    res.status(500).json({ error: 'Failed to mark notification as read' })
  }
})

/**
 * PUT /api/notifications/read-all
 * Mark all notifications as read for authenticated user
 */
router.put('/read-all', async (req, res) => {
  try {
    const userId = req.user.id
    const result = await markAllAsRead(userId)

    res.json({ 
      message: 'All notifications marked as read',
      modifiedCount: result.modifiedCount 
    })
  } catch (error) {
    console.error('❌ Error marking all notifications as read:', error)
    res.status(500).json({ error: 'Failed to mark all notifications as read' })
  }
})

/**
 * DELETE /api/notifications/:id
 * Delete a notification (soft delete or hard delete based on preference)
 */
router.delete('/:id', async (req, res) => {
  try {
    const userId = req.user.id
    const { id } = req.params

    // Verify the notification belongs to the user
    const notification = await Notification.findOneAndDelete({
      _id: id,
      recipientUserId: userId
    })

    if (!notification) {
      return res.status(404).json({ error: 'Notification not found' })
    }

    res.json({ message: 'Notification deleted successfully' })
  } catch (error) {
    console.error('❌ Error deleting notification:', error)
    res.status(500).json({ error: 'Failed to delete notification' })
  }
})

/**
 * GET /api/notifications/recent
 * Get recent notifications (last 10) for quick access in navbar
 */
router.get('/recent', async (req, res) => {
  try {
    const userId = req.user.id

    const notifications = await Notification.find({ recipientUserId: userId })
      .sort({ createdAt: -1 })
      .limit(10)
      .populate('senderUserId', 'name email')
      .lean()

    res.json({ notifications })
  } catch (error) {
    console.error('❌ Error fetching recent notifications:', error)
    res.status(500).json({ error: 'Failed to fetch recent notifications' })
  }
})

export default router
