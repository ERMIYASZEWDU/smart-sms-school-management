import express from 'express'
import { verifyToken, checkRole, verifyTeacherStudentAccess } from '../middleware/auth.js'
import Grade from '../models/Grade.js'
import Assignment from '../models/Assignment.js'
import Student from '../models/Student.js'
import Attendance from '../models/Attendance.js'
import Class from '../models/Class.js'
import Teacher from '../models/Teacher.js'
import Timetable from '../models/Timetable.js'
import Enrollment from '../models/Enrollment.js'
import AcademicYear from '../models/AcademicYear.js'
import { notifyStudentsNewAssignment, notifyStudentResult, notifyParentAttendance } from '../services/notificationService.js'

const router = express.Router()

// Get assigned classes
router.get('/classes', verifyToken, checkRole(['teacher']), async (req, res) => {
  try {
    const teacherId = req.user.id
    
    console.log('🔍 Fetching classes for teacher:', teacherId)
    
    // Get teacher profile to find assigned classes
    const teacherProfile = await Teacher.findOne({ userId: teacherId }).lean()
    
    let classes = []
    
    if (teacherProfile && teacherProfile.assignedClassIds && teacherProfile.assignedClassIds.length > 0) {
      // Teacher has explicit class assignments via assignedClassIds
      classes = await Class.find({ 
        _id: { $in: teacherProfile.assignedClassIds },
        isActive: true 
      }).lean()
      console.log('✅ Found', classes.length, 'assigned classes from assignedClassIds')
    } else {
      // Fallback: Find classes where teacher is the class teacher
      classes = await Class.find({ 
        teacherId, 
        isActive: true 
      }).lean()
      console.log('✅ Fallback: Found', classes.length, 'classes where teacher is class teacher')
    }
    
    res.json(classes)
  } catch (err) {
    console.error('❌ Error fetching classes:', err)
    res.status(500).json({ message: 'Error fetching classes', error: err.message })
  }
})

// Dashboard
router.get('/dashboard', verifyToken, checkRole(['teacher']), async (req, res) => {
  try {
    const teacherId = req.user.id
    
    // Get active academic year
    const activeYear = await AcademicYear.findOne({ isActive: true })
    
    // Get teacher profile to find assigned classes
    const teacherProfile = await Teacher.findOne({ userId: teacherId }).lean()
    
    let totalStudents = 0
    let totalClasses = 0
    let teacherClassIds = []
    
    if (teacherProfile && teacherProfile.assignedClassIds && teacherProfile.assignedClassIds.length > 0) {
      // Count classes (filter by active academic year if available)
      const classQuery = {
        _id: { $in: teacherProfile.assignedClassIds },
        isActive: true
      }
      if (activeYear) {
        classQuery.academicYearId = activeYear._id
      }
      
      const teacherClasses = await Class.find(classQuery).lean()
      totalClasses = teacherClasses.length
      teacherClassIds = teacherClasses.map(c => c._id)
      
      // Count students via enrollment (preferred)
      if (activeYear && teacherClassIds.length > 0) {
        totalStudents = await Enrollment.countDocuments({
          classId: { $in: teacherClassIds },
          academicYearId: activeYear._id,
          status: 'active'
        })
      }
      
      // Fallback to direct student count if no enrollments
      if (totalStudents === 0 && teacherClassIds.length > 0) {
        totalStudents = await Student.countDocuments({
          classId: { $in: teacherClassIds },
          status: 'active'
        })
      }
    } else {
      // Fallback: count classes where teacher is class teacher
      const classQuery = { 
        teacherId, 
        isActive: true 
      }
      if (activeYear) {
        classQuery.academicYearId = activeYear._id
      }
      
      const teacherClasses = await Class.find(classQuery).lean()
      totalClasses = teacherClasses.length
      teacherClassIds = teacherClasses.map(c => c._id)
      
      if (teacherClasses.length > 0) {
        // Try enrollment-based count first
        if (activeYear) {
          totalStudents = await Enrollment.countDocuments({
            classId: { $in: teacherClassIds },
            academicYearId: activeYear._id,
            status: 'active'
          })
        }
        
        // Fallback to grade/section matching
        if (totalStudents === 0) {
          const classConditions = teacherClasses.map(cls => ({
            grade: cls.grade,
            section: cls.section
          }))
          
          totalStudents = await Student.countDocuments({
            $or: classConditions,
            status: 'active'
          })
        }
      }
    }
    
    // Get assignments count
    const assignmentsCount = await Assignment.countDocuments({ teacherId })
    
    // Get recent assignments
    const recentAssignments = await Assignment.find({ teacherId })
      .sort({ createdAt: -1 })
      .limit(5)
      .lean()

    // Calculate average score from grades
    const grades = await Grade.find({ teacherId }).lean()
    const avgScore = grades.length > 0
      ? (grades.reduce((sum, g) => sum + ((g.score / (g.maxScore || 100)) * 100), 0) / grades.length).toFixed(1)
      : 0

    // Get attendance data for the last 6 months
    const sixMonthsAgo = new Date()
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6)
    
    const attendanceRecords = await Attendance.find({
      markedBy: teacherId,
      date: { $gte: sixMonthsAgo }
    }).lean()
    
    // Group by month
    const monthlyAttendance = {}
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
    
    attendanceRecords.forEach(record => {
      const month = monthNames[new Date(record.date).getMonth()]
      if (!monthlyAttendance[month]) {
        monthlyAttendance[month] = { month, present: 0, absent: 0 }
      }
      if (record.status === 'present' || record.status === 'late') {
        monthlyAttendance[month].present++
      } else if (record.status === 'absent') {
        monthlyAttendance[month].absent++
      }
    })
    
    const attendanceData = Object.values(monthlyAttendance).slice(-6)

    // Get class performance (grades grouped by subject/class)
    const classPerformance = []
    if (teacherProfile && teacherProfile.assignedSubjectIds && teacherProfile.assignedSubjectIds.length > 0) {
      for (const subjectId of teacherProfile.assignedSubjectIds.slice(0, 3)) {
        const subjectGrades = await Grade.find({ 
          teacherId,
          // You can add subjectId filter if you link subjects properly
        }).lean()
        
        if (subjectGrades.length > 0) {
          const avgGrade = subjectGrades.reduce((sum, g) => sum + ((g.score / (g.maxScore || 100)) * 100), 0) / subjectGrades.length
          const excellent = subjectGrades.filter(g => (g.score / (g.maxScore || 100)) >= 0.9).length
          const good = subjectGrades.filter(g => {
            const pct = g.score / (g.maxScore || 100)
            return pct >= 0.75 && pct < 0.9
          }).length
          const average_grade = subjectGrades.filter(g => (g.score / (g.maxScore || 100)) < 0.75).length
          
          classPerformance.push({
            class: subjectGrades[0]?.subject || 'Subject',
            average: avgGrade.toFixed(1),
            excellent,
            good,
            average_grade
          })
        }
      }
    }

    const stats = {
      totalStudents,
      totalClasses,
      assignmentsCount,
      avgScore: parseFloat(avgScore),
      recentAssignments,
      attendanceData: attendanceData.length > 0 ? attendanceData : [
        { month: 'Jan', present: 0, absent: 0 },
        { month: 'Feb', present: 0, absent: 0 },
        { month: 'Mar', present: 0, absent: 0 },
        { month: 'Apr', present: 0, absent: 0 },
        { month: 'May', present: 0, absent: 0 },
        { month: 'Jun', present: 0, absent: 0 }
      ],
      classPerformance: classPerformance.length > 0 ? classPerformance : []
    }

    res.json(stats)
  } catch (err) {
    console.error('Error fetching teacher dashboard:', err)
    res.status(500).json({ message: 'Error fetching dashboard', error: err.message })
  }
})

// Get all assignments
router.get('/assignments', verifyToken, checkRole(['teacher']), async (req, res) => {
  try {
    const assignments = await Assignment.find({ teacherId: req.user.id })
      .sort({ createdAt: -1 })
      .lean()
    
    res.json(assignments)
  } catch (err) {
    res.status(500).json({ message: 'Error fetching assignments', error: err.message })
  }
})

// Create assignment
router.post('/assignment', verifyToken, checkRole(['teacher']), async (req, res) => {
  try {
    const { title, description, subject, grade, dueDate, classId } = req.body

    const assignment = new Assignment({
      teacherId: req.user.id,
      title,
      description,
      subject,
      grade: grade || classId,
      dueDate,
      createdAt: new Date()
    })

    await assignment.save()
    
    // Notify students about new assignment
    try {
      // Get class details to find students
      const classDetails = await Class.findById(classId)
      if (classDetails) {
        await notifyStudentsNewAssignment({
          classId,
          grade: classDetails.grade,
          section: classDetails.section,
          stream: classDetails.stream,
          assignmentTitle: title,
          subjectName: subject,
          dueDate,
          teacherId: req.user.id,
          assignmentId: assignment._id
        })
        console.log(`✅ Sent assignment notifications for ${classDetails.grade}-${classDetails.section}`)
      }
    } catch (notifError) {
      console.error('⚠️ Failed to send assignment notifications:', notifError.message)
      // Don't fail the request if notification fails
    }
    
    res.status(201).json(assignment)
  } catch (err) {
    res.status(500).json({ message: 'Error creating assignment', error: err.message })
  }
})

// Update assignment
router.put('/assignment/:id', verifyToken, checkRole(['teacher']), async (req, res) => {
  try {
    const { id } = req.params
    const { title, description, subject, grade, dueDate } = req.body

    const assignment = await Assignment.findOneAndUpdate(
      { _id: id, teacherId: req.user.id },
      { title, description, subject, grade, dueDate },
      { new: true }
    )

    if (!assignment) {
      return res.status(404).json({ message: 'Assignment not found' })
    }

    res.json(assignment)
  } catch (err) {
    res.status(500).json({ message: 'Error updating assignment', error: err.message })
  }
})

// Delete assignment
router.delete('/assignment/:id', verifyToken, checkRole(['teacher']), async (req, res) => {
  try {
    const { id } = req.params
    
    const assignment = await Assignment.findOneAndDelete({
      _id: id,
      teacherId: req.user.id
    })

    if (!assignment) {
      return res.status(404).json({ message: 'Assignment not found' })
    }

    res.json({ message: 'Assignment deleted successfully' })
  } catch (err) {
    res.status(500).json({ message: 'Error deleting assignment', error: err.message })
  }
})

// Get students (only from classes assigned to this teacher)
// Get students (only from classes assigned to this teacher)
router.get('/students', verifyToken, checkRole(['teacher']), async (req, res) => {
  try {
    const { search, classId, academicYearId } = req.query
    
    console.log('🔍 Teacher students request:', {
      teacherId: req.user.id,
      search,
      classId,
      academicYearId
    })

    // Get active academic year if not provided
    let finalAcademicYearId = academicYearId
    if (!finalAcademicYearId) {
      const activeYear = await AcademicYear.findOne({ isActive: true })
      if (activeYear) {
        finalAcademicYearId = activeYear._id
      }
    }
    
    // Method 1: Try to find teacher profile with assigned classes
    const teacherProfile = await Teacher.findOne({ userId: req.user.id }).lean()
    
    let teacherClasses = []
    
    if (teacherProfile && teacherProfile.assignedClassIds && teacherProfile.assignedClassIds.length > 0) {
      // Teacher has explicit class assignments
      const classQuery = { 
        _id: { $in: teacherProfile.assignedClassIds },
        isActive: true 
      }
      
      // Filter by academic year if provided
      if (finalAcademicYearId) {
        classQuery.academicYearId = finalAcademicYearId
      }
      
      teacherClasses = await Class.find(classQuery).lean()
      console.log('✅ Found teacher profile with', teacherClasses.length, 'assigned classes')
    } else {
      // Method 2: Fallback to classes where teacher is class teacher
      const classQuery = { 
        teacherId: req.user.id, 
        isActive: true 
      }
      
      if (finalAcademicYearId) {
        classQuery.academicYearId = finalAcademicYearId
      }
      
      teacherClasses = await Class.find(classQuery).lean()
      console.log('✅ Fallback: Found', teacherClasses.length, 'classes where teacher is class teacher')
    }
    
    if (teacherClasses.length === 0) {
      console.warn('⚠️ Teacher has no assigned classes')
      return res.json([])
    }
    
    console.log('📚 Teacher classes:', teacherClasses.map(c => ({
      id: c._id,
      name: c.name,
      grade: c.grade,
      section: c.section,
      stream: c.stream
    })))
    
    // Build enrollment-based query (preferred method)
    const classIds = teacherClasses.map(c => c._id)
    
    let enrollmentQuery = {
      classId: { $in: classIds },
      status: 'active'
    }
    
    // Filter by academic year if provided
    if (finalAcademicYearId) {
      enrollmentQuery.academicYearId = finalAcademicYearId
    }
    
    // Filter by specific class if provided
    if (classId && classId !== 'all') {
      enrollmentQuery.classId = classId
    }
    
    // Get enrollments
    let enrollments = await Enrollment.find(enrollmentQuery)
      .populate({
        path: 'studentId',
        select: 'name enrollmentNumber grade section stream rollNumber attendance gpa userId status',
        populate: { path: 'userId', select: 'email' }
      })
      .populate('classId', 'name grade section stream')
      .sort({ grade: 1, section: 1, rollNumber: 1 })
      .lean()
    
    // Filter enrollments with valid students
    enrollments = enrollments.filter(e => e.studentId)
    
    // Extract students from enrollments
    let students = enrollments.map(enrollment => ({
      ...enrollment.studentId,
      enrollment: {
        id: enrollment._id,
        rollNumber: enrollment.rollNumber,
        status: enrollment.status,
        enrollmentDate: enrollment.enrollmentDate,
        classId: enrollment.classId
      }
    }))
    
    console.log(`✅ Found ${students.length} students via enrollment system`)
    
    // Backward compatibility fallback: Also query students directly if no enrollments found
    if (students.length === 0) {
      console.log('⚠️ No enrollments found, falling back to direct student query')
      
      const classConditions = teacherClasses.map(cls => ({
        grade: cls.grade,
        section: cls.section,
        stream: cls.stream || null
      }))
      
      let studentQuery = {
        $or: [
          { classId: { $in: classIds } },
          ...classConditions.map(cond => {
            const condition = { 
              grade: cond.grade, 
              section: cond.section 
            }
            if (cond.stream) {
              condition.stream = cond.stream
            }
            return condition
          })
        ],
        status: 'active'
      }
      
      if (classId && classId !== 'all') {
        studentQuery.classId = classId
      }
      
      students = await Student.find(studentQuery)
        .select('name enrollmentNumber grade section stream rollNumber attendance gpa classId userId')
        .populate('classId', 'name grade section stream')
        .populate('userId', 'email')
        .sort({ grade: 1, section: 1, rollNumber: 1 })
        .lean()
      
      console.log(`✅ Fallback: Found ${students.length} students via direct query`)
    }
    
    // Apply search filter if provided
    if (search) {
      const searchLower = search.toLowerCase()
      students = students.filter(s => 
        s.name?.toLowerCase().includes(searchLower) ||
        s.enrollmentNumber?.toLowerCase().includes(searchLower)
      )
    }
    
    console.log('✅ Final result:', students.length, 'students')
    if (students.length > 0) {
      console.log('📊 Sample students:', students.slice(0, 3).map(s => ({
        id: s._id,
        name: s.name,
        enrollment: s.enrollmentNumber,
        class: s.classId?.name || s.enrollment?.classId?.name || `${s.grade}-${s.section}`
      })))
    }

    res.json(students)
  } catch (err) {
    console.error('❌ Error fetching students:', err)
    res.status(500).json({ message: 'Error fetching students', error: err.message })
  }
})

// Get student details
router.get('/student/:id', verifyToken, checkRole(['teacher']), verifyTeacherStudentAccess, async (req, res) => {
  try {
    const student = await Student.findById(req.params.id)
      .lean()

    if (!student) {
      return res.status(404).json({ message: 'Student not found' })
    }

    // Get student's grades
    const grades = await Grade.find({ studentId: req.params.id })
      .sort({ createdAt: -1 })
      .lean()

    res.json({ ...student, grades })
  } catch (err) {
    res.status(500).json({ message: 'Error fetching student', error: err.message })
  }
})

// Get grades
router.get('/grades', verifyToken, checkRole(['teacher']), async (req, res) => {
  try {
    const { classId, subject } = req.query
    
    let query = { teacherId: req.user.id }
    
    if (subject) {
      query.subject = subject
    }

    const grades = await Grade.find(query)
      .populate('studentId', 'name enrollmentNumber grade section')
      .sort({ createdAt: -1 })
      .lean()

    res.json(grades)
  } catch (err) {
    console.error('Error fetching grades:', err)
    res.status(500).json({ message: 'Error fetching grades', error: err.message })
  }
})

// Grade types teachers are allowed to enter (midterm/final are admin-only)
const TEACHER_GRADE_TYPES = ['quiz', 'assignment', 'classwork']

// Create grade
router.post('/grade', verifyToken, checkRole(['teacher']), async (req, res) => {
  try {
    const { studentId, subject, score, gradeType, maxScore, remarks } = req.body

    if (!TEACHER_GRADE_TYPES.includes(gradeType)) {
      return res.status(403).json({ message: 'Teachers can only add quiz, assignment, or classwork grades. Midterm and final exams are entered by the admin.' })
    }

    const grade = new Grade({
      teacherId: req.user.id,
      studentId,
      subject,
      score,
      gradeType,
      maxScore: maxScore || 100,
      remarks,
      createdAt: new Date()
    })

    await grade.save()
    
    const populatedGrade = await Grade.findById(grade._id)
      .populate('studentId', 'name enrollmentNumber grade section')
      .lean()
    
    // Notify student and parent about new result
    try {
      await notifyStudentResult({
        studentId: grade.studentId._id || studentId,
        subjectName: subject,
        score,
        maxScore: maxScore || 100,
        grade: gradeType,
        teacherId: req.user.id,
        resultId: grade._id
      })
      console.log(`✅ Sent result notification for ${subject}`)
    } catch (notifError) {
      console.error('⚠️ Failed to send result notification:', notifError.message)
      // Don't fail the request if notification fails
    }
    
    res.status(201).json(populatedGrade)
  } catch (err) {
    console.error('Error creating grade:', err)
    res.status(500).json({ message: 'Error creating grade', error: err.message })
  }
})

// Update grade
router.put('/grade/:id', verifyToken, checkRole(['teacher']), async (req, res) => {
  try {
    const { id } = req.params
    const { score, remarks, maxScore } = req.body

    const grade = await Grade.findOneAndUpdate(
      { _id: id, teacherId: req.user.id, gradeType: { $in: TEACHER_GRADE_TYPES } },
      { score, remarks, maxScore: maxScore !== undefined ? maxScore : undefined },
      { new: true }
    ).populate('studentId', 'name rollNumber class')

    if (!grade) {
      return res.status(404).json({ message: 'Grade not found' })
    }

    res.json(grade)
  } catch (err) {
    res.status(500).json({ message: 'Error updating grade', error: err.message })
  }
})

// Mark attendance
router.post('/attendance', verifyToken, checkRole(['teacher']), async (req, res) => {
  try {
    const { classId, date, students } = req.body
    
    console.log('📝 Marking attendance:', { classId, date, studentsCount: students?.length })
    
    if (!students || students.length === 0) {
      return res.status(400).json({ message: 'No students provided' })
    }
    
    const attendanceDate = date ? new Date(date) : new Date()
    attendanceDate.setHours(0, 0, 0, 0) // Normalize to start of day
    
    // Check if attendance already exists for these students on this date
    const studentIds = students.map(s => s.studentId)
    const existingAttendance = await Attendance.find({
      studentId: { $in: studentIds },
      date: {
        $gte: attendanceDate,
        $lt: new Date(attendanceDate.getTime() + 24 * 60 * 60 * 1000)
      }
    })
    
    if (existingAttendance.length > 0) {
      console.log('⚠️ Attendance already exists, updating...')
      // Update existing records
      const updates = students.map(async (s) => {
        await Attendance.findOneAndUpdate(
          {
            studentId: s.studentId,
            date: {
              $gte: attendanceDate,
              $lt: new Date(attendanceDate.getTime() + 24 * 60 * 60 * 1000)
            }
          },
          {
            status: s.status,
            classId: classId || null,
            markedBy: req.user.id,
            updatedAt: new Date()
          },
          { upsert: true }
        )
      })
      
      await Promise.all(updates)
      console.log('✅ Attendance updated:', students.length, 'records')
      
      return res.json({ 
        message: 'Attendance updated successfully', 
        count: students.length 
      })
    }
    
    // Create new attendance records
    const attendanceRecords = students.map(s => ({
      studentId: s.studentId,
      classId: classId || null,
      date: attendanceDate,
      status: s.status,
      markedBy: req.user.id
    }))

    const result = await Attendance.insertMany(attendanceRecords)
    console.log('✅ Attendance marked:', result.length, 'records')
    
    // Notify parents about absent, late, or excused students
    try {
      for (const student of students) {
        if (['absent', 'late', 'excused'].includes(student.status)) {
          await notifyParentAttendance({
            studentId: student.studentId,
            status: student.status,
            date: attendanceDate,
            teacherId: req.user.id
          })
        }
      }
      console.log('✅ Sent attendance notifications to parents')
    } catch (notifError) {
      console.error('⚠️ Failed to send attendance notifications:', notifError.message)
      // Don't fail the request if notification fails
    }
    
    res.status(201).json({ 
      message: 'Attendance marked successfully', 
      count: result.length 
    })
  } catch (err) {
    console.error('❌ Error marking attendance:', err)
    res.status(500).json({ message: 'Error marking attendance', error: err.message })
  }
})

// Get attendance
router.get('/attendance', verifyToken, checkRole(['teacher']), async (req, res) => {
  try {
    const { classId, date, startDate, endDate } = req.query
    
    let query = {}
    
    if (classId) {
      query.classId = classId
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
      .populate('studentId', 'name rollNumber class')
      .sort({ date: -1 })
      .lean()

    res.json(attendance)
  } catch (err) {
    res.status(500).json({ message: 'Error fetching attendance', error: err.message })
  }
})

// Get timetable
router.get('/timetable', verifyToken, checkRole(['teacher']), async (req, res) => {
  try {
    const teacherId = req.user.id

    // Fetch timetable entries for this teacher
    const entries = await Timetable.find({ 
      teacherId, 
      isActive: true 
    })
      .populate('classId', 'name grade section')
      .populate('subjectId', 'name code')
      .sort({ dayOfWeek: 1, startTime: 1 })
      .lean()

    // Group by day of week
    const timetable = {}
    const daysOrder = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
    
    daysOrder.forEach(day => {
      timetable[day] = entries
        .filter(entry => entry.dayOfWeek === day)
        .map(entry => ({
          time: `${entry.startTime} - ${entry.endTime}`,
          subject: entry.subjectId?.name || 'Unknown Subject',
          class: entry.classId?.name || `${entry.classId?.grade || ''}-${entry.classId?.section || ''}`,
          room: entry.room || 'TBA',
          _id: entry._id
        }))
    })

    res.json(timetable)
  } catch (err) {
    console.error('Error fetching timetable:', err)
    res.status(500).json({ message: 'Error fetching timetable', error: err.message })
  }
})

export default router
