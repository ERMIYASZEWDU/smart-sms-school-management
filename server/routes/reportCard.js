import express from 'express'
import { verifyToken, isAdmin, isTeacher, isStudent, isParent } from '../middleware/auth.js'
import { asyncHandler } from '../middleware/errorHandler.js'
import ReportCard from '../models/ReportCard.js'
import Student from '../models/Student.js'
import Parent from '../models/Parent.js'
import Grade from '../models/Grade.js'
import Attendance from '../models/Attendance.js'
import AcademicYear from '../models/AcademicYear.js'
import Term from '../models/Term.js'
import Class from '../models/Class.js'
import Subject from '../models/Subject.js'
import { logAudit } from '../middleware/auditLogger.js'

const router = express.Router()

// All routes require authentication
router.use(verifyToken)

// Helper function to calculate grade letter
const calculateGradeLetter = (score) => {
  if (score >= 90) return 'A+'
  if (score >= 85) return 'A'
  if (score >= 80) return 'B+'
  if (score >= 75) return 'B'
  if (score >= 70) return 'C+'
  if (score >= 65) return 'C'
  if (score >= 60) return 'D+'
  if (score >= 50) return 'D'
  return 'F'
}

// GET all report cards (Admin only)
router.get('/', isAdmin, asyncHandler(async (req, res) => {
  const { academicYearId, termId, classId, studentId, isPublished } = req.query

  const filter = {}
  if (academicYearId) filter.academicYearId = academicYearId
  if (termId) filter.termId = termId
  if (classId) filter.classId = classId
  if (studentId) filter.studentId = studentId
  if (isPublished !== undefined) filter.isPublished = isPublished === 'true'

  const reportCards = await ReportCard.find(filter)
    .populate('studentId', 'name enrollmentNumber grade section')
    .populate('academicYearId', 'name')
    .populate('termId', 'name')
    .populate('classId', 'name grade section')
    .populate('generatedBy', 'name')
    .sort({ generatedAt: -1 })

  res.json({
    success: true,
    count: reportCards.length,
    data: reportCards
  })
}))

// GET student report cards (Student/Parent can access their own)
router.get('/student/:studentId', asyncHandler(async (req, res) => {
  const { studentId } = req.params
  const { academicYearId, termId } = req.query

  // Authorization check
  if (req.user.role === 'student') {
    const student = await Student.findOne({ userId: req.user.id })
    if (!student || student._id.toString() !== studentId) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized: Can only view own report cards'
      })
    }
  } else if (req.user.role === 'parent') {
    const parent = await Parent.findOne({ userId: req.user.id })
    if (!parent || !parent.studentIds.some(id => id.toString() === studentId.toString())) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized: Can only view linked children report cards'
      })
    }
  } else if (req.user.role !== 'admin' && req.user.role !== 'teacher') {
    return res.status(403).json({
      success: false,
      message: 'Unauthorized'
    })
  }

  const filter = { studentId, isPublished: true }
  if (academicYearId) filter.academicYearId = academicYearId
  if (termId) filter.termId = termId

  const reportCards = await ReportCard.find(filter)
    .populate('academicYearId', 'name')
    .populate('termId', 'name')
    .populate('classId', 'name grade section')
    .sort({ generatedAt: -1 })

  res.json({
    success: true,
    count: reportCards.length,
    data: reportCards
  })
}))

// GET single report card
router.get('/:id', asyncHandler(async (req, res) => {
  const reportCard = await ReportCard.findById(req.params.id)
    .populate('studentId', 'name enrollmentNumber dateOfBirth guardianName guardianPhone address')
    .populate('academicYearId', 'name')
    .populate('termId', 'name')
    .populate('classId', 'name grade section')
    .populate('generatedBy', 'name')

  if (!reportCard) {
    return res.status(404).json({
      success: false,
      message: 'Report card not found'
    })
  }

  // Authorization check
  if (req.user.role === 'student') {
    const student = await Student.findOne({ userId: req.user.id })
    if (!student || student._id.toString() !== reportCard.studentId._id.toString()) {
      return res.status(403).json({ success: false, message: 'Unauthorized' })
    }
    if (!reportCard.isPublished) {
      return res.status(403).json({ success: false, message: 'Report card not yet published' })
    }
  } else if (req.user.role === 'parent') {
    const parent = await Parent.findOne({ userId: req.user.id })
    if (!parent || !parent.studentIds.some(id => id.toString() === reportCard.studentId._id.toString())) {
      return res.status(403).json({ success: false, message: 'Unauthorized' })
    }
    if (!reportCard.isPublished) {
      return res.status(403).json({ success: false, message: 'Report card not yet published' })
    }
  } else if (req.user.role !== 'admin' && req.user.role !== 'teacher') {
    return res.status(403).json({ success: false, message: 'Unauthorized' })
  }

  res.json({
    success: true,
    data: reportCard
  })
}))

// GENERATE report card (Admin only)
router.post('/generate', isAdmin, asyncHandler(async (req, res) => {
  const { studentId, academicYearId, termId, classTeacherComment, principalComment } = req.body

  if (!studentId || !academicYearId || !termId) {
    return res.status(400).json({
      success: false,
      message: 'Required fields: studentId, academicYearId, termId'
    })
  }

  // Verify student, academic year, term exist
  const [student, academicYear, term] = await Promise.all([
    Student.findById(studentId).populate('classId'),
    AcademicYear.findById(academicYearId),
    Term.findById(termId)
  ])

  if (!student || !academicYear || !term) {
    return res.status(404).json({
      success: false,
      message: 'Student, academic year, or term not found'
    })
  }

  if (!student.classId) {
    return res.status(400).json({
      success: false,
      message: 'Student is not assigned to a class'
    })
  }

  // Check if report card already exists
  const existing = await ReportCard.findOne({
    studentId,
    academicYearId,
    termId
  })

  if (existing) {
    return res.status(400).json({
      success: false,
      message: 'Report card already exists for this student, academic year, and term',
      data: { reportCardId: existing._id }
    })
  }

  // Get grades for this term
  const grades = await Grade.find({
    studentId,
    academicYearId,
    termId,
    gradeType: { $in: ['midterm', 'final', 'overall'] }
  }).populate('subject')

  if (grades.length === 0) {
    return res.status(400).json({
      success: false,
      message: 'No grades found for this student in the specified term'
    })
  }

  // Group grades by subject and calculate average
  const subjectGrades = {}
  grades.forEach(grade => {
    const subject = grade.subject || grade.subject
    if (!subjectGrades[subject]) {
      subjectGrades[subject] = {
        subjectName: subject,
        scores: [],
        maxScore: grade.maxScore || 100
      }
    }
    subjectGrades[subject].scores.push(grade.score)
  })

  const gradesSummary = Object.values(subjectGrades).map(sg => {
    const averageScore = sg.scores.reduce((a, b) => a + b, 0) / sg.scores.length
    return {
      subjectName: sg.subjectName,
      score: Math.round(averageScore),
      maxScore: sg.maxScore,
      grade: calculateGradeLetter(averageScore)
    }
  })

  // Calculate overall statistics
  const totalScore = gradesSummary.reduce((sum, g) => sum + g.score, 0)
  const averageScore = Math.round(totalScore / gradesSummary.length)
  const overallGrade = calculateGradeLetter(averageScore)

  // Get attendance for this term
  const attendanceRecords = await Attendance.find({
    studentId,
    academicYearId,
    termId
  })

  const totalDays = attendanceRecords.length
  const presentDays = attendanceRecords.filter(a => a.status === 'present').length
  const absentDays = attendanceRecords.filter(a => a.status === 'absent').length
  const attendancePercentage = totalDays > 0 ? Math.round((presentDays / totalDays) * 100) : 0

  // Create report card
  const reportCard = new ReportCard({
    studentId,
    academicYearId,
    termId,
    classId: student.classId._id,
    grades: gradesSummary,
    totalScore,
    averageScore,
    overallGrade,
    totalDays,
    presentDays,
    absentDays,
    attendancePercentage,
    classTeacherComment: classTeacherComment || '',
    principalComment: principalComment || '',
    generatedBy: req.user.id,
    isPublished: false
  })

  await reportCard.save()

  // Audit log
  logAudit({
    userId: req.user.id,
    userEmail: req.user.email,
    userRole: req.user.role,
    action: 'report_card_generated',
    resource: 'reportCard',
    resourceId: reportCard._id.toString(),
    details: { description: `Generated report card for ${student.name} - ${term.name}, ${academicYear.name}` },
    ipAddress: req.ip || req.connection.remoteAddress,
    userAgent: req.get('user-agent'),
    success: true
  })

  await reportCard.populate([
    { path: 'studentId', select: 'name enrollmentNumber' },
    { path: 'academicYearId', select: 'name' },
    { path: 'termId', select: 'name' },
    { path: 'classId', select: 'name grade section' }
  ])

  res.status(201).json({
    success: true,
    message: 'Report card generated successfully',
    data: reportCard
  })
}))

// BULK generate report cards for a class
router.post('/generate-bulk', isAdmin, asyncHandler(async (req, res) => {
  const { classId, academicYearId, termId } = req.body

  if (!classId || !academicYearId || !termId) {
    return res.status(400).json({
      success: false,
      message: 'Required fields: classId, academicYearId, termId'
    })
  }

  // Get all active students in the class
  const students = await Student.find({ classId, status: 'active' })

  if (students.length === 0) {
    return res.status(404).json({
      success: false,
      message: 'No students found in this class'
    })
  }

  const results = {
    generated: [],
    skipped: [],
    errors: []
  }

  for (const student of students) {
    try {
      // Check if report card already exists
      const existing = await ReportCard.findOne({
        studentId: student._id,
        academicYearId,
        termId
      })

      if (existing) {
        results.skipped.push({
          studentId: student._id,
          studentName: student.name,
          reason: 'Report card already exists'
        })
        continue
      }

      // Get grades
      const grades = await Grade.find({
        studentId: student._id,
        academicYearId,
        termId,
        gradeType: { $in: ['midterm', 'final', 'overall'] }
      })

      if (grades.length === 0) {
        results.skipped.push({
          studentId: student._id,
          studentName: student.name,
          reason: 'No grades found'
        })
        continue
      }

      // Calculate grades
      const subjectGrades = {}
      grades.forEach(grade => {
        const subject = grade.subject
        if (!subjectGrades[subject]) {
          subjectGrades[subject] = {
            subjectName: subject,
            scores: [],
            maxScore: grade.maxScore || 100
          }
        }
        subjectGrades[subject].scores.push(grade.score)
      })

      const gradesSummary = Object.values(subjectGrades).map(sg => {
        const averageScore = sg.scores.reduce((a, b) => a + b, 0) / sg.scores.length
        return {
          subjectName: sg.subjectName,
          score: Math.round(averageScore),
          maxScore: sg.maxScore,
          grade: calculateGradeLetter(averageScore)
        }
      })

      const totalScore = gradesSummary.reduce((sum, g) => sum + g.score, 0)
      const averageScore = Math.round(totalScore / gradesSummary.length)

      // Get attendance
      const attendanceRecords = await Attendance.find({
        studentId: student._id,
        academicYearId,
        termId
      })

      const totalDays = attendanceRecords.length
      const presentDays = attendanceRecords.filter(a => a.status === 'present').length
      const absentDays = attendanceRecords.filter(a => a.status === 'absent').length
      const attendancePercentage = totalDays > 0 ? Math.round((presentDays / totalDays) * 100) : 0

      // Create report card
      const reportCard = new ReportCard({
        studentId: student._id,
        academicYearId,
        termId,
        classId,
        grades: gradesSummary,
        totalScore,
        averageScore,
        overallGrade: calculateGradeLetter(averageScore),
        totalDays,
        presentDays,
        absentDays,
        attendancePercentage,
        generatedBy: req.user.id,
        isPublished: false
      })

      await reportCard.save()

      results.generated.push({
        studentId: student._id,
        studentName: student.name,
        reportCardId: reportCard._id
      })

    } catch (error) {
      results.errors.push({
        studentId: student._id,
        studentName: student.name,
        error: error.message
      })
    }
  }

  res.status(results.generated.length > 0 ? 201 : 400).json({
    success: results.generated.length > 0,
    message: `Generated ${results.generated.length} report cards`,
    data: results
  })
}))

// UPDATE report card (Admin only)
router.put('/:id', isAdmin, asyncHandler(async (req, res) => {
  const { classTeacherComment, principalComment, isPublished } = req.body

  const reportCard = await ReportCard.findById(req.params.id)

  if (!reportCard) {
    return res.status(404).json({
      success: false,
      message: 'Report card not found'
    })
  }

  if (classTeacherComment !== undefined) {
    reportCard.classTeacherComment = classTeacherComment
  }
  if (principalComment !== undefined) {
    reportCard.principalComment = principalComment
  }
  if (isPublished !== undefined && isPublished !== reportCard.isPublished) {
    reportCard.isPublished = isPublished
    if (isPublished) {
      reportCard.publishedAt = Date.now()
      
      // Audit log
      logAudit({
        userId: req.user.id,
        userEmail: req.user.email,
        userRole: req.user.role,
        action: 'report_card_published',
        resource: 'reportCard',
        resourceId: reportCard._id.toString(),
        details: { description: `Published report card ${reportCard._id}` },
        ipAddress: req.ip || req.connection.remoteAddress,
        userAgent: req.get('user-agent'),
        success: true
      })
    }
  }

  await reportCard.save()

  res.json({
    success: true,
    message: 'Report card updated successfully',
    data: reportCard
  })
}))

// PUBLISH/UNPUBLISH report card
router.patch('/:id/publish', isAdmin, asyncHandler(async (req, res) => {
  const { publish } = req.body // true or false

  const reportCard = await ReportCard.findById(req.params.id)
    .populate('studentId', 'name')

  if (!reportCard) {
    return res.status(404).json({
      success: false,
      message: 'Report card not found'
    })
  }

  reportCard.isPublished = publish
  if (publish) {
    reportCard.publishedAt = Date.now()
  }

  await reportCard.save()

  // Audit log
  logAudit({
    userId: req.user.id,
    userEmail: req.user.email,
    userRole: req.user.role,
    action: publish ? 'report_card_published' : 'report_card_unpublished',
    resource: 'reportCard',
    resourceId: reportCard._id.toString(),
    details: { description: `${publish ? 'Published' : 'Unpublished'} report card for ${reportCard.studentId.name}` },
    ipAddress: req.ip || req.connection.remoteAddress,
    userAgent: req.get('user-agent'),
    success: true
  })

  res.json({
    success: true,
    message: `Report card ${publish ? 'published' : 'unpublished'} successfully`,
    data: reportCard
  })
}))

// DELETE report card (Admin only)
router.delete('/:id', isAdmin, asyncHandler(async (req, res) => {
  const reportCard = await ReportCard.findById(req.params.id)

  if (!reportCard) {
    return res.status(404).json({
      success: false,
      message: 'Report card not found'
    })
  }

  if (reportCard.isPublished) {
    return res.status(400).json({
      success: false,
      message: 'Cannot delete published report card. Please unpublish it first.'
    })
  }

  await reportCard.deleteOne()

  res.json({
    success: true,
    message: 'Report card deleted successfully'
  })
}))

// GET report card for PDF generation (formatted data)
router.get('/:id/pdf-data', asyncHandler(async (req, res) => {
  const reportCard = await ReportCard.findById(req.params.id)
    .populate('studentId', 'name enrollmentNumber dateOfBirth guardianName guardianPhone address grade section')
    .populate('academicYearId', 'name startDate endDate')
    .populate('termId', 'name termNumber')
    .populate('classId', 'name grade section teacherId')
    .populate('generatedBy', 'name')

  if (!reportCard) {
    return res.status(404).json({
      success: false,
      message: 'Report card not found'
    })
  }

  // Authorization check
  if (req.user.role === 'student') {
    const student = await Student.findOne({ userId: req.user.id })
    if (!student || student._id.toString() !== reportCard.studentId._id.toString() || !reportCard.isPublished) {
      return res.status(403).json({ success: false, message: 'Unauthorized' })
    }
  } else if (req.user.role === 'parent') {
    const parent = await Parent.findOne({ userId: req.user.id })
    if (!parent || !parent.studentIds.some(id => id.toString() === reportCard.studentId._id.toString()) || !reportCard.isPublished) {
      return res.status(403).json({ success: false, message: 'Unauthorized' })
    }
  } else if (req.user.role !== 'admin' && req.user.role !== 'teacher') {
    return res.status(403).json({ success: false, message: 'Unauthorized' })
  }

  // Format data for PDF generation
  const pdfData = {
    schoolName: 'Smart SMS School',
    academicYear: reportCard.academicYearId.name,
    term: reportCard.termId.name,
    student: {
      name: reportCard.studentId.name,
      enrollmentNumber: reportCard.studentId.enrollmentNumber,
      class: `${reportCard.classId.grade}-${reportCard.classId.section}`,
      dateOfBirth: reportCard.studentId.dateOfBirth,
      guardianName: reportCard.studentId.guardianName
    },
    grades: reportCard.grades.map(g => ({
      subject: g.subjectName,
      score: g.score,
      maxScore: g.maxScore,
      percentage: Math.round((g.score / g.maxScore) * 100),
      grade: g.grade,
      remarks: g.remarks || ''
    })),
    summary: {
      totalScore: reportCard.totalScore,
      averageScore: reportCard.averageScore,
      overallGrade: reportCard.overallGrade,
      totalSubjects: reportCard.grades.length
    },
    attendance: {
      totalDays: reportCard.totalDays,
      presentDays: reportCard.presentDays,
      absentDays: reportCard.absentDays,
      percentage: reportCard.attendancePercentage
    },
    comments: {
      classTeacher: reportCard.classTeacherComment || '',
      principal: reportCard.principalComment || ''
    },
    generatedDate: reportCard.generatedAt,
    publishedDate: reportCard.publishedAt
  }

  res.json({
    success: true,
    data: pdfData
  })
}))

export default router
