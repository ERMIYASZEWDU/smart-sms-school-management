import Notification from '../models/Notification.js'
import User from '../models/User.js'
import Student from '../models/Student.js'
import Teacher from '../models/Teacher.js'
import Parent from '../models/Parent.js'

/**
 * Notification Service
 * Handles creation of targeted notifications for different user roles and events
 */

/**
 * Create a notification for a specific user
 */
export const createNotification = async ({
  recipientUserId,
  senderUserId = null,
  type = 'info',
  title,
  message,
  relatedEntity = null,
  relatedEntityId = null,
  priority = 'normal',
  actionUrl = null,
  metadata = {},
  expiresAt = null
}) => {
  try {
    const notification = await Notification.create({
      recipientUserId,
      senderUserId,
      type,
      title,
      message,
      relatedEntity,
      relatedEntityId,
      priority,
      actionUrl,
      metadata,
      expiresAt
    })
    return notification
  } catch (error) {
    console.error('❌ Error creating notification:', error)
    throw error
  }
}

/**
 * Create notifications for multiple users (bulk)
 */
export const createBulkNotifications = async (notifications) => {
  try {
    const result = await Notification.insertMany(notifications, { ordered: false })
    return result
  } catch (error) {
    console.error('❌ Error creating bulk notifications:', error)
    throw error
  }
}

/**
 * Notify teacher when assigned to a class
 */
export const notifyTeacherClassAssignment = async ({
  teacherId,
  className,
  subjectName,
  assignedBy
}) => {
  try {
    const teacher = await Teacher.findById(teacherId).populate('userId')
    if (!teacher || !teacher.userId) return

    await createNotification({
      recipientUserId: teacher.userId._id,
      senderUserId: assignedBy,
      type: 'class_assignment',
      title: 'New Class Assignment',
      message: `You have been assigned to teach ${subjectName} for ${className}`,
      relatedEntity: 'class',
      relatedEntityId: teacherId,
      priority: 'high',
      actionUrl: '/teacher/students',
      metadata: { className, subjectName }
    })

    console.log(`✅ Notified teacher ${teacher.userId.name} about class assignment`)
  } catch (error) {
    console.error('❌ Error notifying teacher:', error)
  }
}

/**
 * Notify students when a new assignment is created
 */
export const notifyStudentsNewAssignment = async ({
  classId,
  grade,
  section,
  stream,
  assignmentTitle,
  subjectName,
  dueDate,
  teacherId,
  assignmentId
}) => {
  try {
    // Build query for target students
    const query = { classId: classId }
    
    // For Grade 11-12, filter by stream if specified
    if (stream && (grade === 'Grade 11' || grade === 'Grade 12')) {
      query.stream = stream
    }

    const students = await Student.find(query).populate('userId')
    
    if (students.length === 0) {
      console.log('⚠️ No students found for assignment notification')
      return
    }

    const notifications = students
      .filter(student => student.userId) // Only students with user accounts
      .map(student => ({
        recipientUserId: student.userId._id,
        senderUserId: teacherId,
        type: 'assignment',
        title: 'New Assignment',
        message: `New ${subjectName} assignment: ${assignmentTitle}. Due ${new Date(dueDate).toLocaleDateString()}`,
        relatedEntity: 'assignment',
        relatedEntityId: assignmentId,
        priority: 'high',
        actionUrl: '/student/assignments',
        metadata: { assignmentTitle, subjectName, dueDate, grade, section, stream }
      }))

    if (notifications.length > 0) {
      await createBulkNotifications(notifications)
      console.log(`✅ Notified ${notifications.length} students about new assignment`)
    }
  } catch (error) {
    console.error('❌ Error notifying students about assignment:', error)
  }
}

/**
 * Notify student and parent when a result/grade is published
 */
export const notifyStudentResult = async ({
  studentId,
  subjectName,
  score,
  maxScore,
  grade,
  teacherId,
  resultId
}) => {
  try {
    const student = await Student.findById(studentId).populate('userId')
    if (!student) return

    // Notify the student
    if (student.userId) {
      await createNotification({
        recipientUserId: student.userId._id,
        senderUserId: teacherId,
        type: 'result',
        title: 'New Result Published',
        message: `Your ${subjectName} result has been published: ${score}/${maxScore}`,
        relatedEntity: 'result',
        relatedEntityId: resultId,
        priority: 'high',
        actionUrl: '/student/grades',
        metadata: { subjectName, score, maxScore, grade }
      })
    }

    // Notify the parent(s)
    const parents = await Parent.find({ studentIds: studentId }).populate('userId')
    
    const parentNotifications = parents
      .filter(parent => parent.userId)
      .map(parent => ({
        recipientUserId: parent.userId._id,
        senderUserId: teacherId,
        type: 'result',
        title: `${student.userId?.name || 'Student'} - New Result`,
        message: `${student.userId?.name}'s ${subjectName} result: ${score}/${maxScore}`,
        relatedEntity: 'result',
        relatedEntityId: resultId,
        priority: 'high',
        actionUrl: `/parent/child/${studentId}/grades`,
        metadata: { studentName: student.userId?.name, subjectName, score, maxScore, grade }
      }))

    if (parentNotifications.length > 0) {
      await createBulkNotifications(parentNotifications)
      console.log(`✅ Notified student and ${parentNotifications.length} parent(s) about result`)
    } else {
      console.log(`✅ Notified student about result (no parents linked)`)
    }
  } catch (error) {
    console.error('❌ Error notifying about result:', error)
  }
}

/**
 * Notify parent when their child is marked absent
 */
export const notifyParentChildAbsence = async ({
  studentId,
  date,
  teacherId
}) => {
  try {
    const student = await Student.findById(studentId).populate('userId')
    if (!student) return

    const parents = await Parent.find({ studentIds: studentId }).populate('userId')
    
    if (parents.length === 0) {
      console.log('⚠️ No parents found to notify about absence')
      return
    }

    const parentNotifications = parents
      .filter(parent => parent.userId)
      .map(parent => ({
        recipientUserId: parent.userId._id,
        senderUserId: teacherId,
        type: 'attendance',
        title: 'Attendance Alert',
        message: `${student.userId?.name || 'Your child'} was marked absent on ${new Date(date).toLocaleDateString()}`,
        relatedEntity: 'attendance',
        relatedEntityId: studentId,
        priority: 'high',
        actionUrl: `/parent/child/${studentId}/attendance`,
        metadata: { studentName: student.userId?.name, date, status: 'absent' }
      }))

    if (parentNotifications.length > 0) {
      await createBulkNotifications(parentNotifications)
      console.log(`✅ Notified ${parentNotifications.length} parent(s) about absence`)
    }
  } catch (error) {
    console.error('❌ Error notifying parent about absence:', error)
  }
}

/**
 * Notify parent when their child has a new attendance record (general)
 */
export const notifyParentAttendance = async ({
  studentId,
  status,
  date,
  teacherId
}) => {
  try {
    // Only notify for absent, late, or excused (not for present)
    if (status === 'present') return

    const student = await Student.findById(studentId).populate('userId')
    if (!student) return

    const parents = await Parent.find({ studentIds: studentId }).populate('userId')
    
    if (parents.length === 0) return

    const statusMessages = {
      absent: 'was marked absent',
      late: 'arrived late',
      excused: 'was excused'
    }

    const parentNotifications = parents
      .filter(parent => parent.userId)
      .map(parent => ({
        recipientUserId: parent.userId._id,
        senderUserId: teacherId,
        type: 'attendance',
        title: 'Attendance Update',
        message: `${student.userId?.name || 'Your child'} ${statusMessages[status] || status} on ${new Date(date).toLocaleDateString()}`,
        relatedEntity: 'attendance',
        relatedEntityId: studentId,
        priority: status === 'absent' ? 'high' : 'normal',
        actionUrl: `/parent/child/${studentId}/attendance`,
        metadata: { studentName: student.userId?.name, date, status }
      }))

    if (parentNotifications.length > 0) {
      await createBulkNotifications(parentNotifications)
      console.log(`✅ Notified ${parentNotifications.length} parent(s) about attendance: ${status}`)
    }
  } catch (error) {
    console.error('❌ Error notifying parent about attendance:', error)
  }
}

/**
 * Notify student when enrolled/admitted
 */
export const notifyStudentEnrollment = async (
  studentId,
  grade,
  section,
  stream = null,
  academicYear
) => {
  try {
    const student = await Student.findById(studentId).populate('userId')
    if (!student || !student.userId) return

    const className = stream 
      ? `${grade} ${stream} ${section}`
      : `${grade} ${section}`

    await createNotification({
      recipientUserId: student.userId._id,
      type: 'student_enrollment',
      title: 'Welcome to Smart SMS',
      message: `You have been enrolled in ${className} for academic year ${academicYear}`,
      relatedEntity: 'student',
      relatedEntityId: studentId,
      priority: 'high',
      actionUrl: '/student/dashboard',
      metadata: { grade, section, stream, academicYear }
    })

    // Notify parent(s)
    const parents = await Parent.find({ studentIds: studentId }).populate('userId')
    const parentNotifications = parents
      .filter(parent => parent.userId)
      .map(parent => ({
        recipientUserId: parent.userId._id,
        type: 'student_enrollment',
        title: `${student.name} Enrolled`,
        message: `${student.name} has been enrolled in ${className} for academic year ${academicYear}`,
        relatedEntity: 'student',
        relatedEntityId: studentId,
        priority: 'high',
        actionUrl: `/parent/child/${studentId}`,
        metadata: { studentName: student.name, grade, section, stream, academicYear }
      }))

    if (parentNotifications.length > 0) {
      await createBulkNotifications(parentNotifications)
    }

    console.log(`✅ Notified student and ${parentNotifications.length} parent(s) about enrollment`)
  } catch (error) {
    console.error('❌ Error notifying student about enrollment:', error)
  }
}

/**
 * Notify student and parent when promoted to next grade
 */
export const notifyStudentPromotion = async (
  studentId,
  fromGrade,
  toGrade,
  toSection,
  toStream = null,
  academicYear
) => {
  try {
    const student = await Student.findById(studentId).populate('userId')
    if (!student || !student.userId) return

    const toClassName = toStream 
      ? `${toGrade} ${toStream} ${toSection}`
      : `${toGrade} ${toSection}`

    // Notify the student
    await createNotification({
      recipientUserId: student.userId._id,
      type: 'info',
      title: 'Congratulations! You Have Been Promoted',
      message: `You have been promoted from ${fromGrade} to ${toClassName} for academic year ${academicYear}`,
      relatedEntity: 'student',
      relatedEntityId: studentId,
      priority: 'high',
      actionUrl: '/student/dashboard',
      metadata: { fromGrade, toGrade, toSection, toStream, academicYear }
    })

    // Notify parent(s)
    const parents = await Parent.find({ studentIds: studentId }).populate('userId')
    const parentNotifications = parents
      .filter(parent => parent.userId)
      .map(parent => ({
        recipientUserId: parent.userId._id,
        type: 'info',
        title: `${student.name} Promoted`,
        message: `${student.name} has been promoted from ${fromGrade} to ${toClassName} for academic year ${academicYear}`,
        relatedEntity: 'student',
        relatedEntityId: studentId,
        priority: 'high',
        actionUrl: `/parent/child/${studentId}`,
        metadata: { studentName: student.name, fromGrade, toGrade, toSection, toStream, academicYear }
      }))

    if (parentNotifications.length > 0) {
      await createBulkNotifications(parentNotifications)
    }

    console.log(`✅ Notified student and ${parentNotifications.length} parent(s) about promotion`)
  } catch (error) {
    console.error('❌ Error notifying about promotion:', error)
  }
}

/**
 * Notify student and parent when transferred to different class/section/stream
 */
export const notifyStudentTransfer = async (
  studentId,
  fromGrade,
  fromSection,
  fromStream = null,
  toGrade,
  toSection,
  toStream = null
) => {
  try {
    const student = await Student.findById(studentId).populate('userId')
    if (!student || !student.userId) return

    const fromClassName = fromStream 
      ? `${fromGrade} ${fromStream} ${fromSection}`
      : `${fromGrade} ${fromSection}`
    
    const toClassName = toStream 
      ? `${toGrade} ${toStream} ${toSection}`
      : `${toGrade} ${toSection}`

    // Notify the student
    await createNotification({
      recipientUserId: student.userId._id,
      type: 'info',
      title: 'Class Transfer Notification',
      message: `You have been transferred from ${fromClassName} to ${toClassName}`,
      relatedEntity: 'student',
      relatedEntityId: studentId,
      priority: 'high',
      actionUrl: '/student/dashboard',
      metadata: { fromGrade, fromSection, fromStream, toGrade, toSection, toStream }
    })

    // Notify parent(s)
    const parents = await Parent.find({ studentIds: studentId }).populate('userId')
    const parentNotifications = parents
      .filter(parent => parent.userId)
      .map(parent => ({
        recipientUserId: parent.userId._id,
        type: 'info',
        title: `${student.name} Transferred`,
        message: `${student.name} has been transferred from ${fromClassName} to ${toClassName}`,
        relatedEntity: 'student',
        relatedEntityId: studentId,
        priority: 'high',
        actionUrl: `/parent/child/${studentId}`,
        metadata: { studentName: student.name, fromGrade, fromSection, fromStream, toGrade, toSection, toStream }
      }))

    if (parentNotifications.length > 0) {
      await createBulkNotifications(parentNotifications)
    }

    // Notify teachers of old class
    // Notify teachers of new class
    // (Implementation depends on requirements)

    console.log(`✅ Notified student and ${parentNotifications.length} parent(s) about transfer`)
  } catch (error) {
    console.error('❌ Error notifying about transfer:', error)
  }
}

/**
 * Create notifications from an announcement to targeted users
 */
export const createAnnouncementNotifications = async ({
  announcementId,
  title,
  message,
  targetRole,
  targetGrade,
  targetSection,
  targetStream,
  priority = 'normal',
  createdBy
}) => {
  try {
    const notifications = []
    
    // Determine which users should receive this announcement
    const userQuery = {}
    
    // Filter by role
    if (targetRole && targetRole.length > 0 && !targetRole.includes('all')) {
      userQuery.role = { $in: targetRole }
    }

    const users = await User.find(userQuery).select('_id role')
    
    for (const user of users) {
      let shouldNotify = true
      
      // Additional filtering based on role-specific criteria
      if (user.role === 'student' && (targetGrade || targetSection || targetStream)) {
        const student = await Student.findOne({ userId: user._id })
        if (student) {
          // Check grade
          if (targetGrade && student.grade !== targetGrade) {
            shouldNotify = false
          }
          // Check section
          if (targetSection && student.section !== targetSection) {
            shouldNotify = false
          }
          // Check stream (for Grade 11-12)
          if (targetStream && student.stream !== targetStream) {
            shouldNotify = false
          }
        } else {
          shouldNotify = false
        }
      }
      
      if (user.role === 'teacher' && targetGrade) {
        const teacher = await Teacher.findOne({ userId: user._id }).populate('assignedClasses')
        if (teacher && teacher.assignedClasses) {
          // Check if teacher teaches the target grade
          const teachesTargetGrade = teacher.assignedClasses.some(cls => {
            return cls.grade === targetGrade
          })
          if (!teachesTargetGrade) {
            shouldNotify = false
          }
        }
      }
      
      if (user.role === 'parent' && (targetGrade || targetSection || targetStream)) {
        const parent = await Parent.findOne({ userId: user._id }).populate('studentIds')
        if (parent && parent.studentIds) {
          // Check if any of parent's children match the criteria
          const hasMatchingChild = parent.studentIds.some(child => {
            let matches = true
            if (targetGrade && child.grade !== targetGrade) matches = false
            if (targetSection && child.section !== targetSection) matches = false
            if (targetStream && child.stream !== targetStream) matches = false
            return matches
          })
          if (!hasMatchingChild) {
            shouldNotify = false
          }
        } else {
          shouldNotify = false
        }
      }
      
      if (shouldNotify) {
        notifications.push({
          recipientUserId: user._id,
          senderUserId: createdBy,
          type: 'announcement',
          title,
          message,
          relatedEntity: 'announcement',
          relatedEntityId: announcementId,
          priority,
          actionUrl: '/announcements',
          metadata: { targetGrade, targetSection, targetStream, targetRole }
        })
      }
    }

    if (notifications.length > 0) {
      await createBulkNotifications(notifications)
      console.log(`✅ Created ${notifications.length} announcement notifications`)
    }

    return notifications.length
  } catch (error) {
    console.error('❌ Error creating announcement notifications:', error)
    throw error
  }
}

/**
 * Get unread notification count for a user
 */
export const getUnreadCount = async (userId) => {
  try {
    const count = await Notification.countDocuments({
      recipientUserId: userId,
      isRead: false
    })
    return count
  } catch (error) {
    console.error('❌ Error getting unread count:', error)
    return 0
  }
}

/**
 * Mark notification as read
 */
export const markAsRead = async (notificationId, userId) => {
  try {
    const notification = await Notification.findOneAndUpdate(
      { _id: notificationId, recipientUserId: userId },
      { isRead: true, readAt: new Date() },
      { new: true }
    )
    return notification
  } catch (error) {
    console.error('❌ Error marking notification as read:', error)
    throw error
  }
}

/**
 * Mark all notifications as read for a user
 */
export const markAllAsRead = async (userId) => {
  try {
    const result = await Notification.updateMany(
      { recipientUserId: userId, isRead: false },
      { isRead: true, readAt: new Date() }
    )
    return result
  } catch (error) {
    console.error('❌ Error marking all notifications as read:', error)
    throw error
  }
}

export default {
  createNotification,
  createBulkNotifications,
  notifyTeacherClassAssignment,
  notifyStudentsNewAssignment,
  notifyStudentResult,
  notifyParentChildAbsence,
  notifyParentAttendance,
  notifyStudentEnrollment,
  notifyStudentPromotion,
  notifyStudentTransfer,
  createAnnouncementNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead
}
