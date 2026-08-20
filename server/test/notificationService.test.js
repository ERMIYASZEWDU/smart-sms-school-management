/**
 * Notification Service Tests
 *
 * Covers all exported functions from notificationService.js:
 * - createNotification, createBulkNotifications
 * - notifyTeacherClassAssignment, notifyStudentsNewAssignment
 * - notifyStudentResult, notifyParentChildAbsence, notifyParentAttendance
 * - notifyStudentEnrollment, notifyStudentPromotion, notifyStudentTransfer
 * - createAnnouncementNotifications
 * - getUnreadCount, markAsRead, markAllAsRead
 */
import { describe, it, before, after, beforeEach } from 'node:test'
import assert from 'node:assert/strict'

import { setupDb, teardownDb, clearDb, createUser, createStudent, createParent, createTeacher } from './setup.js'

import Notification from '../models/Notification.js'
import * as svc from '../services/notificationService.js'

// ─── Lifecycle ────────────────────────────────────────────────────────────────

before(async () => { await setupDb() })
after(async () => { await teardownDb() })
beforeEach(async () => { await clearDb() })

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Create a full test fixture: admin user, student + user, parent + user, teacher + user */
async function createFixtures() {
  const admin = await createUser({ role: 'admin', name: 'Admin User' })
  const { user: studentUser, student } = await createStudent({ name: 'Alice Student' })
  const { user: parentUser, parent } = await createParent([student._id], { name: 'Bob Parent' })
  const { user: teacherUser, teacher } = await createTeacher({ name: 'Carol Teacher' })
  return { admin, studentUser, student, parentUser, parent, teacherUser, teacher }
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('createNotification', () => {
  it('creates a notification with all fields', async () => {
    const { admin, studentUser } = await createFixtures()
    const n = await svc.createNotification({
      recipientUserId: studentUser._id,
      senderUserId: admin._id,
      type: 'info',
      title: 'Hello',
      message: 'World',
      relatedEntity: 'student',
      relatedEntityId: admin._id,
      priority: 'high',
      actionUrl: '/dashboard',
      metadata: { key: 'value' },
    })
    assert.equal(n.recipientUserId.toString(), studentUser._id.toString())
    assert.equal(n.senderUserId.toString(), admin._id.toString())
    assert.equal(n.type, 'info')
    assert.equal(n.title, 'Hello')
    assert.equal(n.message, 'World')
    assert.equal(n.priority, 'high')
    assert.equal(n.actionUrl, '/dashboard')
    assert.deepEqual(n.metadata, { key: 'value' })
    assert.equal(n.isRead, false)
  })

  it('applies default values when optional fields are omitted', async () => {
    const { studentUser } = await createFixtures()
    const n = await svc.createNotification({
      recipientUserId: studentUser._id,
      title: 'Default Test',
      message: 'Testing defaults',
    })
    assert.equal(n.type, 'info')
    assert.equal(n.priority, 'normal')
    assert.equal(n.senderUserId, null)
    assert.equal(n.relatedEntity, null)
  })

  it('rejects invalid notification type', async () => {
    const { studentUser } = await createFixtures()
    await assert.rejects(
      svc.createNotification({
        recipientUserId: studentUser._id,
        type: 'INVALID_TYPE',
        title: 'Bad',
        message: 'Type',
      }),
      /validation/i
    )
  })
})

describe('createBulkNotifications', () => {
  it('inserts multiple notifications at once', async () => {
    const { admin, studentUser, parentUser } = await createFixtures()
    const result = await svc.createBulkNotifications([
      { recipientUserId: studentUser._id, senderUserId: admin._id, type: 'info', title: 'A', message: 'msg A' },
      { recipientUserId: parentUser._id, senderUserId: admin._id, type: 'warning', title: 'B', message: 'msg B' },
    ])
    assert.equal(result.length, 2)
    const count = await Notification.countDocuments()
    assert.equal(count, 2)
  })
})

describe('notifyStudentsNewAssignment', () => {
  it('notifies all students in a class about a new assignment', async () => {
    const { teacher, student, studentUser } = await createFixtures()

    // Update student's classId to match the query
    const classId = new (await import('mongoose')).default.Types.ObjectId()
    student.classId = classId
    await student.save()

    await svc.notifyStudentsNewAssignment({
      classId,
      grade: 'Grade 10',
      section: 'A',
      assignmentTitle: 'Homework 1',
      subjectName: 'Math',
      dueDate: '2026-12-01',
      teacherId: teacher._id,
      assignmentId: new (await import('mongoose')).default.Types.ObjectId(),
    })

    const notifications = await Notification.find({ recipientUserId: studentUser._id })
    assert.equal(notifications.length, 1)
    assert.equal(notifications[0].type, 'assignment')
    assert.ok(notifications[0].message.includes('Homework 1'))
    assert.ok(notifications[0].message.includes('Math'))
  })

  it('creates no notifications when no students match', async () => {
    const { teacher } = await createFixtures()
    const fakeClassId = new (await import('mongoose')).default.Types.ObjectId()

    await svc.notifyStudentsNewAssignment({
      classId: fakeClassId,
      grade: 'Grade 10',
      section: 'A',
      assignmentTitle: 'HW',
      subjectName: 'Math',
      dueDate: '2026-12-01',
      teacherId: teacher._id,
      assignmentId: new (await import('mongoose')).default.Types.ObjectId(),
    })

    const count = await Notification.countDocuments()
    assert.equal(count, 0)
  })
})

describe('notifyStudentResult', () => {
  it('notifies student AND linked parents about a new result', async () => {
    const { teacher, student, studentUser, parentUser } = await createFixtures()

    await svc.notifyStudentResult({
      studentId: student._id,
      subjectName: 'English',
      score: 85,
      maxScore: 100,
      grade: 'A',
      teacherId: teacher._id,
      resultId: new (await import('mongoose')).default.Types.ObjectId(),
    })

    // Student gets 1 notification
    const studentNotifs = await Notification.find({ recipientUserId: studentUser._id })
    assert.equal(studentNotifs.length, 1)
    assert.equal(studentNotifs[0].type, 'result')
    assert.ok(studentNotifs[0].message.includes('85/100'))

    // Parent gets 1 notification
    const parentNotifs = await Notification.find({ recipientUserId: parentUser._id })
    assert.equal(parentNotifs.length, 1)
    assert.ok(parentNotifs[0].message.includes('English'))
  })

  it('only notifies student when no parents are linked', async () => {
    const { teacher, student, studentUser } = await createFixtures()

    // Student has no parent (create a student without parent linkage)
    const soloStudent = await createStudent({ name: 'Solo Student' })

    await svc.notifyStudentResult({
      studentId: soloStudent.student._id,
      subjectName: 'Science',
      score: 90,
      maxScore: 100,
      grade: 'A+',
      teacherId: teacher._id,
      resultId: new (await import('mongoose')).default.Types.ObjectId(),
    })

    const notifs = await Notification.find({ recipientUserId: soloStudent.user._id })
    assert.equal(notifs.length, 1)
  })

  it('does nothing when student not found', async () => {
    const { teacher } = await createFixtures()
    const fakeId = new (await import('mongoose')).default.Types.ObjectId()
    await svc.notifyStudentResult({
      studentId: fakeId,
      subjectName: 'Math',
      score: 50,
      maxScore: 100,
      grade: 'C',
      teacherId: teacher._id,
      resultId: new (await import('mongoose')).default.Types.ObjectId(),
    })
    const count = await Notification.countDocuments()
    assert.equal(count, 0)
  })
})

describe('notifyParentChildAbsence', () => {
  it('notifies parents when child is marked absent', async () => {
    const { teacher, student, parentUser } = await createFixtures()

    await svc.notifyParentChildAbsence({
      studentId: student._id,
      date: '2026-03-15',
      teacherId: teacher._id,
    })

    const notifs = await Notification.find({ recipientUserId: parentUser._id })
    assert.equal(notifs.length, 1)
    assert.equal(notifs[0].type, 'attendance')
    assert.equal(notifs[0].priority, 'high')
    assert.ok(notifs[0].message.includes('absent'))
  })

  it('does nothing when no parents linked', async () => {
    const { teacher } = await createFixtures()
    const solo = await createStudent({ name: 'No Parent Student' })

    await svc.notifyParentChildAbsence({
      studentId: solo.student._id,
      date: '2026-03-15',
      teacherId: teacher._id,
    })

    const count = await Notification.countDocuments()
    assert.equal(count, 0)
  })
})

describe('notifyParentAttendance', () => {
  it('does NOT notify parents when status is "present"', async () => {
    const { teacher, student } = await createFixtures()

    await svc.notifyParentAttendance({
      studentId: student._id,
      status: 'present',
      date: '2026-03-15',
      teacherId: teacher._id,
    })

    const count = await Notification.countDocuments()
    assert.equal(count, 0)
  })

  it('notifies parents when status is "absent"', async () => {
    const { teacher, student, parentUser } = await createFixtures()

    await svc.notifyParentAttendance({
      studentId: student._id,
      status: 'absent',
      date: '2026-03-15',
      teacherId: teacher._id,
    })

    const notifs = await Notification.find({ recipientUserId: parentUser._id })
    assert.equal(notifs.length, 1)
    assert.equal(notifs[0].priority, 'high')
  })

  it('notifies parents when status is "late" with normal priority', async () => {
    const { teacher, student, parentUser } = await createFixtures()

    await svc.notifyParentAttendance({
      studentId: student._id,
      status: 'late',
      date: '2026-03-15',
      teacherId: teacher._id,
    })

    const notifs = await Notification.find({ recipientUserId: parentUser._id })
    assert.equal(notifs.length, 1)
    assert.equal(notifs[0].priority, 'normal')
    assert.ok(notifs[0].message.includes('late'))
  })
})

describe('notifyStudentEnrollment', () => {
  it('notifies student and parents about enrollment', async () => {
    const { student, studentUser, parentUser } = await createFixtures()

    await svc.notifyStudentEnrollment(student._id, 'Grade 10', 'A', null, '2026-2027')

    const studentNotifs = await Notification.find({ recipientUserId: studentUser._id })
    assert.equal(studentNotifs.length, 1)
    assert.equal(studentNotifs[0].type, 'student_enrollment')
    assert.ok(studentNotifs[0].message.includes('Grade 10 A'))

    const parentNotifs = await Notification.find({ recipientUserId: parentUser._id })
    assert.equal(parentNotifs.length, 1)
    assert.ok(parentNotifs[0].message.includes('enrolled'))
  })

  it('handles stream for Grade 11-12', async () => {
    const { student, studentUser } = await createFixtures()
    student.grade = 'Grade 11'
    student.stream = 'Natural Science'
    await student.save()

    await svc.notifyStudentEnrollment(student._id, 'Grade 11', 'A', 'Natural Science', '2026-2027')

    const notifs = await Notification.find({ recipientUserId: studentUser._id })
    assert.ok(notifs[0].message.includes('Natural Science'))
  })
})

describe('notifyStudentPromotion', () => {
  it('notifies student and parents about promotion', async () => {
    const { student, studentUser, parentUser } = await createFixtures()

    await svc.notifyStudentPromotion(student._id, 'Grade 10', 'Grade 11', 'A', null, '2026-2027')

    const studentNotifs = await Notification.find({ recipientUserId: studentUser._id })
    assert.equal(studentNotifs.length, 1)
    assert.ok(studentNotifs[0].message.includes('promoted'))
    assert.ok(studentNotifs[0].message.includes('Grade 11 A'))

    const parentNotifs = await Notification.find({ recipientUserId: parentUser._id })
    assert.equal(parentNotifs.length, 1)
    assert.ok(parentNotifs[0].message.includes('promoted'))
  })
})

describe('notifyStudentTransfer', () => {
  it('notifies student and parents about transfer', async () => {
    const { student, studentUser, parentUser } = await createFixtures()

    await svc.notifyStudentTransfer(
      student._id,
      'Grade 10', 'A', null,
      'Grade 10', 'B', null
    )

    const studentNotifs = await Notification.find({ recipientUserId: studentUser._id })
    assert.equal(studentNotifs.length, 1)
    assert.ok(studentNotifs[0].message.includes('transferred'))
    assert.ok(studentNotifs[0].message.includes('A'))
    assert.ok(studentNotifs[0].message.includes('B'))

    const parentNotifs = await Notification.find({ recipientUserId: parentUser._id })
    assert.equal(parentNotifs.length, 1)
  })
})

describe('createAnnouncementNotifications', () => {
  it('sends announcement to all users when targetRole includes "all"', async () => {
    const { admin, studentUser, teacherUser, parentUser } = await createFixtures()

    const count = await svc.createAnnouncementNotifications({
      announcementId: new (await import('mongoose')).default.Types.ObjectId(),
      title: 'School Holiday',
      message: 'School will be closed next week',
      targetRole: ['all'],
      priority: 'normal',
      createdBy: admin._id,
    })

    // All 4 users (admin, student, teacher, parent) should get notifications
    assert.equal(count, 4)

    const adminNotifs = await Notification.find({ recipientUserId: admin._id })
    assert.equal(adminNotifs.length, 1)
    assert.equal(adminNotifs[0].type, 'announcement')

    const studentNotifs = await Notification.find({ recipientUserId: studentUser._id })
    assert.equal(studentNotifs.length, 1)
  })

  it('sends announcement only to targeted roles', async () => {
    const { admin, studentUser, teacherUser, parentUser } = await createFixtures()

    const count = await svc.createAnnouncementNotifications({
      announcementId: new (await import('mongoose')).default.Types.ObjectId(),
      title: 'Staff Meeting',
      message: 'Teachers meeting at 3pm',
      targetRole: ['teacher'],
      priority: 'normal',
      createdBy: admin._id,
    })

    assert.equal(count, 1)
    const teacherNotifs = await Notification.find({ recipientUserId: teacherUser._id })
    assert.equal(teacherNotifs.length, 1)
  })
})

describe('getUnreadCount', () => {
  it('returns correct unread count', async () => {
    const { admin, studentUser } = await createFixtures()

    // Create 3 notifications, mark 1 as read
    await svc.createBulkNotifications([
      { recipientUserId: studentUser._id, senderUserId: admin._id, type: 'info', title: 'A', message: 'a' },
      { recipientUserId: studentUser._id, senderUserId: admin._id, type: 'info', title: 'B', message: 'b' },
      { recipientUserId: studentUser._id, senderUserId: admin._id, type: 'info', title: 'C', message: 'c', isRead: true },
    ])

    const count = await svc.getUnreadCount(studentUser._id)
    assert.equal(count, 2)
  })

  it('returns 0 when no notifications exist', async () => {
    const { studentUser } = await createFixtures()
    const count = await svc.getUnreadCount(studentUser._id)
    assert.equal(count, 0)
  })
})

describe('markAsRead', () => {
  it('marks a single notification as read', async () => {
    const { admin, studentUser } = await createFixtures()
    const n = await svc.createNotification({
      recipientUserId: studentUser._id,
      senderUserId: admin._id,
      type: 'info',
      title: 'Read me',
      message: 'Please',
    })

    const updated = await svc.markAsRead(n._id, studentUser._id)
    assert.equal(updated.isRead, true)
    assert.ok(updated.readAt instanceof Date)
  })

  it('does not mark notification belonging to another user', async () => {
    const { admin, studentUser, parentUser } = await createFixtures()
    const n = await svc.createNotification({
      recipientUserId: studentUser._id,
      senderUserId: admin._id,
      type: 'info',
      title: 'Not yours',
      message: 'msg',
    })

    const result = await svc.markAsRead(n._id, parentUser._id)
    assert.equal(result, null)

    // Original should still be unread
    const original = await Notification.findById(n._id)
    assert.equal(original.isRead, false)
  })
})

describe('markAllAsRead', () => {
  it('marks all unread notifications as read for a user', async () => {
    const { admin, studentUser } = await createFixtures()
    await svc.createBulkNotifications([
      { recipientUserId: studentUser._id, senderUserId: admin._id, type: 'info', title: 'A', message: 'a' },
      { recipientUserId: studentUser._id, senderUserId: admin._id, type: 'info', title: 'B', message: 'b' },
      { recipientUserId: studentUser._id, senderUserId: admin._id, type: 'info', title: 'C', message: 'c' },
    ])

    const result = await svc.markAllAsRead(studentUser._id)
    assert.ok(result.modifiedCount >= 3)

    const unread = await svc.getUnreadCount(studentUser._id)
    assert.equal(unread, 0)
  })

  it('does not mark notifications of other users', async () => {
    const { admin, studentUser, parentUser } = await createFixtures()
    await svc.createBulkNotifications([
      { recipientUserId: studentUser._id, senderUserId: admin._id, type: 'info', title: 'A', message: 'a' },
      { recipientUserId: parentUser._id, senderUserId: admin._id, type: 'info', title: 'B', message: 'b' },
    ])

    await svc.markAllAsRead(studentUser._id)

    const parentUnread = await svc.getUnreadCount(parentUser._id)
    assert.equal(parentUnread, 1)
  })
})

describe('notifyTeacherClassAssignment', () => {
  it('notifies teacher when assigned to a class', async () => {
    const { admin, teacher, teacherUser } = await createFixtures()

    await svc.notifyTeacherClassAssignment({
      teacherId: teacher._id,
      className: 'Grade 10-A',
      subjectName: 'Mathematics',
      assignedBy: admin._id,
    })

    const notifs = await Notification.find({ recipientUserId: teacherUser._id })
    assert.equal(notifs.length, 1)
    assert.equal(notifs[0].type, 'class_assignment')
    assert.ok(notifs[0].message.includes('Mathematics'))
    assert.ok(notifs[0].message.includes('Grade 10-A'))
    assert.equal(notifs[0].priority, 'high')
  })
})
