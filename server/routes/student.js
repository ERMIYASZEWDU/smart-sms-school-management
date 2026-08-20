import express from 'express'
import { verifyToken, checkRole } from '../middleware/auth.js'
import Student from '../models/Student.js'
import Grade from '../models/Grade.js'
import Attendance from '../models/Attendance.js'
import Assignment from '../models/Assignment.js'
import AssignmentSubmission from '../models/AssignmentSubmission.js'
import Announcement from '../models/Announcement.js'
import Timetable from '../models/Timetable.js'
import Enrollment from '../models/Enrollment.js'
import AcademicYear from '../models/AcademicYear.js'

const router = express.Router()

router.get('/dashboard', verifyToken, checkRole(['student']), async (req, res) => {
  try {
    // Find the student profile
    const student = await Student.findOne({ userId: req.user.id })
      .populate('classId')
      .populate('currentEnrollmentId')
      .lean()

    if (!student) {
      return res.status(404).json({ message: 'Student profile not found' })
    }

    // Get current enrollment with academic year context
    let currentEnrollment = null
    let academicYear = null
    
    if (student.currentEnrollmentId) {
      currentEnrollment = await Enrollment.findById(student.currentEnrollmentId)
        .populate('classId')
        .populate('academicYearId')
        .lean()
      academicYear = currentEnrollment?.academicYearId
    } else {
      // Fallback: try to get enrollment by student ID
      const activeYear = await AcademicYear.findOne({ isActive: true })
      if (activeYear) {
        currentEnrollment = await Enrollment.findOne({
          studentId: student._id,
          academicYearId: activeYear._id,
          status: 'active'
        })
          .populate('classId')
          .populate('academicYearId')
          .lean()
        academicYear = activeYear
      }
    }

    // Get recent grades
    const recentGrades = await Grade.find({ studentId: student._id })
      .populate('teacherId', 'name')
      .sort({ createdAt: -1 })
      .limit(5)
      .lean()

    // Get attendance statistics
    const attendanceRecords = await Attendance.find({ studentId: student._id }).lean()
    const totalAttendance = attendanceRecords.length
    const presentCount = attendanceRecords.filter(a => a.status === 'present' || a.status === 'late').length
    const attendancePercentage = totalAttendance > 0 ? ((presentCount / totalAttendance) * 100).toFixed(1) : 0

    // Get pending assignments — match by classId or grade
    const classConditions = [{ grade: student.grade }]
    if (student.classId) classConditions.push({ classId: student.classId._id || student.classId })

    const assignments = await Assignment.find({
      isPublished: true,
      dueDate: { $gte: new Date() },
      $or: classConditions
    })
      .sort({ dueDate: 1 })
      .limit(5)
      .lean()

    // Get submissions for these assignments
    const assignmentIds = assignments.map(a => a._id)
    const submissions = await AssignmentSubmission.find({
      studentId: student._id,
      assignmentId: { $in: assignmentIds }
    }).lean()

    const pendingAssignments = assignments.filter(assignment => {
      return !submissions.some(s => s.assignmentId.toString() === assignment._id.toString())
    })

    // Get announcements
    const announcements = await Announcement.find({
      isPublished: true,
      $or: [
        { targetRole: 'all' },
        { targetRole: 'student' },
        { targetClass: student.grade }
      ]
    })
      .sort({ createdAt: -1 })
      .limit(5)
      .lean()

    res.json({
      student,
      currentEnrollment: currentEnrollment ? {
        id: currentEnrollment._id,
        grade: currentEnrollment.grade,
        section: currentEnrollment.section,
        stream: currentEnrollment.stream,
        rollNumber: currentEnrollment.rollNumber,
        status: currentEnrollment.status,
        enrollmentDate: currentEnrollment.enrollmentDate,
        class: currentEnrollment.classId,
        academicYear: currentEnrollment.academicYearId
      } : null,
      academicYear: academicYear ? {
        id: academicYear._id,
        name: academicYear.name,
        startDate: academicYear.startDate,
        endDate: academicYear.endDate,
        isActive: academicYear.isActive
      } : null,
      gpa: student.gpa || 0,
      attendancePercentage: parseFloat(attendancePercentage),
      recentGrades,
      pendingAssignments,
      announcements
    })
  } catch (err) {
    console.error('Error fetching student dashboard:', err)
    res.status(500).json({ message: 'Error fetching dashboard', error: err.message })
  }
})

router.get('/profile', verifyToken, checkRole(['student']), async (req, res) => {
  try {
    const student = await Student.findOne({ userId: req.user.id })
      .populate('userId', 'email')
      .populate('classId')
      .populate('parentIds')
      .populate('currentEnrollmentId')
      .lean()

    if (!student) {
      return res.status(404).json({ message: 'Student profile not found' })
    }

    // Get current enrollment with academic year
    let currentEnrollment = null
    if (student.currentEnrollmentId) {
      currentEnrollment = await Enrollment.findById(student.currentEnrollmentId)
        .populate('classId')
        .populate('academicYearId')
        .lean()
    }

    res.json({
      ...student,
      currentEnrollment: currentEnrollment ? {
        id: currentEnrollment._id,
        grade: currentEnrollment.grade,
        section: currentEnrollment.section,
        stream: currentEnrollment.stream,
        rollNumber: currentEnrollment.rollNumber,
        status: currentEnrollment.status,
        enrollmentDate: currentEnrollment.enrollmentDate,
        class: currentEnrollment.classId,
        academicYear: currentEnrollment.academicYearId
      } : null
    })
  } catch (err) {
    res.status(500).json({ message: 'Error fetching profile', error: err.message })
  }
})

// Get enrollment history
router.get('/enrollment-history', verifyToken, checkRole(['student']), async (req, res) => {
  try {
    const student = await Student.findOne({ userId: req.user.id }).lean()
    
    if (!student) {
      return res.status(404).json({ message: 'Student profile not found' })
    }

    const enrollmentHistory = await Enrollment.find({ studentId: student._id })
      .populate('classId')
      .populate('academicYearId')
      .populate('enrolledBy', 'name email')
      .populate('statusChangedBy', 'name email')
      .sort({ createdAt: -1 })
      .lean()

    res.json({
      studentId: student._id,
      studentName: student.name,
      enrollmentNumber: student.enrollmentNumber,
      enrollmentHistory,
      totalEnrollments: enrollmentHistory.length
    })
  } catch (err) {
    console.error('Error fetching enrollment history:', err)
    res.status(500).json({ message: 'Error fetching enrollment history', error: err.message })
  }
})

// Get current enrollment details
router.get('/current-enrollment', verifyToken, checkRole(['student']), async (req, res) => {
  try {
    const student = await Student.findOne({ userId: req.user.id }).lean()
    
    if (!student) {
      return res.status(404).json({ message: 'Student profile not found' })
    }

    // Try to get enrollment from currentEnrollmentId
    let currentEnrollment = null
    if (student.currentEnrollmentId) {
      currentEnrollment = await Enrollment.findById(student.currentEnrollmentId)
        .populate('classId')
        .populate('academicYearId')
        .populate('enrolledBy', 'name email')
        .lean()
    }

    // Fallback: find active enrollment
    if (!currentEnrollment) {
      const activeYear = await AcademicYear.findOne({ isActive: true })
      if (activeYear) {
        currentEnrollment = await Enrollment.findOne({
          studentId: student._id,
          academicYearId: activeYear._id,
          status: 'active'
        })
          .populate('classId')
          .populate('academicYearId')
          .populate('enrolledBy', 'name email')
          .lean()
      }
    }

    if (!currentEnrollment) {
      return res.status(404).json({ message: 'No active enrollment found' })
    }

    res.json({
      enrollment: currentEnrollment,
      student: {
        id: student._id,
        name: student.name,
        enrollmentNumber: student.enrollmentNumber
      }
    })
  } catch (err) {
    console.error('Error fetching current enrollment:', err)
    res.status(500).json({ message: 'Error fetching current enrollment', error: err.message })
  }
})

router.get('/grades', verifyToken, checkRole(['student']), async (req, res) => {
  try {
    const student = await Student.findOne({ userId: req.user.id }).lean()
    
    if (!student) {
      return res.status(404).json({ message: 'Student profile not found' })
    }

    const { subject, gradeType } = req.query
    let query = { studentId: student._id }

    if (subject) {
      query.subject = subject
    }

    if (gradeType) {
      query.gradeType = gradeType
    }

    const grades = await Grade.find(query)
      .populate('teacherId', 'name email')
      .sort({ createdAt: -1 })
      .lean()

    res.json(grades)
  } catch (err) {
    console.error('Error fetching grades:', err)
    res.status(500).json({ message: 'Error fetching grades', error: err.message })
  }
})

router.get('/attendance', verifyToken, checkRole(['student']), async (req, res) => {
  try {
    const student = await Student.findOne({ userId: req.user.id }).lean()
    
    if (!student) {
      return res.status(404).json({ message: 'Student profile not found' })
    }

    const { startDate, endDate, subject } = req.query
    let query = { studentId: student._id }

    if (subject) {
      query.subject = subject
    }

    if (startDate && endDate) {
      query.date = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      }
    }

    const attendance = await Attendance.find(query)
      .populate('markedBy', 'name')
      .sort({ date: -1 })
      .lean()

    // Calculate statistics
    const total = attendance.length
    const present = attendance.filter(a => a.status === 'present').length
    const absent = attendance.filter(a => a.status === 'absent').length
    const late = attendance.filter(a => a.status === 'late').length
    const excused = attendance.filter(a => a.status === 'excused').length
    const percentage = total > 0 ? ((present + late) / total * 100).toFixed(2) : 0

    res.json({
      attendance,
      statistics: {
        total,
        present,
        absent,
        late,
        excused,
        percentage
      }
    })
  } catch (err) {
    console.error('Error fetching attendance:', err)
    res.status(500).json({ message: 'Error fetching attendance', error: err.message })
  }
})

router.get('/assignments', verifyToken, checkRole(['student']), async (req, res) => {
  try {
    const student = await Student.findOne({ userId: req.user.id }).lean()
    
    if (!student) {
      return res.status(404).json({ message: 'Student profile not found' })
    }

    const { status } = req.query
    
    // Match assignments by classId (preferred) OR by grade string (fallback)
    const classConditions = [{ grade: student.grade }]
    if (student.classId) {
      classConditions.push({ classId: student.classId })
    }

    let assignmentQuery = {
      isPublished: true,
      $or: classConditions
    }

    if (status === 'pending') {
      assignmentQuery.dueDate = { $gte: new Date() }
    } else if (status === 'overdue') {
      assignmentQuery.dueDate = { $lt: new Date() }
    }

    const assignments = await Assignment.find(assignmentQuery)
      .populate('teacherId', 'name email')
      .sort({ dueDate: -1 })
      .lean()

    // Get submissions for these assignments
    const submissions = await AssignmentSubmission.find({
      studentId: student._id
    }).lean()

    // Map submissions to assignments
    const assignmentsWithSubmissions = assignments.map(assignment => {
      const submission = submissions.find(
        s => s.assignmentId.toString() === assignment._id.toString()
      )
      return {
        ...assignment,
        submission: submission || null,
        isSubmitted: !!submission,
        isOverdue: new Date(assignment.dueDate) < new Date() && !submission
      }
    })

    res.json(assignmentsWithSubmissions)
  } catch (err) {
    console.error('Error fetching assignments:', err)
    res.status(500).json({ message: 'Error fetching assignments', error: err.message })
  }
})

router.post('/assignment/:id/submit', verifyToken, checkRole(['student']), async (req, res) => {
  try {
    const student = await Student.findOne({ userId: req.user.id }).lean()
    
    if (!student) {
      return res.status(404).json({ message: 'Student profile not found' })
    }

    const { content, attachments } = req.body
    const assignmentId = req.params.id

    // Check if assignment exists
    const assignment = await Assignment.findById(assignmentId).lean()
    if (!assignment) {
      return res.status(404).json({ message: 'Assignment not found' })
    }

    // Check if already submitted
    const existingSubmission = await AssignmentSubmission.findOne({
      assignmentId,
      studentId: student._id
    })

    if (existingSubmission) {
      // Update existing submission
      existingSubmission.content = content
      existingSubmission.attachments = attachments || []
      existingSubmission.submittedAt = new Date()
      existingSubmission.status = new Date() > new Date(assignment.dueDate) ? 'late' : 'submitted'
      existingSubmission.updatedAt = new Date()
      await existingSubmission.save()

      return res.json(existingSubmission)
    }

    // Create new submission
    const submission = new AssignmentSubmission({
      assignmentId,
      studentId: student._id,
      content,
      attachments: attachments || [],
      status: new Date() > new Date(assignment.dueDate) ? 'late' : 'submitted'
    })

    await submission.save()

    res.status(201).json(submission)
  } catch (err) {
    console.error('Error submitting assignment:', err)
    res.status(500).json({ message: 'Error submitting assignment', error: err.message })
  }
})

router.get('/announcements', verifyToken, checkRole(['student']), async (req, res) => {
  try {
    const student = await Student.findOne({ userId: req.user.id }).lean()
    
    if (!student) {
      return res.status(404).json({ message: 'Student profile not found' })
    }

    const announcements = await Announcement.find({
      isPublished: true,
      $or: [
        { targetRole: 'all' },
        { targetRole: 'student' },
        { targetClass: student.grade }
      ]
    })
      .populate('createdBy', 'name email')
      .sort({ createdAt: -1 })
      .lean()

    res.json(announcements)
  } catch (err) {
    console.error('Error fetching announcements:', err)
    res.status(500).json({ message: 'Error fetching announcements', error: err.message })
  }
})

router.get('/timetable', verifyToken, checkRole(['student']), async (req, res) => {
  try {
    const student = await Student.findOne({ userId: req.user.id })
      .populate('classId')
      .lean()
    
    if (!student) {
      return res.status(404).json({ message: 'Student profile not found' })
    }

    if (!student.classId) {
      return res.json([]) // No class assigned, return empty timetable
    }

    const timetable = await Timetable.find({
      classId: student.classId._id,
      isActive: true
    })
      .populate('teacherId', 'name email')
      .populate('subjectId', 'name code')
      .sort({ dayOfWeek: 1, startTime: 1 })
      .lean()

    res.json(timetable)
  } catch (err) {
    console.error('Error fetching timetable:', err)
    res.status(500).json({ message: 'Error fetching timetable', error: err.message })
  }
})

export default router
