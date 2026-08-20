import mongoose from 'mongoose'

const reportCardSchema = new mongoose.Schema({
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true },
  academicYearId: { type: mongoose.Schema.Types.ObjectId, ref: 'AcademicYear', required: true },
  termId: { type: mongoose.Schema.Types.ObjectId, ref: 'Term', required: true },
  classId: { type: mongoose.Schema.Types.ObjectId, ref: 'Class', required: true },
  
  // Subject grades
  grades: [{
    subjectId: { type: mongoose.Schema.Types.ObjectId, ref: 'Subject' },
    subjectName: { type: String },
    score: { type: Number },
    maxScore: { type: Number, default: 100 },
    grade: { type: String }, // A, B, C, D, F
    remarks: { type: String }
  }],
  
  // Overall performance
  totalScore: { type: Number },
  averageScore: { type: Number },
  overallGrade: { type: String },
  
  // Attendance
  totalDays: { type: Number },
  presentDays: { type: Number },
  absentDays: { type: Number },
  attendancePercentage: { type: Number },
  
  // Comments
  classTeacherComment: { type: String },
  principalComment: { type: String },
  
  // Metadata
  generatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  generatedAt: { type: Date, default: Date.now },
  isPublished: { type: Boolean, default: false },
  publishedAt: { type: Date }
})

// Indexes
reportCardSchema.index({ studentId: 1, academicYearId: 1, termId: 1 })
reportCardSchema.index({ isPublished: 1 })

export default mongoose.models.ReportCard || mongoose.model('ReportCard', reportCardSchema)
