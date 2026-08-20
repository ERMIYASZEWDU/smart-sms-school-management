import express from 'express'
import { verifyToken } from '../middleware/auth.js'
import { asyncHandler } from '../middleware/errorHandler.js'
import { validatePagination, validateObjectId } from '../middleware/validator.js'
import Notification from '../models/Notification.js'
import { markNotificationAsRead, markAllNotificationsAsRead, getUnreadCount } from '../utils/notificationHelper.js'

const router = express.Router()

// Get all notifications for current user
router.get('/', verifyToken, validatePagination, asyncHandler(async (req, res) => {
  const { page = 1, limit = 20, isRead } = req.query
  const skip = (page - 1) * limit

  const query = { userId: req.user.id }
  
  if (isRead !== undefined) {
    query.isRead = isRead === 'true'
  }

  const [notifications, total] = await Promise.all([
    Notification.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .lean(),
    Notification.countDocuments(query)
  ])

  res.json({
    notifications,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      pages: Math.ceil(total / limit)
    }
  })
}))

// Get unread count
router.get('/unread-count', verifyToken, asyncHandler(async (req, res) => {
  const count = await getUnreadCount(req.user.id)
  res.json({ count })
}))

// Mark notification as read
router.patch('/:id/read', verifyToken, validateObjectId('id'), asyncHandler(async (req, res) => {
  await markNotificationAsRead(req.params.id, req.user.id)
  res.json({ message: 'Notification marked as read' })
}))

// Mark all notifications as read
router.patch('/read-all', verifyToken, asyncHandler(async (req, res) => {
  await markAllNotificationsAsRead(req.user.id)
  res.json({ message: 'All notifications marked as read' })
}))

// Delete notification
router.delete('/:id', verifyToken, validateObjectId('id'), asyncHandler(async (req, res) => {
  const notification = await Notification.findOneAndDelete({
    _id: req.params.id,
    userId: req.user.id
  })

  if (!notification) {
    return res.status(404).json({ message: 'Notification not found' })
  }

  res.json({ message: 'Notification deleted' })
}))

// Delete all read notifications
router.delete('/clear/read', verifyToken, asyncHandler(async (req, res) => {
  const result = await Notification.deleteMany({
    userId: req.user.id,
    isRead: true
  })

  res.json({ 
    message: 'Read notifications cleared',
    deletedCount: result.deletedCount
  })
}))

export default router
