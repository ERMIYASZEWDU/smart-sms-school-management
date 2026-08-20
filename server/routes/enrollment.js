import express from 'express'
import Enrollment from '../models/Enrollment.js'
import Student from '../models/Student.js'
import Class from '../models/Class.js'
import AcademicYear from '../models/AcademicYear.js'
import { verifyToken as authenticateToken, checkRole } from '../middleware/auth.js'

// Helper function to match old authorizeRoles API
const authorizeRoles = (...roles) => checkRole(roles)
import notificationService from '../services/notificationService.js'

const router = express.Router()

// ============================================================
// ENROLLMENT ROUTES
// ============================================================

/**
 * @route   POST /api/enrollment/enroll
 * @desc    Enroll a student in a class for an academic year
 * @access  Admin only
 */
router.post('/enroll', authenticateToken, authorizeRoles('admin'), async (req, res) => {
  try {
    const { studentId, classId, academicYearId, rollNumber, remarks } = req.body

    // Validate required fields
    if (!studentId || !classId || !academicYearId || !rollNumber) {
      return res.status(400).json({ 
        message: 'Student ID, Class ID, Academic Year ID, and Roll Number are required' 
      })
    }

    // Check if student exists
    const student = await Student.findById(studentId)
    if (!student) {
      return res.status(404).json({ message: 'Student not found' })
    }

    // Check if class exists
    const classData = await Class.findById(classId).populate('academicYearId')
    if (!classData) {
      return res.status(404).json({ message: 'Class not found' })
    }

    // Check if academic year exists and matches class
    const academicYear = await AcademicYear.findById(academicYearId)
    if (!academicYear) {
      return res.status(404).json({ message: 'Academic year not found' })
    }

    if (classData.academicYearId.toString() !== academicYearId) {
      return res.status(400).json({ 
        message: 'Class does not belong to the specified academic year' 
      })
    }

    // Check if student is already enrolled in this academic year
    const existingEnrollment = await Enrollment.findOne({
      studentId,
      academicYearId,
      status: 'active'
    })

    if (existingEnrollment) {
      return res.status(400).json({ 
        message: 'Student is already enrolled in this academic year' 
      })
    }

    // Validate stream for Grade 11-12
    const gradeNumber = parseInt(classData.grade.replace('Grade ', ''))
    if (gradeNumber >= 11 && gradeNumber <= 12 && !classData.stream) {
      return res.status(400).json({ 
        message: 'Stream is required for Grade 11 and 12' 
      })
    }

    // Check class capacity
    const enrolledCount = await Enrollment.countClassStudents(classId, academicYearId, 'active')
    if (enrolledCount >= classData.capacity) {
      return res.status(400).json({ 
        message: `Class is at full capacity (${classData.capacity} students)` 
      })
    }

    // Create enrollment
    const enrollment = new Enrollment({
      studentId,
      classId,
      academicYearId,
      grade: classData.grade,
      section: classData.section,
      stream: classData.stream,
      rollNumber,
      status: 'active',
      enrolledBy: req.user.id,
      remarks
    })

    await enrollment.save()

    // Update student's current enrollment and cache fields
    student.currentEnrollmentId = enrollment._id
    student.classId = classId
    student.grade = classData.grade
    student.section = classData.section
    student.stream = classData.stream
    student.rollNumber = rollNumber
    student.status = 'active'
    await student.save()

    // Send notification to student
    try {
      await notificationService.notifyStudentEnrollment(
        studentId,
        classData.grade,
        classData.section,
        classData.stream,
        academicYear.name
      )
    } catch (notifError) {
      console.error('Notification error:', notifError)
    }

    res.status(201).json({ 
      message: 'Student enrolled successfully',
      enrollment: await enrollment.populate([
        { path: 'studentId', select: 'name enrollmentNumber' },
        { path: 'classId' },
        { path: 'academicYearId' }
      ])
    })
  } catch (error) {
    console.error('Enrollment error:', error)
    res.status(500).json({ message: 'Server error during enrollment' })
  }
})

/**
 * @route   POST /api/enrollment/promote
 * @desc    Promote students to next grade/class
 * @access  Admin only
 */
router.post('/promote', authenticateToken, authorizeRoles('admin'), async (req, res) => {
  try {
    const { 
      studentIds, 
      targetClassId, 
      targetAcademicYearId, 
      remarks 
    } = req.body

    // Validate required fields
    if (!studentIds || !Array.isArray(studentIds) || studentIds.length === 0) {
      return res.status(400).json({ message: 'Student IDs array is required' })
    }

    if (!targetClassId || !targetAcademicYearId) {
      return res.status(400).json({ 
        message: 'Target Class ID and Target Academic Year ID are required' 
      })
    }

    // Check target class exists
    const targetClass = await Class.findById(targetClassId).populate('academicYearId')
    if (!targetClass) {
      return res.status(404).json({ message: 'Target class not found' })
    }

    // Check target academic year exists
    const targetAcademicYear = await AcademicYear.findById(targetAcademicYearId)
    if (!targetAcademicYear) {
      return res.status(404).json({ message: 'Target academic year not found' })
    }

    // Validate target class belongs to target academic year
    if (targetClass.academicYearId.toString() !== targetAcademicYearId) {
      return res.status(400).json({ 
        message: 'Target class does not belong to the specified academic year' 
      })
    }

    // Validate Grade 12 cannot be promoted to Grade 13
    const targetGradeNumber = parseInt(targetClass.grade.replace('Grade ', ''))
    if (targetGradeNumber > 12) {
      return res.status(400).json({ 
        message: 'Cannot promote beyond Grade 12' 
      })
    }

    const promotedStudents = []
    const errors = []

    for (const studentId of studentIds) {
      try {
        // Get student
        const student = await Student.findById(studentId)
        if (!student) {
          errors.push({ studentId, error: 'Student not found' })
          continue
        }

        // Get current enrollment
        const currentEnrollment = await Enrollment.findOne({
          studentId,
          status: 'active'
        }).sort({ createdAt: -1 })

        if (!currentEnrollment) {
          errors.push({ studentId, error: 'No active enrollment found' })
          continue
        }

        // Check if already enrolled in target academic year
        const existingEnrollment = await Enrollment.findOne({
          studentId,
          academicYearId: targetAcademicYearId,
          status: 'active'
        })

        if (existingEnrollment) {
          errors.push({ 
            studentId, 
            error: 'Student already enrolled in target academic year' 
          })
          continue
        }

        // Validate promotion logic (Grade 10 -> Grade 11 requires stream)
        const currentGradeNumber = parseInt(currentEnrollment.grade.replace('Grade ', ''))
        if (currentGradeNumber === 10 && targetGradeNumber === 11 && !targetClass.stream) {
          errors.push({ 
            studentId, 
            error: 'Stream is required when promoting to Grade 11' 
          })
          continue
        }

        // Generate roll number (auto-increment)
        const enrolledCount = await Enrollment.countClassStudents(
          targetClassId, 
          targetAcademicYearId, 
          'active'
        )
        const newRollNumber = enrolledCount + 1

        // Create new enrollment
        const newEnrollment = new Enrollment({
          studentId,
          classId: targetClassId,
          academicYearId: targetAcademicYearId,
          grade: targetClass.grade,
          section: targetClass.section,
          stream: targetClass.stream,
          rollNumber: newRollNumber,
          status: 'active',
          enrolledBy: req.user.id,
          promotedFrom: currentEnrollment._id,
          remarks
        })

        await newEnrollment.save()

        // Update current enrollment status
        await currentEnrollment.updateStatus('promoted', 'Promoted to next grade', req.user.id)
        currentEnrollment.promotedTo = newEnrollment._id
        await currentEnrollment.save()

        // Update student cache fields
        student.currentEnrollmentId = newEnrollment._id
        student.classId = targetClassId
        student.grade = targetClass.grade
        student.section = targetClass.section
        student.stream = targetClass.stream
        student.rollNumber = newRollNumber
        await student.save()

        // Send promotion notification
        try {
          await notificationService.notifyStudentPromotion(
            studentId,
            currentEnrollment.grade,
            targetClass.grade,
            targetClass.section,
            targetClass.stream,
            targetAcademicYear.name
          )
        } catch (notifError) {
          console.error('Notification error:', notifError)
        }

        promotedStudents.push({
          studentId,
          enrollmentId: newEnrollment._id,
          name: student.name
        })

      } catch (err) {
        errors.push({ studentId, error: err.message })
      }
    }

    res.status(200).json({ 
      message: `Promoted ${promotedStudents.length} of ${studentIds.length} students`,
      promotedStudents,
      errors: errors.length > 0 ? errors : undefined
    })
  } catch (error) {
    console.error('Promotion error:', error)
    res.status(500).json({ message: 'Server error during promotion' })
  }
})

/**
 * @route   POST /api/enrollment/transfer
 * @desc    Transfer student to a different class (same or different academic year)
 * @access  Admin only
 */
router.post('/transfer', authenticateToken, authorizeRoles('admin'), async (req, res) => {
  try {
    const { studentId, targetClassId, reason, remarks } = req.body

    // Validate required fields
    if (!studentId || !targetClassId) {
      return res.status(400).json({ 
        message: 'Student ID and Target Class ID are required' 
      })
    }

    // Get student
    const student = await Student.findById(studentId)
    if (!student) {
      return res.status(404).json({ message: 'Student not found' })
    }

    // Get current enrollment
    const currentEnrollment = await Enrollment.findOne({
      studentId,
      status: 'active'
    }).sort({ createdAt: -1 })

    if (!currentEnrollment) {
      return res.status(404).json({ message: 'No active enrollment found for student' })
    }

    // Get target class
    const targetClass = await Class.findById(targetClassId).populate('academicYearId')
    if (!targetClass) {
      return res.status(404).json({ message: 'Target class not found' })
    }

    // Check if transferring to same class
    if (currentEnrollment.classId.toString() === targetClassId) {
      return res.status(400).json({ 
        message: 'Student is already enrolled in this class' 
      })
    }

    // Check if already enrolled in target class's academic year (different class)
    const conflictEnrollment = await Enrollment.findOne({
      studentId,
      academicYearId: targetClass.academicYearId,
      classId: { $ne: currentEnrollment.classId },
      status: 'active'
    })

    if (conflictEnrollment) {
      return res.status(400).json({ 
        message: 'Student is already enrolled in a different class for this academic year' 
      })
    }

    // Generate roll number
    const enrolledCount = await Enrollment.countClassStudents(
      targetClassId, 
      targetClass.academicYearId, 
      'active'
    )
    const newRollNumber = enrolledCount + 1

    // Create new enrollment
    const newEnrollment = new Enrollment({
      studentId,
      classId: targetClassId,
      academicYearId: targetClass.academicYearId,
      grade: targetClass.grade,
      section: targetClass.section,
      stream: targetClass.stream,
      rollNumber: newRollNumber,
      status: 'active',
      enrolledBy: req.user.id,
      transferredFrom: currentEnrollment._id,
      remarks: remarks || reason
    })

    await newEnrollment.save()

    // Update current enrollment status
    await currentEnrollment.updateStatus('transferred', reason || 'Transferred to another class', req.user.id)
    currentEnrollment.transferredTo = newEnrollment._id
    await currentEnrollment.save()

    // Update student cache fields
    student.currentEnrollmentId = newEnrollment._id
    student.classId = targetClassId
    student.grade = targetClass.grade
    student.section = targetClass.section
    student.stream = targetClass.stream
    student.rollNumber = newRollNumber
    student.status = 'transferred'
    await student.save()

    // Send transfer notification
    try {
      await notificationService.notifyStudentTransfer(
        studentId,
        currentEnrollment.grade,
        currentEnrollment.section,
        currentEnrollment.stream,
        targetClass.grade,
        targetClass.section,
        targetClass.stream
      )
    } catch (notifError) {
      console.error('Notification error:', notifError)
    }

    res.status(200).json({ 
      message: 'Student transferred successfully',
      enrollment: await newEnrollment.populate([
        { path: 'studentId', select: 'name enrollmentNumber' },
        { path: 'classId' },
        { path: 'academicYearId' }
      ])
    })
  } catch (error) {
    console.error('Transfer error:', error)
    res.status(500).json({ message: 'Server error during transfer' })
  }
})

/**
 * @route   GET /api/enrollment/student/:studentId/history
 * @desc    Get enrollment history for a student
 * @access  Admin, Student (own), Parent (children)
 */
router.get('/student/:studentId/history', authenticateToken, async (req, res) => {
  try {
    const { studentId } = req.params

    // Authorization check
    if (req.user.role === 'student') {
      const student = await Student.findOne({ userId: req.user.id })
      if (!student || student._id.toString() !== studentId) {
        return res.status(403).json({ message: 'Access denied' })
      }
    } else if (req.user.role === 'parent') {
      const student = await Student.findById(studentId)
      if (!student || !student.parentIds.includes(req.user.id)) {
        return res.status(403).json({ message: 'Access denied' })
      }
    }

    const enrollmentHistory = await Enrollment.getEnrollmentHistory(studentId)

    res.status(200).json({ 
      enrollmentHistory,
      count: enrollmentHistory.length
    })
  } catch (error) {
    console.error('Get enrollment history error:', error)
    res.status(500).json({ message: 'Server error fetching enrollment history' })
  }
})

/**
 * @route   GET /api/enrollment/student/:studentId/current
 * @desc    Get current enrollment for a student
 * @access  Admin, Student (own), Parent (children), Teacher
 */
router.get('/student/:studentId/current', authenticateToken, async (req, res) => {
  try {
    const { studentId } = req.params

    // Authorization check
    if (req.user.role === 'student') {
      const student = await Student.findOne({ userId: req.user.id })
      if (!student || student._id.toString() !== studentId) {
        return res.status(403).json({ message: 'Access denied' })
      }
    } else if (req.user.role === 'parent') {
      const student = await Student.findById(studentId)
      if (!student || !student.parentIds.includes(req.user.id)) {
        return res.status(403).json({ message: 'Access denied' })
      }
    }

    const currentEnrollment = await Enrollment.getCurrentEnrollment(studentId)

    if (!currentEnrollment) {
      return res.status(404).json({ message: 'No active enrollment found' })
    }

    res.status(200).json({ enrollment: currentEnrollment })
  } catch (error) {
    console.error('Get current enrollment error:', error)
    res.status(500).json({ message: 'Server error fetching current enrollment' })
  }
})

/**
 * @route   GET /api/enrollment/class/:classId/students
 * @desc    Get all students enrolled in a class for a specific academic year
 * @access  Admin, Teacher (assigned classes)
 */
router.get('/class/:classId/students', authenticateToken, async (req, res) => {
  try {
    const { classId } = req.params
    const { academicYearId, status = 'active' } = req.query

    // Get class
    const classData = await Class.findById(classId)
    if (!classData) {
      return res.status(404).json({ message: 'Class not found' })
    }

    // Authorization check for teachers
    if (req.user.role === 'teacher') {
      // Check if teacher is assigned to this class
      // (Implementation depends on Teacher model structure)
    }

    const academicYear = academicYearId || classData.academicYearId

    const students = await Enrollment.getClassStudents(classId, academicYear, status)

    res.status(200).json({ 
      students,
      count: students.length,
      class: {
        id: classData._id,
        name: classData.name,
        grade: classData.grade,
        section: classData.section,
        stream: classData.stream
      }
    })
  } catch (error) {
    console.error('Get class students error:', error)
    res.status(500).json({ message: 'Server error fetching class students' })
  }
})

/**
 * @route   PUT /api/enrollment/:enrollmentId/status
 * @desc    Update enrollment status (withdraw, suspend, etc.)
 * @access  Admin only
 */
router.put('/:enrollmentId/status', authenticateToken, authorizeRoles('admin'), async (req, res) => {
  try {
    const { enrollmentId } = req.params
    const { status, reason } = req.body

    // Validate status
    const validStatuses = ['active', 'promoted', 'transferred', 'graduated', 'withdrawn', 'suspended', 'completed']
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ 
        message: `Invalid status. Must be one of: ${validStatuses.join(', ')}` 
      })
    }

    // Get enrollment
    const enrollment = await Enrollment.findById(enrollmentId)
    if (!enrollment) {
      return res.status(404).json({ message: 'Enrollment not found' })
    }

    // Update status
    await enrollment.updateStatus(status, reason, req.user.id)

    // Update student status if withdrawn/graduated
    if (status === 'withdrawn' || status === 'graduated') {
      const student = await Student.findById(enrollment.studentId)
      if (student) {
        student.status = status === 'withdrawn' ? 'inactive' : 'graduated'
        if (status === 'withdrawn') {
          student.currentEnrollmentId = null
        }
        await student.save()
      }
    }

    res.status(200).json({ 
      message: 'Enrollment status updated successfully',
      enrollment: await enrollment.populate([
        { path: 'studentId', select: 'name enrollmentNumber' },
        { path: 'classId' },
        { path: 'academicYearId' }
      ])
    })
  } catch (error) {
    console.error('Update enrollment status error:', error)
    res.status(500).json({ message: 'Server error updating enrollment status' })
  }
})

/**
 * @route   GET /api/enrollment/academic-year/:academicYearId/students
 * @desc    Get all students enrolled in a specific academic year (with filters)
 * @access  Admin
 */
router.get('/academic-year/:academicYearId/students', authenticateToken, authorizeRoles('admin'), async (req, res) => {
  try {
    const { academicYearId } = req.params
    const { grade, section, stream, status = 'active' } = req.query

    const filters = { 
      academicYearId,
      status 
    }

    if (grade) filters.grade = grade
    if (section) filters.section = section
    if (stream) filters.stream = stream

    const enrollments = await Enrollment.getStudentsByClass(filters)

    res.status(200).json({ 
      enrollments,
      count: enrollments.length
    })
  } catch (error) {
    console.error('Get academic year students error:', error)
    res.status(500).json({ message: 'Server error fetching students' })
  }
})

export default router
