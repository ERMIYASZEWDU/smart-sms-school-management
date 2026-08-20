import express from 'express'
import { verifyToken, isAdmin } from '../middleware/auth.js'
import { asyncHandler } from '../middleware/errorHandler.js'
import AcademicYear from '../models/AcademicYear.js'
import Term from '../models/Term.js'
import { logAudit } from '../middleware/auditLogger.js'

const router = express.Router()

// All routes require authentication and admin privileges
router.use(verifyToken)
router.use(isAdmin)

// GET all academic years
router.get('/', asyncHandler(async (req, res) => {
  const academicYears = await AcademicYear.find()
    .sort({ startDate: -1 })
    .populate('createdBy', 'name email')

  res.json({
    success: true,
    count: academicYears.length,
    data: academicYears
  })
}))

// GET active academic year
router.get('/active', asyncHandler(async (req, res) => {
  const activeYear = await AcademicYear.findOne({ isActive: true })
    .populate('createdBy', 'name email')

  if (!activeYear) {
    return res.status(404).json({
      success: false,
      message: 'No active academic year found'
    })
  }

  res.json({
    success: true,
    data: activeYear
  })
}))

// GET single academic year
router.get('/:id', asyncHandler(async (req, res) => {
  const academicYear = await AcademicYear.findById(req.params.id)
    .populate('createdBy', 'name email')

  if (!academicYear) {
    return res.status(404).json({
      success: false,
      message: 'Academic year not found'
    })
  }

  // Get terms for this academic year
  const terms = await Term.find({ academicYearId: req.params.id })
    .sort({ termNumber: 1 })

  res.json({
    success: true,
    data: {
      ...academicYear.toObject(),
      terms
    }
  })
}))

// CREATE new academic year
router.post('/', asyncHandler(async (req, res) => {
  const { name, startDate, endDate, description, isActive } = req.body

  // Validate dates
  if (new Date(startDate) >= new Date(endDate)) {
    return res.status(400).json({
      success: false,
      message: 'End date must be after start date'
    })
  }

  // If setting as active, deactivate all others
  if (isActive) {
    await AcademicYear.updateMany({}, { isActive: false })
  }

  const academicYear = new AcademicYear({
    name,
    startDate,
    endDate,
    description,
    isActive: isActive || false,
    createdBy: req.user.id
  })

  await academicYear.save()

  // Audit log (never throws; best-effort)
  logAudit({
    userId: req.user.id,
    userEmail: req.user.email,
    userRole: req.user.role,
    action: 'academic_year_created',
    resource: 'academicYear',
    resourceId: academicYear._id.toString(),
    details: { description: `Created academic year: ${name}` },
    ipAddress: req.ip || req.connection.remoteAddress,
    userAgent: req.get('user-agent'),
    success: true
  })

  res.status(201).json({
    success: true,
    message: 'Academic year created successfully',
    data: academicYear
  })
}))

// UPDATE academic year
router.put('/:id', asyncHandler(async (req, res) => {
  const { name, startDate, endDate, description, isActive } = req.body

  let academicYear = await AcademicYear.findById(req.params.id)

  if (!academicYear) {
    return res.status(404).json({
      success: false,
      message: 'Academic year not found'
    })
  }

  // Validate dates if provided
  const newStartDate = startDate || academicYear.startDate
  const newEndDate = endDate || academicYear.endDate
  if (new Date(newStartDate) >= new Date(newEndDate)) {
    return res.status(400).json({
      success: false,
      message: 'End date must be after start date'
    })
  }

  // If setting as active, deactivate all others
  if (isActive && !academicYear.isActive) {
    await AcademicYear.updateMany({}, { isActive: false })
  }

  academicYear.name = name || academicYear.name
  academicYear.startDate = startDate || academicYear.startDate
  academicYear.endDate = endDate || academicYear.endDate
  academicYear.description = description !== undefined ? description : academicYear.description
  academicYear.isActive = isActive !== undefined ? isActive : academicYear.isActive
  academicYear.updatedAt = Date.now()

  await academicYear.save()

  res.json({
    success: true,
    message: 'Academic year updated successfully',
    data: academicYear
  })
}))

// ACTIVATE/DEACTIVATE academic year
router.patch('/:id/toggle-active', asyncHandler(async (req, res) => {
  const academicYear = await AcademicYear.findById(req.params.id)

  if (!academicYear) {
    return res.status(404).json({
      success: false,
      message: 'Academic year not found'
    })
  }

  // If activating, deactivate all others
  if (!academicYear.isActive) {
    await AcademicYear.updateMany({}, { isActive: false })
    academicYear.isActive = true
  } else {
    academicYear.isActive = false
  }

  await academicYear.save()

  res.json({
    success: true,
    message: `Academic year ${academicYear.isActive ? 'activated' : 'deactivated'} successfully`,
    data: academicYear
  })
}))

// ARCHIVE academic year
router.patch('/:id/archive', asyncHandler(async (req, res) => {
  const academicYear = await AcademicYear.findById(req.params.id)

  if (!academicYear) {
    return res.status(404).json({
      success: false,
      message: 'Academic year not found'
    })
  }

  if (academicYear.isActive) {
    return res.status(400).json({
      success: false,
      message: 'Cannot archive the active academic year. Please activate another year first.'
    })
  }

  academicYear.isArchived = true
  academicYear.updatedAt = Date.now()
  await academicYear.save()

  res.json({
    success: true,
    message: 'Academic year archived successfully',
    data: academicYear
  })
}))

// UNARCHIVE academic year
router.patch('/:id/unarchive', asyncHandler(async (req, res) => {
  const academicYear = await AcademicYear.findById(req.params.id)

  if (!academicYear) {
    return res.status(404).json({
      success: false,
      message: 'Academic year not found'
    })
  }

  academicYear.isArchived = false
  academicYear.updatedAt = Date.now()
  await academicYear.save()

  res.json({
    success: true,
    message: 'Academic year unarchived successfully',
    data: academicYear
  })
}))

// DELETE academic year
router.delete('/:id', asyncHandler(async (req, res) => {
  const academicYear = await AcademicYear.findById(req.params.id)

  if (!academicYear) {
    return res.status(404).json({
      success: false,
      message: 'Academic year not found'
    })
  }

  // Check if it's the active academic year
  if (academicYear.isActive) {
    return res.status(400).json({
      success: false,
      message: 'Cannot delete active academic year. Please deactivate it first.'
    })
  }

  // Check if there are any terms associated
  const termsCount = await Term.countDocuments({ academicYearId: req.params.id })
  if (termsCount > 0) {
    return res.status(400).json({
      success: false,
      message: `Cannot delete academic year with ${termsCount} associated terms`
    })
  }

  await academicYear.deleteOne()

  res.json({
    success: true,
    message: 'Academic year deleted successfully'
  })
}))

export default router
