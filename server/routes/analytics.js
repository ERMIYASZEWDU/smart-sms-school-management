import express from 'express'
import { verifyToken, isAdmin, isTeacher } from '../middleware/auth.js'
import { asyncHandler } from '../middleware/errorHandler.js'
import Student from '../models/Student.js'
import Teacher from '../models/Teacher.js'
import Attendance from '../models/Attendance.js'
import Grade from '../models/Grade.js'
import Class from '../models/Class.js'
import Assignment from '../models/Assignment.js'
import AcademicYear from '../models/AcademicYear.js'
import Term from '../models/Term.js'

const router = express.Router()

// All routes require authentication
router.use(verifyToken)

// ==================== ADMIN DASHBOARD ANALYTICS ====================

// GET admin dashboard overview
router.get('/admin/dashboard', isAdmin, asyncHandler(async (req, res) => {
  const { academicYearId, termId } = req.query

  // Get active academic year and term if not provided
  let academicYear, term
  if (academicYearId) {
    academicYear = await AcademicYear.findById(academicYearId)
  } else {
    academicYear = await AcademicYear.findOne({ isActive: true })
  }

  if (termId) {
    term = await Term.findById(termId)
  } else if (academicYear) {
    term = await Term.findOne({ academicYearId: academicYear._id, isActive: true })
  }

  // Student stats
  const totalStudents = await Student.countDocuments({ status: 'active' })
  const studentsByGrade = await Student.aggregate([
    { $match: { status: 'active' } },
    { $group: { _id: '$grade', count: { $sum: 1 } } },
    { $sort: { _id: 1 } }
  ])

  // Teacher stats
  const totalTeachers = await Teacher.countDocuments()
  const teachersWithAssignments = await Teacher.countDocuments({ classIds: { $exists: true, $ne: [] } })

  // Attendance stats
  const attendanceFilter = {}
  if (academicYear) attendanceFilter.academicYearId = academicYear._id
  if (term) attendanceFilter.termId = term._id

  const attendanceStats = await Attendance.aggregate([
    { $match: attendanceFilter },
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 }
      }
    }
  ])

  const totalAttendance = attendanceStats.reduce((sum, stat) => sum + stat.count, 0)
  const attendanceByStatus = {
    present: attendanceStats.find(s => s._id === 'present')?.count || 0,
    absent: attendanceStats.find(s => s._id === 'absent')?.count || 0,
    late: attendanceStats.find(s => s._id === 'late')?.count || 0,
    excused: attendanceStats.find(s => s._id === 'excused')?.count || 0
  }

  const attendancePercentage = totalAttendance > 0 
    ? Math.round((attendanceByStatus.present / totalAttendance) * 100) 
    : 0

  // Academic stats
  const gradeFilter = {}
  if (academicYear) gradeFilter.academicYearId = academicYear._id
  if (term) gradeFilter.termId = term._id

  const gradeStats = await Grade.aggregate([
    { $match: gradeFilter },
    {
      $group: {
        _id: null,
        averageScore: { $avg: '$score' },
        totalGrades: { $sum: 1 },
        passCount: {
          $sum: { $cond: [{ $gte: ['$score', 50] }, 1, 0] }
        }
      }
    }
  ])

  const academicStats = gradeStats[0] || { averageScore: 0, totalGrades: 0, passCount: 0 }
  const passRate = academicStats.totalGrades > 0
    ? Math.round((academicStats.passCount / academicStats.totalGrades) * 100)
    : 0

  // Fee stats - Disabled (Fee model not implemented yet)
  const feeStats = {
    totalExpected: 0,
    totalCollected: 0,
    totalOutstanding: 0,
    collectionPercentage: 0
  }

  res.json({
    success: true,
    data: {
      academicYear: academicYear ? { id: academicYear._id, name: academicYear.name } : null,
      term: term ? { id: term._id, name: term.name } : null,
      students: {
        total: totalStudents,
        byGrade: studentsByGrade
      },
      teachers: {
        total: totalTeachers,
        withAssignments: teachersWithAssignments
      },
      attendance: {
        total: totalAttendance,
        byStatus: attendanceByStatus,
        percentage: attendancePercentage
      },
      academic: {
        averageScore: Math.round(academicStats.averageScore || 0),
        totalGrades: academicStats.totalGrades,
        passRate
      },
      fees: feeStats
    }
  })
}))

// ==================== ATTENDANCE ANALYTICS ====================

// GET detailed attendance analytics
router.get('/attendance', asyncHandler(async (req, res) => {
  const { academicYearId, termId, classId, startDate, endDate } = req.query

  // Authorization check for teachers
  if (req.user.role === 'teacher') {
    const teacher = await Teacher.findOne({ userId: req.user.id })
    if (classId && teacher && !teacher.classIds.includes(classId)) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized: Can only view assigned class attendance'
      })
    }
  }

  const filter = {}
  if (academicYearId) filter.academicYearId = academicYearId
  if (termId) filter.termId = termId
  if (classId) filter.classId = classId
  if (startDate || endDate) {
    filter.date = {}
    if (startDate) filter.date.$gte = new Date(startDate)
    if (endDate) filter.date.$lte = new Date(endDate)
  }

  // Overall statistics
  const overallStats = await Attendance.aggregate([
    { $match: filter },
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 }
      }
    }
  ])

  const total = overallStats.reduce((sum, stat) => sum + stat.count, 0)
  const byStatus = {
    present: overallStats.find(s => s._id === 'present')?.count || 0,
    absent: overallStats.find(s => s._id === 'absent')?.count || 0,
    late: overallStats.find(s => s._id === 'late')?.count || 0,
    excused: overallStats.find(s => s._id === 'excused')?.count || 0
  }

  // Attendance by class
  const byClass = await Attendance.aggregate([
    { $match: filter },
    {
      $group: {
        _id: '$classId',
        total: { $sum: 1 },
        present: {
          $sum: { $cond: [{ $eq: ['$status', 'present'] }, 1, 0] }
        }
      }
    },
    {
      $lookup: {
        from: 'classes',
        localField: '_id',
        foreignField: '_id',
        as: 'class'
      }
    },
    { $unwind: { path: '$class', preserveNullAndEmptyArrays: true } }
  ])

  const classSummary = byClass.map(c => ({
    classId: c._id,
    className: c.class?.name || 'Unknown',
    grade: c.class?.grade,
    section: c.class?.section,
    total: c.total,
    present: c.present,
    percentage: Math.round((c.present / c.total) * 100)
  }))

  // Attendance trend (by month)
  const trendData = await Attendance.aggregate([
    { $match: filter },
    {
      $group: {
        _id: {
          year: { $year: '$date' },
          month: { $month: '$date' },
          status: '$status'
        },
        count: { $sum: 1 }
      }
    },
    { $sort: { '_id.year': 1, '_id.month': 1 } }
  ])

  // Students with low attendance
  const lowAttendanceStudents = await Attendance.aggregate([
    { $match: filter },
    {
      $group: {
        _id: '$studentId',
        total: { $sum: 1 },
        present: {
          $sum: { $cond: [{ $eq: ['$status', 'present'] }, 1, 0] }
        },
        absent: {
          $sum: { $cond: [{ $eq: ['$status', 'absent'] }, 1, 0] }
        }
      }
    },
    {
      $addFields: {
        percentage: {
          $multiply: [{ $divide: ['$present', '$total'] }, 100]
        }
      }
    },
    { $match: { percentage: { $lt: 75 } } },
    { $sort: { percentage: 1 } },
    { $limit: 10 },
    {
      $lookup: {
        from: 'students',
        localField: '_id',
        foreignField: '_id',
        as: 'student'
      }
    },
    { $unwind: '$student' }
  ])

  const studentsNeedingAttention = lowAttendanceStudents.map(s => ({
    studentId: s._id,
    studentName: s.student.name,
    enrollmentNumber: s.student.enrollmentNumber,
    grade: s.student.grade,
    section: s.student.section,
    totalDays: s.total,
    presentDays: s.present,
    absentDays: s.absent,
    attendancePercentage: Math.round(s.percentage)
  }))

  res.json({
    success: true,
    data: {
      overall: {
        total,
        byStatus,
        percentage: total > 0 ? Math.round((byStatus.present / total) * 100) : 0
      },
      byClass: classSummary,
      trend: trendData,
      studentsNeedingAttention
    }
  })
}))

// ==================== ACADEMIC PERFORMANCE ANALYTICS ====================

// GET academic performance analytics
router.get('/academic-performance', asyncHandler(async (req, res) => {
  const { academicYearId, termId, classId, subject } = req.query

  // Authorization check for teachers
  if (req.user.role === 'teacher') {
    const teacher = await Teacher.findOne({ userId: req.user.id })
    if (classId && teacher && !teacher.classIds.includes(classId)) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized: Can only view assigned class performance'
      })
    }
  }

  const filter = {}
  if (academicYearId) filter.academicYearId = academicYearId
  if (termId) filter.termId = termId
  if (classId) filter.classId = classId
  if (subject) filter.subject = subject

  // Overall performance
  const overallStats = await Grade.aggregate([
    { $match: filter },
    {
      $group: {
        _id: null,
        averageScore: { $avg: '$score' },
        highestScore: { $max: '$score' },
        lowestScore: { $min: '$score' },
        totalGrades: { $sum: 1 },
        passCount: {
          $sum: { $cond: [{ $gte: ['$score', 50] }, 1, 0] }
        }
      }
    }
  ])

  const overall = overallStats[0] || {
    averageScore: 0,
    highestScore: 0,
    lowestScore: 0,
    totalGrades: 0,
    passCount: 0
  }
  overall.passRate = overall.totalGrades > 0
    ? Math.round((overall.passCount / overall.totalGrades) * 100)
    : 0

  // Performance by subject
  const bySubject = await Grade.aggregate([
    { $match: filter },
    {
      $group: {
        _id: '$subject',
        averageScore: { $avg: '$score' },
        highestScore: { $max: '$score' },
        lowestScore: { $min: '$score' },
        totalGrades: { $sum: 1 },
        passCount: {
          $sum: { $cond: [{ $gte: ['$score', 50] }, 1, 0] }
        }
      }
    },
    {
      $addFields: {
        passRate: {
          $multiply: [
            { $divide: ['$passCount', '$totalGrades'] },
            100
          ]
        }
      }
    },
    { $sort: { averageScore: -1 } }
  ])

  const subjectPerformance = bySubject.map(s => ({
    subject: s._id,
    averageScore: Math.round(s.averageScore),
    highestScore: s.highestScore,
    lowestScore: s.lowestScore,
    totalGrades: s.totalGrades,
    passRate: Math.round(s.passRate)
  }))

  // Performance by class
  const byClass = await Grade.aggregate([
    { $match: filter },
    {
      $group: {
        _id: '$classId',
        averageScore: { $avg: '$score' },
        totalGrades: { $sum: 1 },
        passCount: {
          $sum: { $cond: [{ $gte: ['$score', 50] }, 1, 0] }
        }
      }
    },
    {
      $lookup: {
        from: 'classes',
        localField: '_id',
        foreignField: '_id',
        as: 'class'
      }
    },
    { $unwind: { path: '$class', preserveNullAndEmptyArrays: true } }
  ])

  const classPerformance = byClass.map(c => ({
    classId: c._id,
    className: c.class?.name || 'Unknown',
    grade: c.class?.grade,
    section: c.class?.section,
    averageScore: Math.round(c.averageScore),
    totalGrades: c.totalGrades,
    passRate: Math.round((c.passCount / c.totalGrades) * 100)
  }))

  // Top performing students
  const topStudents = await Grade.aggregate([
    { $match: filter },
    {
      $group: {
        _id: '$studentId',
        averageScore: { $avg: '$score' },
        totalGrades: { $sum: 1 }
      }
    },
    { $match: { totalGrades: { $gte: 3 } } },
    { $sort: { averageScore: -1 } },
    { $limit: 10 },
    {
      $lookup: {
        from: 'students',
        localField: '_id',
        foreignField: '_id',
        as: 'student'
      }
    },
    { $unwind: '$student' }
  ])

  const topPerformers = topStudents.map(s => ({
    studentId: s._id,
    studentName: s.student.name,
    enrollmentNumber: s.student.enrollmentNumber,
    grade: s.student.grade,
    section: s.student.section,
    averageScore: Math.round(s.averageScore),
    totalGrades: s.totalGrades
  }))

  res.json({
    success: true,
    data: {
      overall,
      bySubject: subjectPerformance,
      byClass: classPerformance,
      topPerformers
    }
  })
}))

// ==================== STUDENT PERFORMANCE PROFILE ====================

// GET individual student performance
router.get('/student/:studentId/performance', asyncHandler(async (req, res) => {
  const { studentId } = req.params
  const { academicYearId, termId } = req.query

  // Authorization check
  if (req.user.role === 'student') {
    const student = await Student.findOne({ userId: req.user.id })
    if (!student || student._id.toString() !== studentId) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized: Can only view own performance'
      })
    }
  }

  const student = await Student.findById(studentId)
    .populate('classId', 'name grade section')

  if (!student) {
    return res.status(404).json({
      success: false,
      message: 'Student not found'
    })
  }

  // Grades
  const gradeFilter = { studentId }
  if (academicYearId) gradeFilter.academicYearId = academicYearId
  if (termId) gradeFilter.termId = termId

  const grades = await Grade.find(gradeFilter)
    .populate('teacherId', 'name')
    .sort({ date: -1 })

  const gradeStats = await Grade.aggregate([
    { $match: gradeFilter },
    {
      $group: {
        _id: null,
        averageScore: { $avg: '$score' },
        highestScore: { $max: '$score' },
        lowestScore: { $min: '$score' },
        totalGrades: { $sum: 1 }
      }
    }
  ])

  const overallPerformance = gradeStats[0] || {
    averageScore: 0,
    highestScore: 0,
    lowestScore: 0,
    totalGrades: 0
  }

  // Subject-wise performance
  const subjectPerformance = await Grade.aggregate([
    { $match: gradeFilter },
    {
      $group: {
        _id: '$subject',
        averageScore: { $avg: '$score' },
        totalGrades: { $sum: 1 },
        latestScore: { $last: '$score' }
      }
    },
    { $sort: { averageScore: -1 } }
  ])

  // Attendance
  const attendanceFilter = { studentId }
  if (academicYearId) attendanceFilter.academicYearId = academicYearId
  if (termId) attendanceFilter.termId = termId

  const attendanceStats = await Attendance.aggregate([
    { $match: attendanceFilter },
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 }
      }
    }
  ])

  const totalDays = attendanceStats.reduce((sum, stat) => sum + stat.count, 0)
  const presentDays = attendanceStats.find(s => s._id === 'present')?.count || 0
  const attendancePercentage = totalDays > 0 ? Math.round((presentDays / totalDays) * 100) : 0

  // At-risk indicators
  const atRisk = {
    lowAttendance: attendancePercentage < 75,
    lowPerformance: overallPerformance.averageScore < 50,
    needsSupport: attendancePercentage < 75 || overallPerformance.averageScore < 50
  }

  res.json({
    success: true,
    data: {
      student: {
        id: student._id,
        name: student.name,
        enrollmentNumber: student.enrollmentNumber,
        grade: student.grade,
        section: student.section,
        class: student.classId
      },
      academic: {
        overall: {
          averageScore: Math.round(overallPerformance.averageScore),
          highestScore: overallPerformance.highestScore,
          lowestScore: overallPerformance.lowestScore,
          totalGrades: overallPerformance.totalGrades
        },
        bySubject: subjectPerformance.map(s => ({
          subject: s._id,
          averageScore: Math.round(s.averageScore),
          totalGrades: s.totalGrades,
          latestScore: s.latestScore
        })),
        recentGrades: grades.slice(0, 10)
      },
      attendance: {
        totalDays,
        presentDays,
        absentDays: attendanceStats.find(s => s._id === 'absent')?.count || 0,
        lateDays: attendanceStats.find(s => s._id === 'late')?.count || 0,
        excusedDays: attendanceStats.find(s => s._id === 'excused')?.count || 0,
        percentage: attendancePercentage
      },
      atRisk
    }
  })
}))

// ==================== AT-RISK STUDENTS ====================

// GET students needing academic support
router.get('/at-risk-students', asyncHandler(async (req, res) => {
  const { academicYearId, termId, classId } = req.query

  // Authorization check for teachers
  if (req.user.role === 'teacher') {
    const teacher = await Teacher.findOne({ userId: req.user.id })
    if (classId && teacher && !teacher.classIds.includes(classId)) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized'
      })
    }
  } else if (req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'Unauthorized'
    })
  }

  const studentFilter = { status: 'active' }
  if (classId) studentFilter.classId = classId

  const students = await Student.find(studentFilter)

  const atRiskStudents = []

  for (const student of students) {
    const gradeFilter = { studentId: student._id }
    if (academicYearId) gradeFilter.academicYearId = academicYearId
    if (termId) gradeFilter.termId = termId

    const attendanceFilter = { studentId: student._id }
    if (academicYearId) attendanceFilter.academicYearId = academicYearId
    if (termId) attendanceFilter.termId = termId

    // Get academic performance
    const gradeStats = await Grade.aggregate([
      { $match: gradeFilter },
      {
        $group: {
          _id: null,
          averageScore: { $avg: '$score' },
          totalGrades: { $sum: 1 }
        }
      }
    ])

    // Get attendance
    const attendanceStats = await Attendance.aggregate([
      { $match: attendanceFilter },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ])

    const totalDays = attendanceStats.reduce((sum, stat) => sum + stat.count, 0)
    const presentDays = attendanceStats.find(s => s._id === 'present')?.count || 0
    const attendancePercentage = totalDays > 0 ? (presentDays / totalDays) * 100 : 100

    const averageScore = gradeStats[0]?.averageScore || 0
    const totalGrades = gradeStats[0]?.totalGrades || 0

    // Determine if student is at risk
    const reasons = []
    if (attendancePercentage < 75) reasons.push('Low attendance')
    if (averageScore < 50 && totalGrades >= 3) reasons.push('Low academic performance')
    if (totalGrades === 0) reasons.push('No grades recorded')

    if (reasons.length > 0) {
      atRiskStudents.push({
        studentId: student._id,
        studentName: student.name,
        enrollmentNumber: student.enrollmentNumber,
        grade: student.grade,
        section: student.section,
        averageScore: Math.round(averageScore),
        attendancePercentage: Math.round(attendancePercentage),
        totalGrades,
        reasons,
        riskLevel: reasons.length >= 2 ? 'high' : 'medium'
      })
    }
  }

  // Sort by risk level and score
  atRiskStudents.sort((a, b) => {
    if (a.riskLevel !== b.riskLevel) {
      return a.riskLevel === 'high' ? -1 : 1
    }
    return a.averageScore - b.averageScore
  })

  res.json({
    success: true,
    count: atRiskStudents.length,
    data: atRiskStudents
  })
}))

// ==================== CLASS PERFORMANCE ====================

// GET class performance summary
router.get('/class/:classId/performance', asyncHandler(async (req, res) => {
  const { classId } = req.params
  const { academicYearId, termId } = req.query

  // Authorization check for teachers
  if (req.user.role === 'teacher') {
    const teacher = await Teacher.findOne({ userId: req.user.id })
    if (teacher && !teacher.classIds.includes(classId)) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized: Can only view assigned class performance'
      })
    }
  }

  const classInfo = await Class.findById(classId)
  if (!classInfo) {
    return res.status(404).json({
      success: false,
      message: 'Class not found'
    })
  }

  const studentCount = await Student.countDocuments({ classId, status: 'active' })

  // Academic performance
  const gradeFilter = { classId }
  if (academicYearId) gradeFilter.academicYearId = academicYearId
  if (termId) gradeFilter.termId = termId

  const performanceStats = await Grade.aggregate([
    { $match: gradeFilter },
    {
      $group: {
        _id: null,
        averageScore: { $avg: '$score' },
        totalGrades: { $sum: 1 },
        passCount: {
          $sum: { $cond: [{ $gte: ['$score', 50] }, 1, 0] }
        }
      }
    }
  ])

  const performance = performanceStats[0] || {
    averageScore: 0,
    totalGrades: 0,
    passCount: 0
  }

  // Attendance
  const attendanceFilter = { classId }
  if (academicYearId) attendanceFilter.academicYearId = academicYearId
  if (termId) attendanceFilter.termId = termId

  const attendanceStats = await Attendance.aggregate([
    { $match: attendanceFilter },
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 }
      }
    }
  ])

  const totalDays = attendanceStats.reduce((sum, stat) => sum + stat.count, 0)
  const presentDays = attendanceStats.find(s => s._id === 'present')?.count || 0

  res.json({
    success: true,
    data: {
      class: {
        id: classInfo._id,
        name: classInfo.name,
        grade: classInfo.grade,
        section: classInfo.section,
        capacity: classInfo.capacity,
        studentCount
      },
      academic: {
        averageScore: Math.round(performance.averageScore),
        totalGrades: performance.totalGrades,
        passRate: performance.totalGrades > 0
          ? Math.round((performance.passCount / performance.totalGrades) * 100)
          : 0
      },
      attendance: {
        totalRecords: totalDays,
        presentCount: presentDays,
        percentage: totalDays > 0 ? Math.round((presentDays / totalDays) * 100) : 0
      }
    }
  })
}))

export default router
