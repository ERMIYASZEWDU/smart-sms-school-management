import jwt from 'jsonwebtoken'
import Teacher from '../models/Teacher.js'
import Parent from '../models/Parent.js'
import Student from '../models/Student.js'
import Class from '../models/Class.js'

export const verifyToken = (req, res, next) => {
  const authHeader = req.headers.authorization
  const token = authHeader?.split(' ')[1]

  if (!token) {
    console.warn('❌ No token provided')
    return res.status(401).json({ message: 'No token provided', requiresAuth: true })
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret')
    req.user = decoded
    console.log('✅ Token verified for user:', { id: decoded.id, role: decoded.role })
    next()
  } catch (err) {
    console.warn('❌ Invalid token:', err.message)
    return res.status(401).json({ message: 'Invalid or expired token', requiresAuth: true })
  }
}

export const checkRole = (allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      console.error('❌ checkRole: No user found in request')
      return res.status(401).json({ message: 'Unauthorized' })
    }

    if (!allowedRoles.includes(req.user.role)) {
      console.warn(`❌ Access denied: User role '${req.user.role}' not in allowed roles [${allowedRoles.join(', ')}]`)
      return res.status(403).json({ 
        message: 'Access denied', 
        requiredRoles: allowedRoles,
        userRole: req.user.role 
      })
    }

    console.log(`✅ Role check passed: ${req.user.role} accessing ${req.path}`)
    next()
  }
}

// Helper middleware for specific roles
export const isAdmin = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    return next()
  }
  return res.status(403).json({ message: 'Admin access required' })
}

export const isTeacher = (req, res, next) => {
  if (req.user && req.user.role === 'teacher') {
    return next()
  }
  return res.status(403).json({ message: 'Teacher access required' })
}

export const isStudent = (req, res, next) => {
  if (req.user && req.user.role === 'student') {
    return next()
  }
  return res.status(403).json({ message: 'Student access required' })
}

export const isParent = (req, res, next) => {
  if (req.user && req.user.role === 'parent') {
    return next()
  }
  return res.status(403).json({ message: 'Parent access required' })
}

// Verify teacher has access to specific student
export const verifyTeacherStudentAccess = async (req, res, next) => {
  try {
    const teacherId = req.user.id
    const studentId = req.params.studentId || req.body.studentId

    if (!studentId) {
      return res.status(400).json({ message: 'Student ID required' })
    }

    // Get student
    const student = await Student.findById(studentId).lean()
    if (!student) {
      return res.status(404).json({ message: 'Student not found' })
    }

    // Check if teacher has access to this student's class
    const teacherProfile = await Teacher.findOne({ userId: teacherId }).lean()
    
    if (teacherProfile && teacherProfile.assignedClassIds.length > 0) {
      // Check if student's classId is in teacher's assigned classes
      const hasAccess = teacherProfile.assignedClassIds.some(
        classId => classId.toString() === student.classId?.toString()
      )
      
      if (hasAccess) {
        req.student = student
        return next()
      }
    }

    // Fallback: Check if teacher is class teacher
    const teacherClasses = await Class.find({ 
      teacherId, 
      isActive: true 
    }).lean()

    const hasAccessViaClass = teacherClasses.some(cls => 
      cls._id.toString() === student.classId?.toString() ||
      (cls.grade === student.grade && cls.section === student.section)
    )

    if (hasAccessViaClass) {
      req.student = student
      return next()
    }

    return res.status(403).json({ 
      message: 'Access denied to this student',
      reason: 'Student not in your assigned classes'
    })
  } catch (err) {
    console.error('Error verifying teacher-student access:', err)
    return res.status(500).json({ message: 'Error verifying access', error: err.message })
  }
}

// Verify parent has access to specific student
export const verifyParentChildAccess = async (req, res, next) => {
  try {
    const parentUserId = req.user.id
    const studentId = req.params.studentId || req.body.studentId

    if (!studentId) {
      return res.status(400).json({ message: 'Student ID required' })
    }

    const parent = await Parent.findOne({ userId: parentUserId }).lean()
    if (!parent) {
      return res.status(404).json({ message: 'Parent profile not found' })
    }

    const hasAccess = parent.studentIds.some(
      id => id.toString() === studentId.toString()
    )

    if (!hasAccess) {
      return res.status(403).json({ 
        message: 'Access denied to this student',
        reason: 'Student is not your child'
      })
    }

    next()
  } catch (err) {
    console.error('Error verifying parent-child access:', err)
    return res.status(500).json({ message: 'Error verifying access', error: err.message })
  }
}
