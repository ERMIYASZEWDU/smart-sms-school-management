import mongoose from 'mongoose'

const notificationSchema = new mongoose.Schema({
  recipientUserId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  senderUserId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  type: { 
    type: String, 
    enum: [
      'info', 
      'success', 
      'warning', 
      'error', 
      'announcement', 
      'grade', 
      'result',
      'attendance', 
      'assignment', 
      'class_assignment',
      'student_enrollment',
      'teacher_message',
      'admin_message',
      'parent_message',
      'timetable_change',
      'exam'
    ],
    default: 'info'
  },
  title: { type: String, required: true },
  message: { type: String, required: true },
  relatedEntity: { 
    type: String, 
    enum: ['student', 'teacher', 'class', 'grade', 'attendance', 'assignment', 'announcement', 'result', 'subject', 'exam', 'timetable', null],
    default: null
  },
  relatedEntityId: { type: mongoose.Schema.Types.ObjectId, default: null },
  isRead: { type: Boolean, default: false },
  readAt: { type: Date, default: null },
  priority: { type: String, enum: ['low', 'normal', 'high', 'urgent'], default: 'normal' },
  actionUrl: { type: String, default: null }, // URL to navigate when clicked
  metadata: { type: mongoose.Schema.Types.Mixed, default: {} }, // Additional data (class name, subject name, etc.)
  createdAt: { type: Date, default: Date.now },
  expiresAt: { type: Date, default: null }
})

// Compound indexes for efficient queries
notificationSchema.index({ recipientUserId: 1, isRead: 1, createdAt: -1 })
notificationSchema.index({ recipientUserId: 1, createdAt: -1 })
notificationSchema.index({ recipientUserId: 1, type: 1 })
notificationSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 }) // Auto-delete expired notifications

export default mongoose.models.Notification || mongoose.model('Notification', notificationSchema)
