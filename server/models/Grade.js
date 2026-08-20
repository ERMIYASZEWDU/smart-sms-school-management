import mongoose from 'mongoose'

const gradeSchema = new mongoose.Schema({
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true },
  teacherId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  classId: { type: mongoose.Schema.Types.ObjectId, ref: 'Class' },
  subject: { type: String, required: true },
  score: { type: Number, required: true },
  maxScore: { type: Number, default: 100 },
  gradeType: { type: String, enum: ['quiz', 'midterm', 'final', 'assignment', 'classwork', 'overall'], required: true },
  academicYearId: { type: mongoose.Schema.Types.ObjectId, ref: 'AcademicYear' },
  termId: { type: mongoose.Schema.Types.ObjectId, ref: 'Term' },
  remarks: { type: String },
  date: { type: Date, default: Date.now },
  createdAt: { type: Date, default: Date.now }
})

// Indexes for efficient queries
gradeSchema.index({ studentId: 1, subject: 1 })
gradeSchema.index({ studentId: 1, date: -1 })
gradeSchema.index({ teacherId: 1 })
gradeSchema.index({ gradeType: 1 })
gradeSchema.index({ academicYearId: 1, termId: 1 })

export default mongoose.models.Grade || mongoose.model('Grade', gradeSchema)
