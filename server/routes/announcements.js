import express from 'express'
import { verifyToken } from '../middleware/auth.js'
import Announcement from '../models/Announcement.js'
import Student from '../models/Student.js'
import Parent from '../models/Parent.js'
import Teacher from '../models/Teacher.js'
import { createAnnouncementNotifications } from '../services/notificationService.js'

const router = express.Router()

// Apply authentication to all routes
router.use(verifyToken)

/**
 * POST /api/announcements
 * Create a new announcement (Admin only)
 */
router.post('/', async (req, res) => {
  try {
    // Verify admin role
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Only administrators can create announcements' })
    }

    const {
      title,
      message,
      content,
      targetRole = ['all'],
      targetGrade = null,
      targetSection = null,
      targetStream = null,
      priority = 'medium',
      publishDate = new Date(),
      expiryDate = null,
      attachments = []
    } = req.body

    // Validate required fields
    if (!title || !message || !content) {
      return res.status(400).json({ error: 'Title, message, and content are required' })
    }

    // Create announcement
    const announcement = await Announcement.create({
      title,
      message,
      content,
      createdBy: req.user.id,
      targetRole,
      targetGrade,
      targetSection,
      targetStream,
      priority,
      isPublished: true,
      publishDate,
      expiryDate,
      attachments
    })

    // Create notifications for targeted users
    const recipientCount = await createAnnouncementNotifications({
      announcementId: announcement._id,
      title,
      message,
      targetRole,
      targetGrade,
      targetSection,
      targetStream,
      priority,
      createdBy: req.user.id
    })

    // Update recipient count
    announcement.recipientCount = recipientCount
    await announcement.save()

    console.log(`✅ Created announcement: ${title} (${recipientCount} recipients)`)

    res.status(201).json({
      message: 'Announcement created successfully',
      announcement,
      recipientCount
    })
  } catch (error) {
    console.error('❌ Error creating announcement:', error)
    res.status(500).json({ error: 'Failed to create announcement' })
  }
})

/**
 * GET /api/announcements
 * Get announcements for authenticated user (filtered by role and targeting)
 */
router.get('/', async (req, res) => {
  try {
    const userId = req.user.id
    const userRole = req.user.role
    const { page = 1, limit = 20 } = req.query

    // Base query: published announcements that haven't expired
    const query = {
      isPublished: true,
      $or: [
        { expiryDate: null },
        { expiryDate: { $gte: new Date() } }
      ],
      publishDate: { $lte: new Date() }
    }

    // Filter by role
    query.$and = [
      {
        $or: [
          { targetRole: 'all' },
          { targetRole: { $in: [userRole] } }
        ]
      }
    ]

    // Additional filtering based on user role
    if (userRole === 'student') {
      const student = await Student.findOne({ userId }).lean()
      if (student) {
        // Student should see announcements targeted to:
        // - All students
        // - Their specific grade
        // - Their specific section
        // - Their specific stream (if Grade 11-12)
        query.$and.push({
          $or: [
            { targetGrade: null },
            { targetGrade: student.grade }
          ]
        })
        query.$and.push({
          $or: [
            { targetSection: null },
            { targetSection: student.section }
          ]
        })
        
        if (student.stream) {
          query.$and.push({
            $or: [
              { targetStream: null },
              { targetStream: student.stream }
            ]
          })
        }
      }
    } else if (userRole === 'teacher') {
      const teacher = await Teacher.findOne({ userId }).populate('assignedClassIds')
      if (teacher && teacher.assignedClassIds && teacher.assignedClassIds.length > 0) {
        // Teacher should see announcements targeted to:
        // - All teachers
        // - Grades they teach
        const teacherGrades = [...new Set(teacher.assignedClassIds.map(cls => cls.grade))]
        query.$and.push({
          $or: [
            { targetGrade: null },
            { targetGrade: { $in: teacherGrades } }
          ]
        })
      }
    } else if (userRole === 'parent') {
      const parent = await Parent.findOne({ userId }).populate('studentIds')
      if (parent && parent.studentIds && parent.studentIds.length > 0) {
        // Parent should see announcements targeted to:
        // - All parents
        // - Grades/sections/streams of their children
        const childrenGrades = [...new Set(parent.studentIds.map(child => child.grade))]
        const childrenSections = [...new Set(parent.studentIds.map(child => child.section))]
        const childrenStreams = [...new Set(parent.studentIds.map(child => child.stream).filter(Boolean))]

        query.$and.push({
          $or: [
            { targetGrade: null },
            { targetGrade: { $in: childrenGrades } }
          ]
        })
        query.$and.push({
          $or: [
            { targetSection: null },
            { targetSection: { $in: childrenSections } }
          ]
        })
        
        if (childrenStreams.length > 0) {
          query.$and.push({
            $or: [
              { targetStream: null },
              { targetStream: { $in: childrenStreams } }
            ]
          })
        }
      }
    }

    const skip = (parseInt(page) - 1) * parseInt(limit)

    const [announcements, total] = await Promise.all([
      Announcement.find(query)
        .sort({ publishDate: -1, createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .populate('createdBy', 'name email')
        .lean(),
      Announcement.countDocuments(query)
    ])

    res.json({
      announcements,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    })
  } catch (error) {
    console.error('❌ Error fetching announcements:', error)
    res.status(500).json({ error: 'Failed to fetch announcements' })
  }
})

/**
 * GET /api/announcements/:id
 * Get a specific announcement
 */
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params

    const announcement = await Announcement.findById(id)
      .populate('createdBy', 'name email')

    if (!announcement) {
      return res.status(404).json({ error: 'Announcement not found' })
    }

    // Increment view count
    announcement.viewCount += 1
    await announcement.save()

    res.json({ announcement })
  } catch (error) {
    console.error('❌ Error fetching announcement:', error)
    res.status(500).json({ error: 'Failed to fetch announcement' })
  }
})

/**
 * PUT /api/announcements/:id
 * Update an announcement (Admin only)
 */
router.put('/:id', async (req, res) => {
  try {
    // Verify admin role
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Only administrators can update announcements' })
    }

    const { id } = req.params
    const updates = req.body

    // Prevent changing createdBy
    delete updates.createdBy

    updates.updatedAt = new Date()

    const announcement = await Announcement.findByIdAndUpdate(
      id,
      updates,
      { new: true, runValidators: true }
    )

    if (!announcement) {
      return res.status(404).json({ error: 'Announcement not found' })
    }

    res.json({
      message: 'Announcement updated successfully',
      announcement
    })
  } catch (error) {
    console.error('❌ Error updating announcement:', error)
    res.status(500).json({ error: 'Failed to update announcement' })
  }
})

/**
 * DELETE /api/announcements/:id
 * Delete an announcement (Admin only)
 */
router.delete('/:id', async (req, res) => {
  try {
    // Verify admin role
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Only administrators can delete announcements' })
    }

    const { id } = req.params

    const announcement = await Announcement.findByIdAndDelete(id)

    if (!announcement) {
      return res.status(404).json({ error: 'Announcement not found' })
    }

    res.json({ message: 'Announcement deleted successfully' })
  } catch (error) {
    console.error('❌ Error deleting announcement:', error)
    res.status(500).json({ error: 'Failed to delete announcement' })
  }
})

/**
 * GET /api/announcements/admin/all
 * Get all announcements (Admin only) - for management purposes
 */
router.get('/admin/all', async (req, res) => {
  try {
    // Verify admin role
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Only administrators can access this endpoint' })
    }

    const { page = 1, limit = 20 } = req.query
    const skip = (parseInt(page) - 1) * parseInt(limit)

    const [announcements, total] = await Promise.all([
      Announcement.find()
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .populate('createdBy', 'name email')
        .lean(),
      Announcement.countDocuments()
    ])

    res.json({
      announcements,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    })
  } catch (error) {
    console.error('❌ Error fetching all announcements:', error)
    res.status(500).json({ error: 'Failed to fetch announcements' })
  }
})

export default router
