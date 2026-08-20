import express from 'express'
import { verifyToken, isAdmin } from '../middleware/auth.js'
import { asyncHandler } from '../middleware/errorHandler.js'
import Promotion from '../models/Promotion.js'
import Student from '../models/Student.js'
import Class from '../models/Class.js'
import AcademicYear from '../models/AcademicYear.js'
import { logAudit } from '../middleware/auditLogger.js'

const router = express.Router()

// All routes require authentication and admin privileges
router.use(verifyToken)
router.use(isAdmin)

// GET all promotions
router.get('/', asyncHandler(async (req, res) => {
  const { academicYearId, studentId } = req.query

  const filter = {}
  if (academicYearId) filter.fromAcademicYearId = academicYearId
  if (studentId) filter.studentId = studentId

  const promotions = await Promotion.find(filter)
    .populate('studentId', 'name enrollmentNumber')
    .populate('fromClassId', 'name grade section')
    .populate('toClassId', 'name grade section')
    .populate('fromAcademicYearId', 'name')
    .populate('toAcademicYearId', 'name')
    .populate('promotedBy', 'name email')
    .sort({ promotionDate: -1 })

  res.json({
    success: true,
    count: promotions.length,
    data: promotions
  })
}))

// GET promotion by ID
router.get('/:id', asyncHandler(async (req, res) => {
  const promotion = await Promotion.findById(req.params.id)
    .populate('studentId', 'name enrollmentNumber grade section')
    .populate('fromClassId', 'name grade section')
    .populate('toClassId', 'name grade section')
    .populate('fromAcademicYearId', 'name')
    .populate('toAcademicYearId', 'name')
    .populate('promotedBy', 'name email')

  if (!promotion) {
    return res.status(404).json({
      success: false,
      message: 'Promotion record not found'
    })
  }

  res.json({
    success: true,
    data: promotion
  })
}))

// PREVIEW promotion for students
router.post('/preview', asyncHandler(async (req, res) => {
  const { fromClassId, toClassId, toAcademicYearId, studentIds } = req.body

  if (!fromClassId || !toClassId || !toAcademicYearId) {
    return res.status(400).json({
      success: false,
      message: 'Missing required fields: fromClassId, toClassId, toAcademicYearId'
    })
  }

  // Get classes
  const fromClass = await Class.findById(fromClassId)
  const toClass = await Class.findById(toClassId)
  const toAcademicYear = await AcademicYear.findById(toAcademicYearId)

  if (!fromClass || !toClass || !toAcademicYear) {
    return res.status(404).json({
      success: false,
      message: 'Class or academic year not found'
    })
  }

  // Get students to promote
  const filter = studentIds && studentIds.length > 0
    ? { _id: { $in: studentIds }, classId: fromClassId, status: 'active' }
    : { classId: fromClassId, status: 'active' }

  const students = await Student.find(filter)
    .populate('userId', 'name email')

  const preview = students.map(student => ({
    studentId: student._id,
    studentName: student.name,
    enrollmentNumber: student.enrollmentNumber,
    currentGrade: student.grade,
    currentSection: student.section,
    newGrade: toClass.grade,
    newSection: toClass.section,
    fromClass: `${fromClass.grade}-${fromClass.section}`,
    toClass: `${toClass.grade}-${toClass.section}`
  }))

  res.json({
    success: true,
    count: preview.length,
    fromClass: {
      id: fromClass._id,
      name: fromClass.name,
      grade: fromClass.grade,
      section: fromClass.section
    },
    toClass: {
      id: toClass._id,
      name: toClass.name,
      grade: toClass.grade,
      section: toClass.section
    },
    toAcademicYear: {
      id: toAcademicYear._id,
      name: toAcademicYear.name
    },
    students: preview
  })
}))

// PROMOTE students (individual or bulk)
router.post('/', asyncHandler(async (req, res) => {
  const { 
    studentIds, 
    fromClassId, 
    toClassId, 
    fromAcademicYearId, 
    toAcademicYearId,
    status,
    remarks 
  } = req.body

  if (!studentIds || !Array.isArray(studentIds) || studentIds.length === 0) {
    return res.status(400).json({
      success: false,
      message: 'studentIds array is required'
    })
  }

  if (!fromClassId || !toClassId || !fromAcademicYearId || !toAcademicYearId) {
    return res.status(400).json({
      success: false,
      message: 'All fields are required'
    })
  }

  // Verify classes and academic years exist
  const [fromClass, toClass, fromAcademicYear, toAcademicYear] = await Promise.all([
    Class.findById(fromClassId),
    Class.findById(toClassId),
    AcademicYear.findById(fromAcademicYearId),
    AcademicYear.findById(toAcademicYearId)
  ])

  if (!fromClass || !toClass || !fromAcademicYear || !toAcademicYear) {
    return res.status(404).json({
      success: false,
      message: 'Class or academic year not found'
    })
  }

  const promotions = []
  const errors = []

  for (const studentId of studentIds) {
    try {
      const student = await Student.findById(studentId)

      if (!student) {
        errors.push({ studentId, error: 'Student not found' })
        continue
      }

      if (student.classId.toString() !== fromClassId) {
        errors.push({ 
          studentId, 
          studentName: student.name,
          error: 'Student is not in the source class' 
        })
        continue
      }

      // Create promotion record
      const promotion = new Promotion({
        studentId,
        fromClassId,
        toClassId,
        fromAcademicYearId,
        toAcademicYearId,
        status: status || 'promoted',
        remarks,
        promotedBy: req.user.id
      })

      await promotion.save()

      // Update student's current class
      student.classId = toClassId
      student.grade = toClass.grade
      student.section = toClass.section
      student.updatedAt = Date.now()
      await student.save()

      // Audit log
      logAudit({
        userId: req.user.id,
        userEmail: req.user.email,
        userRole: req.user.role,
        action: 'student_promoted',
        resource: 'student',
        resourceId: studentId,
        details: { description: `Promoted ${student.name} from ${fromClass.name} to ${toClass.name} for ${toAcademicYear.name}` },
        ipAddress: req.ip || req.connection.remoteAddress,
        userAgent: req.get('user-agent'),
        success: true
      })

      promotions.push(promotion)

    } catch (error) {
      errors.push({ studentId, error: error.message })
    }
  }

  res.status(promotions.length > 0 ? 201 : 400).json({
    success: promotions.length > 0,
    message: `Promoted ${promotions.length} student(s)`,
    promoted: promotions.length,
    failed: errors.length,
    data: promotions,
    errors: errors.length > 0 ? errors : undefined
  })
}))

// GET promotion history for a student
router.get('/student/:studentId/history', asyncHandler(async (req, res) => {
  const promotions = await Promotion.find({ studentId: req.params.studentId })
    .populate('fromClassId', 'name grade section')
    .populate('toClassId', 'name grade section')
    .populate('fromAcademicYearId', 'name')
    .populate('toAcademicYearId', 'name')
    .populate('promotedBy', 'name')
    .sort({ promotionDate: -1 })

  res.json({
    success: true,
    count: promotions.length,
    data: promotions
  })
}))

export default router
