import express from 'express'
import { verifyToken, checkRole } from '../middleware/auth.js'
import { asyncHandler } from '../middleware/errorHandler.js'
import { 
  validateStudent, 
  validateUpdateStudent, 
  validateTeacher,
  validateParent,
  validateClass,
  validateSubject,
  validateAnnouncement,
  validateObjectId,
  validatePagination,
  validateDateRange
} from '../middleware/validator.js'
import User from '../models/User.js'
import Student from '../models/Student.js'
import Parent from '../models/Parent.js'
import Grade from '../models/Grade.js'
import Attendance from '../models/Attendance.js'
import Enrollment from '../models/Enrollment.js'
import AcademicYear from '../models/AcademicYear.js'
import { notifyStudentEnrollment, notifyTeacherClassAssignment } from '../services/notificationService.js'
import Assignment from '../models/Assignment.js'
import Class from '../models/Class.js'
import Subject from '../models/Subject.js'
import Announcement from '../models/Announcement.js'
import Teacher from '../models/Teacher.js'

const router = express.Router()

router.get('/dashboard', verifyToken, checkRole(['admin']), asyncHandler(async (req, res) => {
  const totalStudents = await Student.countDocuments({ status: 'active' })
  const totalTeachers = await User.countDocuments({ role: 'teacher' })
  const totalParents = await Parent.countDocuments()
  const totalClasses = await Class.countDocuments({ isActive: true })

  // Calculate attendance rate
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const todayAttendance = await Attendance.find({
    date: { $gte: today }
  }).lean()

  const presentCount = todayAttendance.filter(a => a.status === 'present' || a.status === 'late').length
  const totalCount = todayAttendance.length
  const avgAttendance = totalCount > 0 ? ((presentCount / totalCount) * 100).toFixed(1) : 0

  res.json({
    totalStudents,
    totalTeachers,
    totalParents,
    totalClasses,
    avgAttendance: parseFloat(avgAttendance),
    message: 'Admin dashboard loaded successfully'
  })
}))

// ========== STUDENT CRUD ==========

router.get('/students', verifyToken, checkRole(['admin']), validatePagination, asyncHandler(async (req, res) => {
  const { search, grade, status, page = 1, limit = 50 } = req.query
  let query = {}

  if (search) {
    query.$or = [
      { name: { $regex: search, $options: 'i' } },
      { enrollmentNumber: { $regex: search, $options: 'i' } }
    ]
  }

  if (grade) {
    query.grade = grade
  }

  if (status) {
    query.status = status
  }

  const skip = (page - 1) * limit

  const [students, total] = await Promise.all([
    Student.find(query)
      .populate('userId', 'email')
      .populate('classId')
      .populate('parentIds')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .lean(),
    Student.countDocuments(query)
  ])

  res.json({
    students,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      pages: Math.ceil(total / limit)
    }
  })
}))

router.post('/student', verifyToken, checkRole(['admin']), validateStudent, asyncHandler(async (req, res) => {
  const {
    email,
    password,
    name,
    enrollmentNumber,
    grade,
    section,
    stream: rawStream, // For Grade 11-12
    rollNumber,
    dateOfBirth,
    guardianName,
    guardianPhone,
    address,
    photo,
    classId,
    parentIds,
    academicYearId // NEW: Required for enrollment
  } = req.body

  // Normalize stream values (the UI sends 'natural'/'social', the model uses full enum values)
  const stream = rawStream === 'natural' ? 'Natural Science' : rawStream === 'social' ? 'Social Science' : rawStream

  // --- Validate required fields up front ---
  if (!email || !password || !name || !enrollmentNumber || !grade || !section) {
    return res.status(400).json({ message: 'Name, email, password, enrollment number, grade, and section are required.' })
  }
  if (!rollNumber) {
    return res.status(400).json({ message: 'Roll number is required.' })
  }
  if (!dateOfBirth) {
    return res.status(400).json({ message: 'Date of birth is required.' })
  }
  if (!guardianName || !guardianPhone || !address) {
    return res.status(400).json({ message: 'Guardian name, guardian phone, and address are required.' })
  }
  
  // Validate stream for Grade 11-12
  const gradeNumber = parseInt(grade.replace('Grade ', ''))
  if (gradeNumber >= 11 && gradeNumber <= 12 && !stream) {
    return res.status(400).json({ message: 'Stream (Natural Science/Social Science) is required for Grade 11 and 12.' })
  }

  // --- Check for duplicate email before attempting to save ---
  const existingUser = await User.findOne({ email })
  if (existingUser) {
    return res.status(400).json({ message: `Email "${email}" is already registered. Please use a different email.` })
  }

  // --- Check for duplicate enrollment number ---
  const existingStudent = await Student.findOne({ enrollmentNumber })
  if (existingStudent) {
    return res.status(400).json({ message: `Enrollment number "${enrollmentNumber}" already exists.` })
  }

  // Get active academic year if not provided
  let finalAcademicYearId = academicYearId
  if (!finalAcademicYearId) {
    const activeYear = await AcademicYear.findOne({ isActive: true })
    if (!activeYear) {
      return res.status(400).json({ message: 'No active academic year found. Please create or activate an academic year first.' })
    }
    finalAcademicYearId = activeYear._id
  }

  // Validate academic year exists
  const academicYear = await AcademicYear.findById(finalAcademicYearId)
  if (!academicYear) {
    return res.status(404).json({ message: 'Academic year not found.' })
  }

  // Create user account
  const user = new User({
    email,
    password,
    name,
    role: 'student'
  })
  await user.save()

  // Find matching class by grade, section, stream, and academic year
  let finalClassId = classId
  if (!finalClassId && grade && section) {
    const matchQuery = { 
      grade, 
      section, 
      academicYearId: finalAcademicYearId,
      isActive: true 
    }
    
    // For Grade 11/12, also match stream
    if (gradeNumber >= 11 && gradeNumber <= 12 && stream) {
      matchQuery.stream = stream
    }
    
    const matchingClass = await Class.findOne(matchQuery)
      .sort({ createdAt: -1 })
      .lean()
    
    if (matchingClass) {
      finalClassId = matchingClass._id
      const streamText = matchingClass.stream ? ` ${matchingClass.stream}` : ''
      console.log(`✅ Auto-linked student to class: ${matchingClass.name}${streamText} (${matchingClass._id})`)
    } else {
      const streamText = stream ? ` ${stream}` : ''
      console.warn(`⚠️ No active class found for ${grade}${streamText}-${section} in academic year ${academicYear.name}`)
    }
  }

  // Validate class belongs to academic year if provided
  if (finalClassId) {
    const classData = await Class.findById(finalClassId)
    if (!classData) {
      return res.status(404).json({ message: 'Class not found.' })
    }
    if (classData.academicYearId.toString() !== finalAcademicYearId.toString()) {
      return res.status(400).json({ message: 'Class does not belong to the specified academic year.' })
    }
  }

  // Create student profile
  const student = new Student({
    userId: user._id,
    name,
    enrollmentNumber,
    grade,
    section,
    stream: (gradeNumber >= 11 && gradeNumber <= 12) ? stream : null,
    rollNumber: Number(rollNumber),
    dateOfBirth: new Date(dateOfBirth),
    guardianName,
    guardianPhone,
    address,
    photo: photo || null,
    classId: finalClassId || null,
    parentIds: parentIds || [],
    status: 'active'
  })
  try {
    await student.save()
  } catch (err) {
    // Roll back the user account so a failed student save doesn't leave an orphan login
    await User.findByIdAndDelete(user._id).catch(() => {})
    return res.status(400).json({ success: false, message: err.message })
  }
  
  console.log(`📝 Student created: ${student.name} (${student._id})`, {
    grade: student.grade,
    section: student.section,
    stream: student.stream,
    classId: student.classId
  })

  // Create enrollment record if class is assigned
  let enrollment = null
  if (finalClassId) {
    try {
      enrollment = new Enrollment({
        studentId: student._id,
        classId: finalClassId,
        academicYearId: finalAcademicYearId,
        grade,
        section,
        stream: (gradeNumber >= 11 && gradeNumber <= 12) ? stream : null,
        rollNumber: Number(rollNumber),
        status: 'active',
        enrolledBy: req.user.id
      })
      await enrollment.save()

      // Update student's current enrollment reference
      student.currentEnrollmentId = enrollment._id
      await student.save()

      console.log(`✅ Enrollment created for ${student.name} in ${academicYear.name}`)
    } catch (enrollError) {
      console.error('⚠️ Failed to create enrollment:', enrollError.message)
      // Continue even if enrollment creation fails (backward compatibility)
    }
  }

  // Update parent's children array if parentIds provided
  if (parentIds && parentIds.length > 0) {
    await Parent.updateMany(
      { _id: { $in: parentIds } },
      { $addToSet: { studentIds: student._id } }
    )
  }

  const populatedStudent = await Student.findById(student._id)
    .populate('userId', 'email')
    .populate('classId')
    .populate('parentIds')
    .populate('currentEnrollmentId')
    .lean()

  // Send welcome notification to student and parents
  try {
    await notifyStudentEnrollment(
      student._id,
      grade,
      section,
      stream,
      academicYear.name
    )
  } catch (notifError) {
    console.error('⚠️ Failed to send enrollment notification:', notifError.message)
    // Don't fail the request if notification fails
  }

  res.status(201).json({
    ...populatedStudent,
    enrollment: enrollment ? {
      id: enrollment._id,
      academicYear: academicYear.name,
      status: enrollment.status
    } : null
  })
}))

router.put('/student/:id', verifyToken, checkRole(['admin']), async (req, res) => {
  try {
    const {
      name,
      grade,
      section,
      stream,
      rollNumber,
      dateOfBirth,
      guardianName,
      guardianPhone,
      address,
      photo,
      classId,
      parentIds,
      status
    } = req.body

    const oldStudent = await Student.findById(req.params.id).lean()
    if (!oldStudent) {
      return res.status(404).json({ message: 'Student not found' })
    }

    const gradeNumber = grade ? parseInt(grade.replace('Grade ', '')) : null

    // Get active academic year
    const activeYear = await AcademicYear.findOne({ isActive: true })
    if (!activeYear) {
      return res.status(400).json({ message: 'No active academic year found.' })
    }
    
    // Find matching class by grade, section, stream, and academic year if classId not provided
    let finalClassId = classId
    if (!finalClassId && grade && section) {
      const matchQuery = { 
        grade, 
        section,
        academicYearId: activeYear._id,
        isActive: true 
      }
      
      // For Grade 11/12, also match stream
      if (gradeNumber >= 11 && gradeNumber <= 12 && stream) {
        matchQuery.stream = stream
      }
      
      const matchingClass = await Class.findOne(matchQuery)
        .sort({ createdAt: -1 })
        .lean()
      
      if (matchingClass) {
        finalClassId = matchingClass._id
        const streamText = matchingClass.stream ? ` ${matchingClass.stream}` : ''
        console.log(`✅ Auto-linked student to class: ${matchingClass.name}${streamText} (${matchingClass._id})`)
      } else {
        const streamText = stream ? ` ${stream}` : ''
        console.warn(`⚠️ No active class found for ${grade}${streamText}-${section} in ${activeYear.name}`)
      }
    }
    
    // Detect if class changed (transfer scenario)
    const classChanged = finalClassId && oldStudent.classId && 
                        finalClassId.toString() !== oldStudent.classId.toString()

    // Update student document
    const student = await Student.findByIdAndUpdate(
      req.params.id,
      {
        name,
        grade,
        section,
        stream: (gradeNumber >= 11 && gradeNumber <= 12) ? stream : null,
        rollNumber,
        dateOfBirth,
        guardianPhone,
        guardianName,
        address,
        photo: photo !== undefined ? photo : oldStudent.photo,
        classId: finalClassId,
        parentIds,
        status,
        updatedAt: Date.now()
      },
      { new: true }
    )
      .populate('userId', 'email')
      .populate('classId')
      .populate('parentIds')
      .populate('currentEnrollmentId')

    console.log(`📝 Student updated: ${student.name} (${student._id})`, {
      grade: student.grade,
      section: student.section,
      stream: student.stream,
      classId: student.classId,
      classChanged
    })

    // Handle enrollment update if class changed
    if (classChanged && finalClassId) {
      try {
        // Get current enrollment
        const currentEnrollment = await Enrollment.findOne({
          studentId: student._id,
          status: 'active'
        }).sort({ createdAt: -1 })

        if (currentEnrollment) {
          // This is a transfer - mark old enrollment as transferred
          await currentEnrollment.updateStatus('transferred', 'Transferred via admin update', req.user.id)

          // Create new enrollment
          const newEnrollment = new Enrollment({
            studentId: student._id,
            classId: finalClassId,
            academicYearId: activeYear._id,
            grade,
            section,
            stream: (gradeNumber >= 11 && gradeNumber <= 12) ? stream : null,
            rollNumber: Number(rollNumber),
            status: 'active',
            enrolledBy: req.user.id,
            transferredFrom: currentEnrollment._id
          })
          await newEnrollment.save()

          // Link enrollments
          currentEnrollment.transferredTo = newEnrollment._id
          await currentEnrollment.save()

          // Update student's current enrollment
          student.currentEnrollmentId = newEnrollment._id
          await student.save()

          console.log(`✅ Transfer enrollment created for ${student.name}`)
        } else if (!currentEnrollment && finalClassId) {
          // No current enrollment - create one (enrollment was missing)
          const newEnrollment = new Enrollment({
            studentId: student._id,
            classId: finalClassId,
            academicYearId: activeYear._id,
            grade,
            section,
            stream: (gradeNumber >= 11 && gradeNumber <= 12) ? stream : null,
            rollNumber: Number(rollNumber),
            status: 'active',
            enrolledBy: req.user.id
          })
          await newEnrollment.save()

          student.currentEnrollmentId = newEnrollment._id
          await student.save()

          console.log(`✅ Enrollment created for ${student.name} (was missing)`)
        }
      } catch (enrollError) {
        console.error('⚠️ Failed to update enrollment:', enrollError.message)
        // Continue even if enrollment update fails
      }
    }

    // Update parent relationships
    if (parentIds) {
      // Remove from old parents
      if (oldStudent.parentIds && oldStudent.parentIds.length > 0) {
        await Parent.updateMany(
          { _id: { $in: oldStudent.parentIds } },
          { $pull: { studentIds: student._id } }
        )
      }
      
      // Add to new parents
      await Parent.updateMany(
        { _id: { $in: parentIds } },
        { $addToSet: { studentIds: student._id } }
      )
    }

    res.json(student)
  } catch (err) {
    console.error('Error updating student:', err)
    res.status(500).json({ message: 'Error updating student', error: err.message })
  }
})

router.delete('/student/:id', verifyToken, checkRole(['admin']), async (req, res) => {
  try {
    const student = await Student.findById(req.params.id).lean()
    
    if (!student) {
      return res.status(404).json({ message: 'Student not found' })
    }

    // Remove from parents
    if (student.parentIds && student.parentIds.length > 0) {
      await Parent.updateMany(
        { _id: { $in: student.parentIds } },
        { $pull: { studentIds: student._id } }
      )
    }

    // Delete related records
    await Grade.deleteMany({ studentId: student._id })
    await Attendance.deleteMany({ studentId: student._id })

    // Delete student and user
    await Student.findByIdAndDelete(req.params.id)
    await User.findByIdAndDelete(student.userId)

    res.json({ message: 'Student deleted successfully' })
  } catch (err) {
    res.status(500).json({ message: 'Error deleting student', error: err.message })
  }
})

// ========== TEACHER CRUD ==========

router.get('/teachers', verifyToken, checkRole(['admin']), async (req, res) => {
  try {
    const teachers = await User.find({ role: 'teacher' })
      .select('-password')
      .sort({ createdAt: -1 })
      .lean()

    // Enrich with teacher profile data
    const enrichedTeachers = await Promise.all(
      teachers.map(async (teacher) => {
        const profile = await Teacher.findOne({ userId: teacher._id })
          .populate('assignedClassIds', 'name grade section')
          .populate('assignedSubjectIds', 'name code')
          .lean()
        
        return {
          ...teacher,
          profile,
          // Surface fields the teacher form uses (edit round-trip + list display)
          subject: profile?.department || profile?.assignedSubjectIds?.[0]?.name || '',
          assignedClasses: profile?.assignedClassIds || []
        }
      })
    )

    res.json(enrichedTeachers)
  } catch (err) {
    res.status(500).json({ message: 'Error fetching teachers', error: err.message })
  }
})

router.post('/teacher', verifyToken, checkRole(['admin']), async (req, res) => {
  try {
    const { 
      email, 
      password, 
      name, 
      phone, 
      employeeId, 
      department, 
      qualification,
      assignedClassIds,
      assignedSubjectIds,
      subject,          // The form sends a subject NAME, not ObjectIds
      assignedClasses   // The form sends class ids under this key
    } = req.body

    const existingUser = await User.findOne({ email })
    if (existingUser) {
      return res.status(400).json({ message: 'Email already exists' })
    }

    // Check if employeeId already exists
    if (employeeId) {
      const existingTeacher = await Teacher.findOne({ employeeId })
      if (existingTeacher) {
        return res.status(400).json({ message: 'Employee ID already exists' })
      }
    }

    // Resolve the subject name to a Subject document (model stores ObjectIds)
    let resolvedSubjectId = null
    if (subject) {
      const subjectDoc = await Subject.findOne({ name: subject }).lean()
      if (subjectDoc) resolvedSubjectId = subjectDoc._id
    }
    const finalSubjectIds = assignedSubjectIds || (resolvedSubjectId ? [resolvedSubjectId] : [])

    // Create user account
    const teacherUser = new User({
      email,
      password,
      name,
      phone,
      role: 'teacher'
    })
    await teacherUser.save()

    // Create teacher profile
    const teacherProfile = new Teacher({
      userId: teacherUser._id,
      name,
      employeeId: employeeId || `EMP${Date.now()}`,
      phone,
      email,
      department: department || subject || null,
      qualification,
      assignedClassIds: assignedClassIds || assignedClasses || [],
      assignedSubjectIds: finalSubjectIds
    })
    try {
      await teacherProfile.save()
    } catch (err) {
      // Roll back the user account so a failed profile save doesn't leave an orphan login
      await User.findByIdAndDelete(teacherUser._id).catch(() => {})
      return res.status(400).json({ success: false, message: err.message })
    }

    const teacherData = teacherUser.toObject()
    delete teacherData.password
    teacherData.profile = teacherProfile

    res.status(201).json(teacherData)
  } catch (err) {
    console.error('Error creating teacher:', err)
    res.status(500).json({ message: 'Error creating teacher', error: err.message })
  }
})

router.put('/teacher/:id', verifyToken, checkRole(['admin']), async (req, res) => {
  try {
    const { 
      name, 
      phone, 
      email, 
      department, 
      qualification,
      assignedClassIds,
      assignedSubjectIds,
      subject,          // The form sends a subject NAME, not ObjectIds
      assignedClasses,  // The form sends class ids under this key
      status 
    } = req.body

    // Update user account
    const teacher = await User.findOneAndUpdate(
      { _id: req.params.id, role: 'teacher' },
      { name, phone, email, updatedAt: Date.now() },
      { new: true }
    ).select('-password')

    if (!teacher) {
      return res.status(404).json({ message: 'Teacher not found' })
    }

    // Update or create teacher profile
    let teacherProfile = await Teacher.findOne({ userId: req.params.id })
    
    if (teacherProfile) {
      teacherProfile.name = name
      teacherProfile.phone = phone
      teacherProfile.email = email
      teacherProfile.department = department ?? subject ?? teacherProfile.department
      teacherProfile.qualification = qualification
      teacherProfile.status = status || teacherProfile.status
      
      if (assignedClassIds !== undefined) {
        teacherProfile.assignedClassIds = assignedClassIds
      } else if (assignedClasses !== undefined) {
        teacherProfile.assignedClassIds = assignedClasses
      }
      if (assignedSubjectIds !== undefined) {
        teacherProfile.assignedSubjectIds = assignedSubjectIds
      } else if (subject !== undefined) {
        // Resolve subject name to a Subject document
        const subjectDoc = await Subject.findOne({ name: subject }).lean()
        teacherProfile.assignedSubjectIds = subjectDoc ? [subjectDoc._id] : []
      }
      
      teacherProfile.updatedAt = Date.now()
      await teacherProfile.save()
    } else {
      // Create profile if it doesn't exist
      teacherProfile = new Teacher({
        userId: req.params.id,
        name,
        employeeId: `EMP${Date.now()}`,
        phone,
        email,
        department,
        qualification,
        assignedClassIds: assignedClassIds || [],
        assignedSubjectIds: assignedSubjectIds || []
      })
      await teacherProfile.save()
    }

    const populatedProfile = await Teacher.findById(teacherProfile._id)
      .populate('assignedClassIds', 'name grade section')
      .populate('assignedSubjectIds', 'name code')
      .lean()

    res.json({
      ...teacher.toObject(),
      profile: populatedProfile
    })
  } catch (err) {
    res.status(500).json({ message: 'Error updating teacher', error: err.message })
  }
})

router.delete('/teacher/:id', verifyToken, checkRole(['admin']), async (req, res) => {
  try {
    const teacher = await User.findOneAndDelete({ _id: req.params.id, role: 'teacher' })
    
    if (!teacher) {
      return res.status(404).json({ message: 'Teacher not found' })
    }

    // Also delete teacher profile
    await Teacher.findOneAndDelete({ userId: req.params.id })

    res.json({ message: 'Teacher deleted successfully' })
  } catch (err) {
    res.status(500).json({ message: 'Error deleting teacher', error: err.message })
  }
})

// ========== PARENT CRUD ==========

router.get('/parents', verifyToken, checkRole(['admin']), async (req, res) => {
  try {
    const parents = await Parent.find()
      .populate('userId', 'email')
      .populate('studentIds', 'name enrollmentNumber grade section')
      .sort({ createdAt: -1 })
      .lean()

    res.json(parents)
  } catch (err) {
    res.status(500).json({ message: 'Error fetching parents', error: err.message })
  }
})

router.post('/parent', verifyToken, checkRole(['admin']), async (req, res) => {
  try {
    const {
      email,
      password,
      name,
      phone,
      address,
      occupation,
      relationship,
      studentIds
    } = req.body

    const existingUser = await User.findOne({ email })
    if (existingUser) {
      return res.status(400).json({ message: `Email "${email}" is already registered. Please use a different email.` })
    }

    // Create user account
    const user = new User({
      email,
      password,
      name,
      phone,
      role: 'parent'
    })
    await user.save()

    // Create parent profile
    const parent = new Parent({
      userId: user._id,
      name,
      phone,
      email,
      address,
      occupation,
      relationship,
      studentIds: studentIds || []
    })
    try {
      await parent.save()
    } catch (err) {
      // Roll back the user account so a failed profile save doesn't leave an orphan login
      await User.findByIdAndDelete(user._id).catch(() => {})
      return res.status(400).json({ success: false, message: err.message })
    }

    // Update students' parentIds
    if (studentIds && studentIds.length > 0) {
      await Student.updateMany(
        { _id: { $in: studentIds } },
        { $addToSet: { parentIds: parent._id } }
      )
    }

    const populatedParent = await Parent.findById(parent._id)
      .populate('userId', 'email')
      .populate('studentIds', 'name enrollmentNumber grade section')
      .lean()

    res.status(201).json(populatedParent)
  } catch (err) {
    console.error('Error creating parent:', err)
    res.status(500).json({ message: 'Error creating parent', error: err.message })
  }
})

router.put('/parent/:id', verifyToken, checkRole(['admin']), async (req, res) => {
  try {
    const {
      name,
      phone,
      email,
      address,
      occupation,
      relationship,
      studentIds
    } = req.body

    const oldParent = await Parent.findById(req.params.id).lean()

    const parent = await Parent.findByIdAndUpdate(
      req.params.id,
      {
        name,
        phone,
        email,
        address,
        occupation,
        relationship,
        studentIds,
        updatedAt: Date.now()
      },
      { new: true }
    )
      .populate('userId', 'email')
      .populate('studentIds', 'name enrollmentNumber grade section')

    if (!parent) {
      return res.status(404).json({ message: 'Parent not found' })
    }

    // Update student relationships
    if (studentIds) {
      // Remove from old students
      if (oldParent.studentIds && oldParent.studentIds.length > 0) {
        await Student.updateMany(
          { _id: { $in: oldParent.studentIds } },
          { $pull: { parentIds: parent._id } }
        )
      }
      
      // Add to new students
      await Student.updateMany(
        { _id: { $in: studentIds } },
        { $addToSet: { parentIds: parent._id } }
      )
    }

    res.json(parent)
  } catch (err) {
    res.status(500).json({ message: 'Error updating parent', error: err.message })
  }
})

router.delete('/parent/:id', verifyToken, checkRole(['admin']), async (req, res) => {
  try {
    const parent = await Parent.findById(req.params.id).lean()
    
    if (!parent) {
      return res.status(404).json({ message: 'Parent not found' })
    }

    // Remove from students
    if (parent.studentIds && parent.studentIds.length > 0) {
      await Student.updateMany(
        { _id: { $in: parent.studentIds } },
        { $pull: { parentIds: parent._id } }
      )
    }

    // Delete parent and user
    await Parent.findByIdAndDelete(req.params.id)
    await User.findByIdAndDelete(parent.userId)

    res.json({ message: 'Parent deleted successfully' })
  } catch (err) {
    res.status(500).json({ message: 'Error deleting parent', error: err.message })
  }
})

// ========== GRADES/RESULTS ==========

// Grade types admins are allowed to enter (quiz/assignment/classwork are teacher-only)
const ADMIN_GRADE_TYPES = ['midterm', 'final']

router.get('/grades', verifyToken, checkRole(['admin']), async (req, res) => {
  try {
    const { studentId, classId, subject, gradeType } = req.query
    
    let query = {}
    
    if (studentId) {
      query.studentId = studentId
    }
    
    if (subject) {
      query.subject = subject
    }
    
    if (gradeType) {
      query.gradeType = gradeType
    }

    const grades = await Grade.find(query)
      .populate('studentId', 'name enrollmentNumber grade section')
      .populate('teacherId', 'name email')
      .sort({ createdAt: -1 })
      .lean()

    res.json(grades)
  } catch (err) {
    res.status(500).json({ message: 'Error fetching grades', error: err.message })
  }
})

// Create grade (midterm/final only — quiz/assignment/classwork are teacher-only)
router.post('/grade', verifyToken, checkRole(['admin']), async (req, res) => {
  try {
    const { studentId, subject, score, gradeType, maxScore, remarks } = req.body

    if (!ADMIN_GRADE_TYPES.includes(gradeType)) {
      return res.status(403).json({ message: 'Admins can only add midterm or final exam grades. Quiz, assignment, and classwork are entered by the teacher.' })
    }

    const student = await Student.findById(studentId)
    if (!student) {
      return res.status(404).json({ message: 'Student not found.' })
    }

    let academicYearId = null
    if (student.currentEnrollmentId) {
      const enrollment = await Enrollment.findById(student.currentEnrollmentId).lean()
      academicYearId = enrollment?.academicYearId || null
    }

    const grade = new Grade({
      teacherId: req.user.id, // recorded as the entry point (admin)
      studentId,
      subject,
      score,
      gradeType,
      maxScore: maxScore || 100,
      remarks,
      academicYearId,
      createdAt: new Date()
    })
    await grade.save()

    const populatedGrade = await Grade.findById(grade._id)
      .populate('studentId', 'name enrollmentNumber grade section')
      .lean()

    res.status(201).json(populatedGrade)
  } catch (err) {
    console.error('Error creating grade:', err)
    res.status(500).json({ message: 'Error creating grade', error: err.message })
  }
})

// Update grade (midterm/final only)
router.put('/grade/:id', verifyToken, checkRole(['admin']), async (req, res) => {
  try {
    const { score, remarks, maxScore } = req.body

    const grade = await Grade.findOneAndUpdate(
      { _id: req.params.id, gradeType: { $in: ADMIN_GRADE_TYPES } },
      { score, remarks, maxScore: maxScore !== undefined ? maxScore : undefined },
      { new: true }
    ).populate('studentId', 'name enrollmentNumber grade section')

    if (!grade) {
      return res.status(404).json({ message: 'Grade not found or not an exam grade' })
    }

    res.json(grade)
  } catch (err) {
    res.status(500).json({ message: 'Error updating grade', error: err.message })
  }
})

// ========== ATTENDANCE ==========

router.get('/attendance', verifyToken, checkRole(['admin']), async (req, res) => {
  try {
    const { classId, date, startDate, endDate, studentId } = req.query
    
    let query = {}
    
    if (classId) {
      query.classId = classId
    }

    if (studentId) {
      query.studentId = studentId
    }
    
    if (date) {
      const dateObj = new Date(date)
      query.date = {
        $gte: new Date(dateObj.setHours(0, 0, 0, 0)),
        $lt: new Date(dateObj.setHours(23, 59, 59, 999))
      }
    } else if (startDate && endDate) {
      query.date = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      }
    }

    const attendance = await Attendance.find(query)
      .populate('studentId', 'name enrollmentNumber grade section')
      .populate('markedBy', 'name')
      .sort({ date: -1 })
      .lean()

    res.json(attendance)
  } catch (err) {
    res.status(500).json({ message: 'Error fetching attendance', error: err.message })
  }
})

// ========== CLASSES ==========

router.get('/classes', verifyToken, checkRole(['admin']), async (req, res) => {
  try {
    const classes = await Class.find()
      .populate('teacherId', 'name email')
      .populate('academicYearId', 'name isActive')
      .sort({ grade: 1, section: 1 })
      .lean()

    res.json(classes)
  } catch (err) {
    res.status(500).json({ message: 'Error fetching classes', error: err.message })
  }
})

router.post('/class', verifyToken, checkRole(['admin']), validateClass, asyncHandler(async (req, res) => {
  const { name, grade, section, stream: rawStream, teacherId, capacity, room, academicYearId } = req.body

  // Normalize stream values (the UI sends 'natural'/'social', the model uses full enum values)
  const stream = rawStream === 'natural' ? 'Natural Science' : rawStream === 'social' ? 'Social Science' : rawStream

  // Verify the academic year exists and get its name for the legacy field
  const academicYearDoc = await AcademicYear.findById(academicYearId)
  if (!academicYearDoc) {
    return res.status(404).json({ message: 'Academic year not found.' })
  }
  const academicYearName = academicYearDoc.name

  // Check if class already exists for this academic year (including stream for Grade 11/12)
  const existingClass = await Class.findOne({ 
    grade, 
    section,
    stream: stream || null, // Include stream in uniqueness check
    academicYearId 
  })

  if (existingClass) {
    const streamText = stream ? ` ${stream}` : ''
    return res.status(400).json({ 
      message: `Class ${grade}${streamText}-${section} already exists for academic year ${academicYearName}` 
    })
  }

  // If teacherId is provided, verify it exists and is a teacher
  if (teacherId) {
    const teacher = await User.findOne({ _id: teacherId, role: 'teacher' })
    if (!teacher) {
      return res.status(400).json({ message: 'Invalid teacher ID' })
    }
  }

  const classObj = new Class({
    name,
    grade,
    section,
    stream: (grade === 'Grade 11' || grade === 'Grade 12') ? stream : null, // Only set stream for Grade 11-12
    teacherId: teacherId || null,
    capacity: capacity || 40,
    room: room || null,
    academicYearId,
    academicYear: academicYearName // Legacy field for backward compatibility
  })

  await classObj.save()

  const populatedClass = await Class.findById(classObj._id)
    .populate('teacherId', 'name email')
    .lean()

  res.status(201).json(populatedClass)
}))

router.put('/class/:id', verifyToken, checkRole(['admin']), validateObjectId('id'), asyncHandler(async (req, res) => {
  const { name, grade, section, stream, teacherId, capacity, room, academicYearId, isActive } = req.body

  // Resolve academic year name (for legacy field + messages) if provided
  let academicYearName = null
  if (academicYearId) {
    const academicYearDoc = await AcademicYear.findById(academicYearId)
    if (!academicYearDoc) {
      return res.status(404).json({ message: 'Academic year not found.' })
    }
    academicYearName = academicYearDoc.name
  }

  // Check if updating to a conflicting class combination (including stream)
  if (grade && section && academicYearId) {
    const conflictingClass = await Class.findOne({
      _id: { $ne: req.params.id },
      grade,
      section,
      stream: stream || null,
      academicYearId
    })

    if (conflictingClass) {
      const streamText = stream ? ` ${stream}` : ''
      return res.status(400).json({
        message: `Class ${grade}${streamText}-${section} already exists for academic year ${academicYearName}`
      })
    }
  }

  // If teacherId is provided, verify it exists and is a teacher
  if (teacherId) {
    const teacher = await User.findOne({ _id: teacherId, role: 'teacher' })
    if (!teacher) {
      return res.status(400).json({ message: 'Invalid teacher ID' })
    }
  }

  const classObj = await Class.findByIdAndUpdate(
    req.params.id,
    {
      name,
      grade,
      section,
      stream: (grade === 'Grade 11' || grade === 'Grade 12') ? stream : null, // Only set stream for Grade 11-12
      teacherId: teacherId === '' ? null : teacherId,
      capacity,
      room,
      academicYearId,
      academicYear: academicYearName !== null ? academicYearName : undefined,
      isActive,
      updatedAt: Date.now()
    },
    { new: true }
  ).populate('teacherId', 'name email')

  if (!classObj) {
    return res.status(404).json({ message: 'Class not found' })
  }

  res.json(classObj)
}))

// ========== ACADEMIC YEARS ==========

router.get('/academic-years', verifyToken, checkRole(['admin']), asyncHandler(async (req, res) => {
  try {
    const academicYears = await AcademicYear.find()
      .populate('createdBy', 'name email')
      .sort({ startDate: -1 })
      .lean()

    res.json(academicYears)
  } catch (err) {
    res.status(500).json({ message: 'Error fetching academic years', error: err.message })
  }
}))

// ========== ANNOUNCEMENTS ==========

router.get('/announcements', verifyToken, checkRole(['admin']), async (req, res) => {
  try {
    const announcements = await Announcement.find()
      .populate('createdBy', 'name email')
      .sort({ createdAt: -1 })
      .lean()

    res.json(announcements)
  } catch (err) {
    res.status(500).json({ message: 'Error fetching announcements', error: err.message })
  }
})

router.post('/announcement', verifyToken, checkRole(['admin']), async (req, res) => {
  try {
    const {
      title,
      message: msg,
      content,
      targetRole,
      targetClass,
      priority,
      isPublished
    } = req.body

    const announcement = new Announcement({
      title,
      message: msg || content || title,
      content: content || msg || title,
      createdBy: req.user.id,
      targetRole: targetRole || ['all'],
      targetClass,
      priority,
      isPublished
    })

    await announcement.save()

    const populatedAnnouncement = await Announcement.findById(announcement._id)
      .populate('createdBy', 'name email')
      .lean()

    res.status(201).json(populatedAnnouncement)
  } catch (err) {
    console.error('Error creating announcement:', err)
    res.status(500).json({ message: 'Error creating announcement', error: err.message })
  }
})

// ========== SUBJECTS ==========

router.get('/subjects', verifyToken, checkRole(['admin']), async (req, res) => {
  try {
    const { grade, isActive } = req.query
    let query = {}

    if (grade) {
      query.grade = grade
    }

    if (isActive !== undefined) {
      query.isActive = isActive === 'true'
    }

    const subjects = await Subject.find(query)
      .populate('teacherId', 'name email')
      .sort({ grade: 1, name: 1 })
      .lean()

    res.json(subjects)
  } catch (err) {
    res.status(500).json({ message: 'Error fetching subjects', error: err.message })
  }
})

router.post('/subject', verifyToken, checkRole(['admin']), async (req, res) => {
  try {
    const { name, code, description, grade, teacherId, credits } = req.body

    // Check if subject code already exists
    const existingSubject = await Subject.findOne({ code })
    if (existingSubject) {
      return res.status(400).json({ message: 'Subject code already exists' })
    }

    const subject = new Subject({
      name,
      code,
      description,
      grade,
      teacherId,
      credits
    })

    await subject.save()

    const populatedSubject = await Subject.findById(subject._id)
      .populate('teacherId', 'name email')
      .lean()

    res.status(201).json(populatedSubject)
  } catch (err) {
    console.error('Error creating subject:', err)
    res.status(500).json({ message: 'Error creating subject', error: err.message })
  }
})

router.put('/subject/:id', verifyToken, checkRole(['admin']), async (req, res) => {
  try {
    const { name, code, description, grade, teacherId, credits, isActive } = req.body

    // Check if new code conflicts with existing subject
    if (code) {
      const existingSubject = await Subject.findOne({ 
        code, 
        _id: { $ne: req.params.id } 
      })
      if (existingSubject) {
        return res.status(400).json({ message: 'Subject code already exists' })
      }
    }

    const subject = await Subject.findByIdAndUpdate(
      req.params.id,
      {
        name,
        code,
        description,
        grade,
        teacherId,
        credits,
        isActive,
        updatedAt: Date.now()
      },
      { new: true }
    ).populate('teacherId', 'name email')

    if (!subject) {
      return res.status(404).json({ message: 'Subject not found' })
    }

    res.json(subject)
  } catch (err) {
    res.status(500).json({ message: 'Error updating subject', error: err.message })
  }
})

router.delete('/subject/:id', verifyToken, checkRole(['admin']), async (req, res) => {
  try {
    const subject = await Subject.findById(req.params.id).lean()
    
    if (!subject) {
      return res.status(404).json({ message: 'Subject not found' })
    }

    // Check if subject is used in grades/assignments
    const gradesCount = await Grade.countDocuments({ subjectId: req.params.id })
    const assignmentsCount = await Assignment.countDocuments({ subjectId: req.params.id })

    if (gradesCount > 0 || assignmentsCount > 0) {
      return res.status(400).json({ 
        message: `Cannot delete subject. It has ${gradesCount} grades and ${assignmentsCount} assignments.`,
        suggestion: 'Consider marking it as inactive instead.'
      })
    }

    await Subject.findByIdAndDelete(req.params.id)

    res.json({ message: 'Subject deleted successfully' })
  } catch (err) {
    res.status(500).json({ message: 'Error deleting subject', error: err.message })
  }
})

// ========== TEACHER-CLASS ASSIGNMENT ==========

// Get all classes with their assigned teacher populated
router.get('/classes-with-teachers', verifyToken, checkRole(['admin']), async (req, res) => {
  try {
    const classes = await Class.find({ isActive: true })
      .populate('teacherId', 'name email')
      .sort({ grade: 1, section: 1 })
      .lean()
    res.json(classes)
  } catch (err) {
    res.status(500).json({ message: 'Error fetching classes', error: err.message })
  }
})

// Get classes assigned to a specific teacher
router.get('/teacher/:id/classes', verifyToken, checkRole(['admin']), async (req, res) => {
  try {
    const classes = await Class.find({ teacherId: req.params.id, isActive: true })
      .sort({ grade: 1, section: 1 })
      .lean()
    res.json(classes)
  } catch (err) {
    res.status(500).json({ message: 'Error fetching teacher classes', error: err.message })
  }
})

// Assign teacher to class
router.put('/class/:id/assign-teacher', verifyToken, checkRole(['admin']), async (req, res) => {
  try {
    const { teacherId } = req.body

    if (teacherId) {
      const teacher = await User.findOne({ _id: teacherId, role: 'teacher' })
      if (!teacher) return res.status(404).json({ message: 'Teacher not found' })
    }

    const cls = await Class.findByIdAndUpdate(
      req.params.id,
      { teacherId: teacherId || null, updatedAt: Date.now() },
      { new: true }
    ).populate('teacherId', 'name email')

    if (!cls) return res.status(404).json({ message: 'Class not found' })
    res.json(cls)
  } catch (err) {
    res.status(500).json({ message: 'Error assigning teacher', error: err.message })
  }
})

// ========== GRADES (read-only for admin) ==========

router.get('/grades', verifyToken, checkRole(['admin']), async (req, res) => {
  try {
    const { subject, gradeType, studentId } = req.query
    const query = {}
    if (subject) query.subject = subject
    if (gradeType) query.gradeType = gradeType
    if (studentId) query.studentId = studentId

    const grades = await Grade.find(query)
      .populate('studentId', 'name enrollmentNumber grade section')
      .populate('teacherId', 'name email')
      .sort({ createdAt: -1 })
      .lean()

    res.json(grades)
  } catch (err) {
    res.status(500).json({ message: 'Error fetching grades', error: err.message })
  }
})

// ========== EXISTING ROUTES ==========

// Assign teacher to classes
router.post('/teacher/:teacherId/assign-classes', verifyToken, checkRole(['admin']), async (req, res) => {
  try {
    const { teacherId } = req.params
    const { classIds } = req.body

    let teacherProfile = await Teacher.findOne({ userId: teacherId })
    
    if (!teacherProfile) {
      // Create profile if it doesn't exist
      const user = await User.findById(teacherId).lean()
      if (!user || user.role !== 'teacher') {
        return res.status(404).json({ message: 'Teacher not found' })
      }
      
      teacherProfile = new Teacher({
        userId: teacherId,
        name: user.name,
        employeeId: `EMP${Date.now()}`,
        phone: user.phone || '',
        email: user.email,
        assignedClassIds: classIds || []
      })
      await teacherProfile.save()
    } else {
      teacherProfile.assignedClassIds = classIds || []
      teacherProfile.updatedAt = Date.now()
      await teacherProfile.save()
    }

    const populated = await Teacher.findById(teacherProfile._id)
      .populate('assignedClassIds', 'name grade section')
      .lean()

    // Notify teacher about new class assignments
    try {
      if (populated.assignedClassIds && populated.assignedClassIds.length > 0) {
        for (const classInfo of populated.assignedClassIds) {
          await notifyTeacherClassAssignment({
            teacherId: teacherProfile._id,
            className: classInfo.name || `${classInfo.grade}-${classInfo.section}`,
            subjectName: 'Multiple subjects', // TODO: Get from actual subject assignments
            assignedBy: req.user.id
          })
        }
        console.log(`✅ Sent ${populated.assignedClassIds.length} class assignment notification(s) to teacher`)
      }
    } catch (notifError) {
      console.error('⚠️ Failed to send class assignment notifications:', notifError.message)
      // Don't fail the request if notification fails
    }

    res.json(populated)
  } catch (err) {
    console.error('Error assigning classes:', err)
    res.status(500).json({ message: 'Error assigning classes', error: err.message })
  }
})

// Assign teacher to subjects
router.post('/teacher/:teacherId/assign-subjects', verifyToken, checkRole(['admin']), async (req, res) => {
  try {
    const { teacherId } = req.params
    const { subjectIds } = req.body

    let teacherProfile = await Teacher.findOne({ userId: teacherId })
    
    if (!teacherProfile) {
      const user = await User.findById(teacherId).lean()
      if (!user || user.role !== 'teacher') {
        return res.status(404).json({ message: 'Teacher not found' })
      }
      
      teacherProfile = new Teacher({
        userId: teacherId,
        name: user.name,
        employeeId: `EMP${Date.now()}`,
        phone: user.phone || '',
        email: user.email,
        assignedSubjectIds: subjectIds || []
      })
      await teacherProfile.save()
    } else {
      teacherProfile.assignedSubjectIds = subjectIds || []
      teacherProfile.updatedAt = Date.now()
      await teacherProfile.save()
    }

    const populated = await Teacher.findById(teacherProfile._id)
      .populate('assignedSubjectIds', 'name code')
      .lean()

    res.json(populated)
  } catch (err) {
    console.error('Error assigning subjects:', err)
    res.status(500).json({ message: 'Error assigning subjects', error: err.message })
  }
})

router.get('/users', verifyToken, checkRole(['admin', 'superadmin']), async (req, res) => {
  try {
    const users = await User.find().select('-password')
    res.json(users)
  } catch (err) {
    res.status(500).json({ message: 'Error fetching users', error: err.message })
  }
})

router.post('/user', verifyToken, checkRole(['admin']), async (req, res) => {
  try {
    const { name, email, password, phone, role, status } = req.body

    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Name, email and password are required' })
    }

    if (!['student', 'teacher', 'parent', 'admin'].includes(role)) {
      return res.status(400).json({ message: 'Invalid role' })
    }

    const normalizedEmail = email.trim().toLowerCase()

    const existingUser = await User.findOne({
      $or: [
        { email: normalizedEmail },
        ...(phone ? [{ phoneNormalized: phone.replace(/[^0-9]/g, '') }] : [])
      ]
    })
    if (existingUser) {
      return res.status(400).json({ message: 'Email already registered' })
    }

    const user = await User.create({
      name,
      email: normalizedEmail,
      password,
      phone: phone || null,
      phoneNormalized: phone ? phone.replace(/[^0-9]/g, '') : null,
      role,
      status: status || 'active'
    })

    const { password: _pw, ...safeUser } = user.toObject()
    res.status(201).json(safeUser)
  } catch (err) {
    res.status(500).json({ message: 'Error creating user', error: err.message })
  }
})

router.put('/user/:id', verifyToken, checkRole(['admin']), async (req, res) => {
  try {
    const { name, email, phone, role, status } = req.body
    const user = await User.findById(req.params.id)
    if (!user) {
      return res.status(404).json({ message: 'User not found' })
    }

    if (email && email.trim().toLowerCase() !== user.email) {
      const normalizedEmail = email.trim().toLowerCase()
      const existing = await User.findOne({ email: normalizedEmail })
      if (existing && existing._id.toString() !== user._id.toString()) {
        return res.status(400).json({ message: 'Email already registered' })
      }
      user.email = normalizedEmail
    }

    if (name) user.name = name
    if (phone !== undefined) {
      user.phone = phone || null
      user.phoneNormalized = phone ? phone.replace(/[^0-9]/g, '') : null
    }
    if (role) user.role = role
    if (status) user.status = status

    await user.save()

    const { password: _pw, ...safeUser } = user.toObject()
    res.json(safeUser)
  } catch (err) {
    res.status(500).json({ message: 'Error updating user', error: err.message })
  }
})

router.patch('/user/:id/status', verifyToken, checkRole(['admin']), async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
    if (!user) {
      return res.status(404).json({ message: 'User not found' })
    }

    user.status = user.status === 'active' ? 'inactive' : 'active'
    await user.save()

    res.json({ message: `User ${user.status}`, status: user.status })
  } catch (err) {
    res.status(500).json({ message: 'Error toggling user status', error: err.message })
  }
})

router.delete('/user/:id', verifyToken, checkRole(['admin']), async (req, res) => {
  try {
    await User.findByIdAndDelete(req.params.id)
    res.json({ message: 'User deleted successfully' })
  } catch (err) {
    res.status(500).json({ message: 'Error deleting user', error: err.message })
  }
})

export default router
