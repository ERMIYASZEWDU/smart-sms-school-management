import express from 'express'
import { verifyToken, isAdmin } from '../middleware/auth.js'
import { asyncHandler } from '../middleware/errorHandler.js'
import Term from '../models/Term.js'
import AcademicYear from '../models/AcademicYear.js'
import { logAudit } from '../middleware/auditLogger.js'

const router = express.Router()

// All routes require authentication and admin privileges
router.use(verifyToken)
router.use(isAdmin)

// GET all terms
router.get('/', asyncHandler(async (req, res) => {
  const { academicYearId } = req.query

  const filter = academicYearId ? { academicYearId } : {}

  const terms = await Term.find(filter)
    .populate('academicYearId', 'name')
    .populate('createdBy', 'name email')
    .sort({ academicYearId: -1, termNumber: 1 })

  res.json({
    success: true,
    count: terms.length,
    data: terms
  })
}))

// GET active term
router.get('/active', asyncHandler(async (req, res) => {
  const activeTerm = await Term.findOne({ isActive: true })
    .populate('academicYearId', 'name')
    .populate('createdBy', 'name email')

  if (!activeTerm) {
    return res.status(404).json({
      success: false,
      message: 'No active term found'
    })
  }

  res.json({
    success: true,
    data: activeTerm
  })
}))

// GET single term
router.get('/:id', asyncHandler(async (req, res) => {
  const term = await Term.findById(req.params.id)
    .populate('academicYearId', 'name')
    .populate('createdBy', 'name email')

  if (!term) {
    return res.status(404).json({
      success: false,
      message: 'Term not found'
    })
  }

  res.json({
    success: true,
    data: term
  })
}))

// CREATE new term
router.post('/', asyncHandler(async (req, res) => {
  const { name, academicYearId, startDate, endDate, termNumber, description, isActive } = req.body

  // Verify academic year exists
  const academicYear = await AcademicYear.findById(academicYearId)
  if (!academicYear) {
    return res.status(404).json({
      success: false,
      message: 'Academic year not found'
    })
  }

  // Validate dates
  if (new Date(startDate) >= new Date(endDate)) {
    return res.status(400).json({
      success: false,
      message: 'End date must be after start date'
    })
  }

  // Validate dates are within academic year
  if (new Date(startDate) < new Date(academicYear.startDate) ||
      new Date(endDate) > new Date(academicYear.endDate)) {
    return res.status(400).json({
      success: false,
      message: 'Term dates must be within academic year dates'
    })
  }

  // If setting as active, deactivate all other terms for this academic year
  if (isActive) {
    await Term.updateMany({ academicYearId }, { isActive: false })
  }

  const term = new Term({
    name,
    academicYearId,
    startDate,
    endDate,
    termNumber,
    description,
    isActive: isActive || false,
    createdBy: req.user.id
  })

  await term.save()

  // Audit log
  logAudit({
    userId: req.user.id,
    userEmail: req.user.email,
    userRole: req.user.role,
    action: 'term_created',
    resource: 'term',
    resourceId: term._id.toString(),
    details: { description: `Created term: ${name} for ${academicYear.name}` },
    ipAddress: req.ip || req.connection.remoteAddress,
    userAgent: req.get('user-agent'),
    success: true
  })

  await term.populate('academicYearId', 'name')

  res.status(201).json({
    success: true,
    message: 'Term created successfully',
    data: term
  })
}))

// UPDATE term
router.put('/:id', asyncHandler(async (req, res) => {
  const { name, startDate, endDate, termNumber, description, isActive } = req.body

  let term = await Term.findById(req.params.id)

  if (!term) {
    return res.status(404).json({
      success: false,
      message: 'Term not found'
    })
  }

  const academicYear = await AcademicYear.findById(term.academicYearId)

  // Validate dates if provided
  const newStartDate = startDate || term.startDate
  const newEndDate = endDate || term.endDate
  if (new Date(newStartDate) >= new Date(newEndDate)) {
    return res.status(400).json({
      success: false,
      message: 'End date must be after start date'
    })
  }

  // Validate dates are within academic year
  if (new Date(newStartDate) < new Date(academicYear.startDate) ||
      new Date(newEndDate) > new Date(academicYear.endDate)) {
    return res.status(400).json({
      success: false,
      message: 'Term dates must be within academic year dates'
    })
  }

  // If setting as active, deactivate all other terms for this academic year
  if (isActive && !term.isActive) {
    await Term.updateMany({ academicYearId: term.academicYearId }, { isActive: false })
  }

  term.name = name || term.name
  term.startDate = startDate || term.startDate
  term.endDate = endDate || term.endDate
  term.termNumber = termNumber || term.termNumber
  term.description = description !== undefined ? description : term.description
  term.isActive = isActive !== undefined ? isActive : term.isActive
  term.updatedAt = Date.now()

  await term.save()
  await term.populate('academicYearId', 'name')

  res.json({
    success: true,
    message: 'Term updated successfully',
    data: term
  })
}))

// ACTIVATE/DEACTIVATE term
router.patch('/:id/toggle-active', asyncHandler(async (req, res) => {
  const term = await Term.findById(req.params.id)

  if (!term) {
    return res.status(404).json({
      success: false,
      message: 'Term not found'
    })
  }

  // If activating, deactivate all other terms for this academic year
  if (!term.isActive) {
    await Term.updateMany({ academicYearId: term.academicYearId }, { isActive: false })
    term.isActive = true
  } else {
    term.isActive = false
  }

  await term.save()
  await term.populate('academicYearId', 'name')

  res.json({
    success: true,
    message: `Term ${term.isActive ? 'activated' : 'deactivated'} successfully`,
    data: term
  })
}))

// DELETE term
router.delete('/:id', asyncHandler(async (req, res) => {
  const term = await Term.findById(req.params.id)

  if (!term) {
    return res.status(404).json({
      success: false,
      message: 'Term not found'
    })
  }

  // Check if it's the active term
  if (term.isActive) {
    return res.status(400).json({
      success: false,
      message: 'Cannot delete active term. Please deactivate it first.'
    })
  }

  await term.deleteOne()

  res.json({
    success: true,
    message: 'Term deleted successfully'
  })
}))

export default router
