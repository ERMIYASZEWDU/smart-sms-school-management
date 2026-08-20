/**
 * Notification Helper
 * Centralized notification creation for various events
 */
import Notification from '../models/Notification.js'
import Student from '../models/Student.js'
import Parent from '../models/Parent.js'

/**
 * Create a notification for a user
 */
export const createNotification = async ({
  userId,
  title,
  message,
  type = 'info',
  relatedEntity = {},
  priority = 'normal',
  actionUrl = null,
  expiresAt = null
}) => {
  try {
    const notification = new Notification({
      userId,
      title,
      message,
      type,
      relatedEntity,
      priority,
      actionUrl,
      expiresAt
    })
    
    await notification.save()
    return notification
  } catch (error) {
    console.error('Error creating notification:', error)
    return null
  }
}

/**
 * Create notifications for multiple users
 */
export const createBulkNotifications = async (userIds, notificationData) => {
  try {
    const notifications = userIds.map(userId => ({
      userId,
      ...notificationData,
      createdAt: new Date()
    }))
    
    await Notification.insertMany(notifications)
    return notifications.length
  } catch (error) {
    console.error('Error creating bulk notifications:', error)
    return 0
  }
}

/**
 * Notify when a new grade is added
 */
export const notifyNewGrade = async (studentId, grade) => {
  try {
    // Get student and their parents
    const student = await Student.findById(studentId)
      .populate('userId', '_id')
      .populate('parentIds', 'userId')
      .lean()
    
    if (!student) return

    const notifications = []

    // Notify student
    if (student.userId) {
      notifications.push({
        userId: student.userId._id,
        title: 'New Grade Posted',
        message: `You received a grade of ${grade.score}/${grade.maxScore || 100} in ${grade.subject}`,
        type: 'grade',
        relatedEntity: {
          entityType: 'grade',
          entityId: grade._id
        },
        actionUrl: '/student/grades'
      })
    }

    // Notify parents
    if (student.parentIds && student.parentIds.length > 0) {
      for (const parent of student.parentIds) {
        if (parent.userId) {
          notifications.push({
            userId: parent.userId,
            title: `New Grade: ${student.name}`,
            message: `${student.name} received a grade of ${grade.score}/${grade.maxScore || 100} in ${grade.subject}`,
            type: 'grade',
            relatedEntity: {
              entityType: 'grade',
              entityId: grade._id
            },
            actionUrl: `/parent/child/${studentId}/grades`
          })
        }
      }
    }

    if (notifications.length > 0) {
      await Notification.insertMany(notifications)
    }
  } catch (error) {
    console.error('Error notifying grade:', error)
  }
}

/**
 * Notify about attendance
 */
export const notifyAttendance = async (studentId, attendance) => {
  try {
    // Only notify for absences
    if (attendance.status !== 'absent') return

    const student = await Student.findById(studentId)
      .populate('userId', '_id')
      .populate('parentIds', 'userId')
      .lean()
    
    if (!student) return

    const notifications = []
    const dateStr = new Date(attendance.date).toLocaleDateString()

    // Notify student
    if (student.userId) {
      notifications.push({
        userId: student.userId._id,
        title: 'Attendance Alert',
        message: `You were marked absent on ${dateStr}`,
        type: 'attendance',
        priority: 'high',
        relatedEntity: {
          entityType: 'attendance',
          entityId: attendance._id
        },
        actionUrl: '/student/attendance'
      })
    }

    // Notify parents
    if (student.parentIds && student.parentIds.length > 0) {
      for (const parent of student.parentIds) {
        if (parent.userId) {
          notifications.push({
            userId: parent.userId,
            title: `Attendance Alert: ${student.name}`,
            message: `${student.name} was marked absent on ${dateStr}`,
            type: 'attendance',
            priority: 'high',
            relatedEntity: {
              entityType: 'attendance',
              entityId: attendance._id
            },
            actionUrl: `/parent/child/${studentId}/attendance`
          })
        }
      }
    }

    if (notifications.length > 0) {
      await Notification.insertMany(notifications)
    }
  } catch (error) {
    console.error('Error notifying attendance:', error)
  }
}

/**
 * Notify about new assignment
 */
export const notifyNewAssignment = async (assignment, studentIds) => {
  try {
    const students = await Student.find({ _id: { $in: studentIds } })
      .populate('userId', '_id')
      .lean()
    
    const dueDate = new Date(assignment.dueDate).toLocaleDateString()
    const notifications = []

    for (const student of students) {
      if (student.userId) {
        notifications.push({
          userId: student.userId._id,
          title: 'New Assignment',
          message: `${assignment.title} - Due: ${dueDate}`,
          type: 'assignment',
          relatedEntity: {
            entityType: 'assignment',
            entityId: assignment._id
          },
          actionUrl: '/student/assignments'
        })
      }
    }

    if (notifications.length > 0) {
      await Notification.insertMany(notifications)
    }
  } catch (error) {
    console.error('Error notifying assignment:', error)
  }
}

/**
 * Notify about announcement
 */
export const notifyAnnouncement = async (announcement) => {
  try {
    // This would be expanded based on announcement targetRole and targetClass
    console.log('Announcement notification created:', announcement.title)
    // Implementation depends on your specific requirements
  } catch (error) {
    console.error('Error notifying announcement:', error)
  }
}

/**
 * Mark notification as read
 */
export const markNotificationAsRead = async (notificationId, userId) => {
  try {
    await Notification.findOneAndUpdate(
      { _id: notificationId, userId },
      { isRead: true, readAt: new Date() }
    )
  } catch (error) {
    console.error('Error marking notification as read:', error)
  }
}

/**
 * Mark all notifications as read for a user
 */
export const markAllNotificationsAsRead = async (userId) => {
  try {
    await Notification.updateMany(
      { userId, isRead: false },
      { isRead: true, readAt: new Date() }
    )
  } catch (error) {
    console.error('Error marking all notifications as read:', error)
  }
}

/**
 * Get unread notification count
 */
export const getUnreadCount = async (userId) => {
  try {
    return await Notification.countDocuments({ userId, isRead: false })
  } catch (error) {
    console.error('Error getting unread count:', error)
    return 0
  }
}
