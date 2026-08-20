import mongoose from 'mongoose'

const attendanceSchema = new mongoose.Schema({
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true },
  classId: { type: mongoose.Schema.Types.ObjectId, ref: 'Class', default: null },
  date: { type: Date, required: true },
  status: { type: String, enum: ['present', 'absent', 'late', 'excused'], required: true },
  subject: { type: String, default: null }, // Changed from required to optional
  academicYearId: { type: mongoose.Schema.Types.ObjectId, ref: 'AcademicYear' },
  termId: { type: mongoose.Schema.Types.ObjectId, ref: 'Term' },
  markedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  remarks: { type: String, default: null },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
})

// Index for efficient queries
attendanceSchema.index({ studentId: 1, date: 1 })
attendanceSchema.index({ classId: 1, date: 1 })
attendanceSchema.index({ academicYearId: 1, termId: 1 })

export default mongoose.models.Attendance || mongoose.model('Attendance', attendanceSchema)
