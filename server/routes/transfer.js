import express from 'express'
import { verifyToken, isAdmin } from '../middleware/auth.js'
import { asyncHandler } from '../middleware/errorHandler.js'
import Transfer from '../models/Transfer.js'
import Student from '../models/Student.js'
import Class from '../models/Class.js'
import AcademicYear from '../models/AcademicYear.js'
import { logAudit } from '../middleware/auditLogger.js'

const router = express.Router()

// All routes require authentication and admin privileges
router.use(verifyToken)
router.use(isAdmin)

// GET all transfers
router.get('/', asyncHandler(async (req, res) => {
  const { academicYearId, studentId } = req.query

  const filter = {}
  if (academicYearId) filter.academicYearId = academicYearId
  if (studentId) filter.studentId = studentId

  const transfers = await Transfer.find(filter)
    .populate('studentId', 'name enrollmentNumber')
    .populate('fromClassId', 'name grade section')
    .populate('toClassId', 'name grade section')
    .populate('academicYearId', 'name')
    .populate('transferredBy', 'name email')
    .sort({ transferDate: -1 })

  res.json({
    success: true,
    count: transfers.length,
    data: transfers
  })
}))

// GET transfer by ID
router.get('/:id', asyncHandler(async (req, res) => {
  const transfer = await Transfer.findById(req.params.id)
    .populate('studentId', 'name enrollmentNumber grade section')
    .populate('fromClassId', 'name grade section')
    .populate('toClassId', 'name grade section')
    .populate('academicYearId', 'name')
    .populate('transferredBy', 'name email')

  if (!transfer) {
    return res.status(404).json({
      success: false,
      message: 'Transfer record not found'
    })
  }

  res.json({
    success: true,
    data: transfer
  })
}))

// TRANSFER student
router.post('/', asyncHandler(async (req, res) => {
  const { 
    studentId, 
    fromClassId, 
    toClassId, 
    academicYearId,
    reason,
    remarks 
  } = req.body

  if (!studentId || !fromClassId || !toClassId || !academicYearId || !reason) {
    return res.status(400).json({
      success: false,
      message: 'All fields are required: studentId, fromClassId, toClassId, academicYearId, reason'
    })
  }

  // Prevent transfer to same class
  if (fromClassId === toClassId) {
    return res.status(400).json({
      success: false,
      message: 'Cannot transfer student to the same class'
    })
  }

  // Verify student, classes, and academic year exist
  const [student, fromClass, toClass, academicYear] = await Promise.all([
    Student.findById(studentId),
    Class.findById(fromClassId),
    Class.findById(toClassId),
    AcademicYear.findById(academicYearId)
  ])

  if (!student) {
    return res.status(404).json({
      success: false,
      message: 'Student not found'
    })
  }

  if (!fromClass || !toClass) {
    return res.status(404).json({
      success: false,
      message: 'Class not found'
    })
  }

  if (!academicYear) {
    return res.status(404).json({
      success: false,
      message: 'Academic year not found'
    })
  }

  // Verify student is currently in fromClass
  if (student.classId.toString() !== fromClassId) {
    return res.status(400).json({
      success: false,
      message: `Student is not currently in ${fromClass.name}. Current class: ${student.grade}-${student.section}`
    })
  }

  // Create transfer record
  const transfer = new Transfer({
    studentId,
    fromClassId,
    toClassId,
    academicYearId,
    reason,
    remarks,
    transferredBy: req.user.id
  })

  await transfer.save()

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
    action: 'student_transferred',
    resource: 'student',
    resourceId: studentId,
    details: { description: `Transferred ${student.name} from ${fromClass.name} to ${toClass.name}`, reason },
    ipAddress: req.ip || req.connection.remoteAddress,
    userAgent: req.get('user-agent'),
    success: true
  })

  await transfer.populate([
    { path: 'studentId', select: 'name enrollmentNumber' },
    { path: 'fromClassId', select: 'name grade section' },
    { path: 'toClassId', select: 'name grade section' },
    { path: 'academicYearId', select: 'name' }
  ])

  res.status(201).json({
    success: true,
    message: 'Student transferred successfully',
    data: transfer
  })
}))

// GET transfer history for a student
router.get('/student/:studentId/history', asyncHandler(async (req, res) => {
  const transfers = await Transfer.find({ studentId: req.params.studentId })
    .populate('fromClassId', 'name grade section')
    .populate('toClassId', 'name grade section')
    .populate('academicYearId', 'name')
    .populate('transferredBy', 'name')
    .sort({ transferDate: -1 })

  res.json({
    success: true,
    count: transfers.length,
    data: transfers
  })
}))

// GET transfers for a specific class
router.get('/class/:classId', asyncHandler(async (req, res) => {
  const { type } = req.query // 'in' or 'out'

  let filter
  if (type === 'in') {
    filter = { toClassId: req.params.classId }
  } else if (type === 'out') {
    filter = { fromClassId: req.params.classId }
  } else {
    filter = {
      $or: [
        { fromClassId: req.params.classId },
        { toClassId: req.params.classId }
      ]
    }
  }

  const transfers = await Transfer.find(filter)
    .populate('studentId', 'name enrollmentNumber')
    .populate('fromClassId', 'name grade section')
    .populate('toClassId', 'name grade section')
    .populate('academicYearId', 'name')
    .sort({ transferDate: -1 })

  res.json({
    success: true,
    count: transfers.length,
    data: transfers
  })
}))

export default router
