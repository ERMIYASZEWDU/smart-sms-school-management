import express from 'express'
import multer from 'multer'
import User from '../models/User.js'
import Student from '../models/Student.js'
import Teacher from '../models/Teacher.js'
import Parent from '../models/Parent.js'
import { verifyToken } from '../middleware/auth.js'
import { asyncHandler } from '../middleware/errorHandler.js'

const router = express.Router()

// Configure multer for profile photo uploads.
// Photos are stored in MongoDB as base64 data URLs so they survive
// redeploys (Render's filesystem is ephemeral) and are served directly
// from the API — no static file storage or /uploads mount required.
const fileFilter = (req, file, cb) => {
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true)
  } else {
    cb(new Error('Invalid file type. Only JPG, JPEG, PNG, and WEBP are allowed.'), false)
  }
}

const upload = multer({
  storage: multer.memoryStorage(),
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  }
})

// Get current user's profile
router.get('/', verifyToken, asyncHandler(async (req, res) => {
  const userId = req.user.id
  
  // Get user basic info
  const user = await User.findById(userId).select('-password -otpHash -resetToken').lean()
  
  if (!user) {
    return res.status(404).json({ message: 'User not found' })
  }
  
  // Get role-specific profile data
  let roleProfile = null
  
  switch (user.role) {
    case 'student':
      roleProfile = await Student.findOne({ userId })
        .populate('classId', 'name grade section stream')
        .lean()
      break
    case 'teacher':
      roleProfile = await Teacher.findOne({ userId })
        .populate('assignedClassIds', 'name grade section')
        .populate('assignedSubjectIds', 'name')
        .lean()
      break
    case 'parent':
      roleProfile = await Parent.findOne({ userId })
        .populate('studentIds', 'name grade section')
        .lean()
      break
  }
  
  res.json({
    ...user,
    roleProfile
  })
}))

// Update current user's profile
router.put('/', verifyToken, asyncHandler(async (req, res) => {
  const userId = req.user.id
  const { name, phone } = req.body
  
  // Only allow updating certain fields
  const updateData = {}
  if (name !== undefined) updateData.name = name
  if (phone !== undefined) {
    updateData.phone = phone
    // Normalize phone for consistency
    if (phone) {
      updateData.phoneNormalized = phone.replace(/[^\d+]/g, '')
    }
  }
  updateData.updatedAt = Date.now()
  
  const user = await User.findByIdAndUpdate(
    userId,
    updateData,
    { new: true }
  ).select('-password -otpHash -resetToken')
  
  if (!user) {
    return res.status(404).json({ message: 'User not found' })
  }
  
  res.json(user)
}))

// Upload/Update profile photo
router.post('/photo', verifyToken, upload.single('photo'), asyncHandler(async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: 'No file uploaded' })
  }
  
  const userId = req.user.id
  
  const user = await User.findById(userId)
  if (!user) {
    return res.status(404).json({ message: 'User not found' })
  }
  
  // Store the photo inline as a base64 data URL — works on any host and
  // survives redeploys (no reliance on the server's filesystem)
  const photoUrl = `data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}`
  
  user.profilePhoto = photoUrl
  user.updatedAt = Date.now()
  await user.save()
  
  res.json({
    message: 'Profile photo uploaded successfully',
    profilePhoto: photoUrl
  })
}))

// Delete profile photo
router.delete('/photo', verifyToken, asyncHandler(async (req, res) => {
  const userId = req.user.id
  
  const user = await User.findById(userId)
  if (!user) {
    return res.status(404).json({ message: 'User not found' })
  }
  
  if (user.profilePhoto) {
    user.profilePhoto = null
    user.updatedAt = Date.now()
    await user.save()
  }
  
  res.json({ message: 'Profile photo removed successfully' })
}))

// Change password
router.put('/password', verifyToken, asyncHandler(async (req, res) => {
  const userId = req.user.id
  const { currentPassword, newPassword } = req.body
  
  // Validate input
  if (!currentPassword || !newPassword) {
    return res.status(400).json({ message: 'Current password and new password are required' })
  }
  
  if (newPassword.length < 6) {
    return res.status(400).json({ message: 'New password must be at least 6 characters' })
  }
  
  // Get user with password
  const user = await User.findById(userId)
  if (!user) {
    return res.status(404).json({ message: 'User not found' })
  }
  
  // Verify current password
  const isMatch = await user.comparePassword(currentPassword)
  if (!isMatch) {
    return res.status(400).json({ message: 'Current password is incorrect' })
  }
  
  // Update password (will be hashed by pre-save hook)
  user.password = newPassword
  user.updatedAt = Date.now()
  await user.save()
  
  res.json({ message: 'Password changed successfully' })
}))

export default router
