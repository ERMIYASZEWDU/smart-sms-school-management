import express from 'express'
import { verifyToken, checkRole, verifyParentChildAccess } from '../middleware/auth.js'
import Parent from '../models/Parent.js'
import Student from '../models/Student.js'
import Grade from '../models/Grade.js'
import Attendance from '../models/Attendance.js'
import Assignment from '../models/Assignment.js'
import AssignmentSubmission from '../models/AssignmentSubmission.js'
import Announcement from '../models/Announcement.js'
import Enrollment from '../models/Enrollment.js'
import AcademicYear from '../models/AcademicYear.js'

const router = express.Router()

// Get parent's dashboard data
router.get('/dashboard', verifyToken, checkRole(['parent']), async (req, res) => {
  try {
    const parent = await Parent.findOne({ userId: req.user.id })
      .populate('studentIds')
      .lean()

    if (!parent) {
      return res.status(404).json({ message: 'Parent profile not found' })
    }

    // Get active academic year
    const activeYear = await AcademicYear.findOne({ isActive: true }).lean()

    // Get current enrollments for each child with academic year context
    const childrenWithEnrollments = await Promise.all(
      (parent.studentIds || []).map(async (child) => {
        let currentEnrollment = null
        
        // Try to get enrollment from currentEnrollmentId
        if (child.currentEnrollmentId) {
          currentEnrollment = await Enrollment.findById(child.currentEnrollmentId)
            .populate('classId')
            .populate('academicYearId')
            .lean()
        }
        
        // Fallback: find active enrollment
        if (!currentEnrollment && activeYear) {
          currentEnrollment = await Enrollment.findOne({
            studentId: child._id,
            academicYearId: activeYear._id,
            status: 'active'
          })
            .populate('classId')
            .populate('academicYearId')
            .lean()
        }

        return {
          ...child,
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
        }
      })
    )

    // Get recent announcements for parents
    const announcements = await Announcement.find({
      isPublished: true,
      $or: [
        { targetRole: 'all' },
        { targetRole: 'parent' }
      ]
    })
      .sort({ createdAt: -1 })
      .limit(5)
      .lean()

    res.json({
      parent,
      children: childrenWithEnrollments,
      academicYear: activeYear ? {
        id: activeYear._id,
        name: activeYear.name,
        startDate: activeYear.startDate,
        endDate: activeYear.endDate,
        isActive: activeYear.isActive
      } : null,
      announcements,
      totalChildren: parent.studentIds?.length || 0
    })
  } catch (err) {
    console.error('Error fetching parent dashboard:', err)
    res.status(500).json({ message: 'Error fetching dashboard', error: err.message })
  }
})

// Get parent's children
router.get('/children', verifyToken, checkRole(['parent']), async (req, res) => {
  try {
    const parent = await Parent.findOne({ userId: req.user.id })
      .populate({
        path: 'studentIds',
        select: 'name enrollmentNumber grade section stream rollNumber dateOfBirth gpa attendance status currentEnrollmentId photo'
      })
      .lean()

    if (!parent) {
      return res.status(404).json({ message: 'Parent profile not found' })
    }

    // Get current enrollments for each child
    const childrenWithEnrollments = await Promise.all(
      (parent.studentIds || []).map(async (child) => {
        let currentEnrollment = null
        
        if (child.currentEnrollmentId) {
          currentEnrollment = await Enrollment.findById(child.currentEnrollmentId)
            .populate('classId')
            .populate('academicYearId')
            .lean()
        } else {
          // Fallback: find active enrollment
          const activeYear = await AcademicYear.findOne({ isActive: true })
          if (activeYear) {
            currentEnrollment = await Enrollment.findOne({
              studentId: child._id,
              academicYearId: activeYear._id,
              status: 'active'
            })
              .populate('classId')
              .populate('academicYearId')
              .lean()
          }
        }

        return {
          ...child,
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
        }
      })
    )

    res.json(childrenWithEnrollments)
  } catch (err) {
    console.error('Error fetching children:', err)
    res.status(500).json({ message: 'Error fetching children', error: err.message })
  }
})

// Get specific child details
router.get('/child/:studentId', verifyToken, checkRole(['parent']), verifyParentChildAccess, async (req, res) => {
  try {
    const student = await Student.findById(req.params.studentId)
      .populate('classId')
      .populate('currentEnrollmentId')
      .lean()

    if (!student) {
      return res.status(404).json({ message: 'Student not found' })
    }

    // Get current enrollment with academic year
    let currentEnrollment = null
    if (student.currentEnrollmentId) {
      currentEnrollment = await Enrollment.findById(student.currentEnrollmentId)
        .populate('classId')
        .populate('academicYearId')
        .lean()
    } else {
      // Fallback: find active enrollment
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
      }
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
    console.error('Error fetching child details:', err)
    res.status(500).json({ message: 'Error fetching child details', error: err.message })
  }
})

// Get child's enrollment history
router.get('/child/:studentId/enrollment-history', verifyToken, checkRole(['parent']), verifyParentChildAccess, async (req, res) => {
  try {
    const student = await Student.findById(req.params.studentId).lean()
    
    if (!student) {
      return res.status(404).json({ message: 'Student not found' })
    }

    const enrollmentHistory = await Enrollment.find({ studentId: student._id })
      .populate('classId')
      .populate('academicYearId')
      .populate('enrolledBy', 'name email')
      .populate('statusChangedBy', 'name email')
      .populate('promotedFrom')
      .populate('promotedTo')
      .populate('transferredFrom')
      .populate('transferredTo')
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

// Get child's grades
router.get('/child/:studentId/grades', verifyToken, checkRole(['parent']), verifyParentChildAccess, async (req, res) => {
  try {
    const grades = await Grade.find({ studentId: req.params.studentId })
      .populate('teacherId', 'name email')
      .sort({ createdAt: -1 })
      .lean()

    res.json(grades)
  } catch (err) {
    console.error('Error fetching grades:', err)
    res.status(500).json({ message: 'Error fetching grades', error: err.message })
  }
})

// Get child's attendance
router.get('/child/:studentId/attendance', verifyToken, checkRole(['parent']), verifyParentChildAccess, async (req, res) => {
  try {
    const { startDate, endDate } = req.query
    let query = { studentId: req.params.studentId }

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

// Get child's assignments
router.get('/child/:studentId/assignments', verifyToken, checkRole(['parent']), verifyParentChildAccess, async (req, res) => {
  try {
    // Get student's grade
    const student = await Student.findById(req.params.studentId).lean()
    if (!student) {
      return res.status(404).json({ message: 'Student not found' })
    }

    // Match assignments by classId (preferred) OR grade string (fallback)
    const classConditions = [{ grade: student.grade }]
    if (student.classId) classConditions.push({ classId: student.classId })

    const assignments = await Assignment.find({
      isPublished: true,
      $or: classConditions
    })
      .populate('teacherId', 'name email')
      .sort({ createdAt: -1 })
      .lean()

    // Get submissions for this student
    const submissions = await AssignmentSubmission.find({
      studentId: req.params.studentId
    }).lean()

    // Map submissions to assignments
    const assignmentsWithSubmissions = assignments.map(assignment => {
      const submission = submissions.find(
        s => s.assignmentId.toString() === assignment._id.toString()
      )
      return {
        ...assignment,
        submission: submission || null
      }
    })

    res.json(assignmentsWithSubmissions)
  } catch (err) {
    console.error('Error fetching assignments:', err)
    res.status(500).json({ message: 'Error fetching assignments', error: err.message })
  }
})

// Get announcements
router.get('/announcements', verifyToken, checkRole(['parent']), async (req, res) => {
  try {
    const announcements = await Announcement.find({
      isPublished: true,
      $or: [
        { targetRole: 'all' },
        { targetRole: 'parent' }
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

export default router
