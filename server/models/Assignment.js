import mongoose from 'mongoose'

const assignmentSchema = new mongoose.Schema({
  teacherId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  title: { type: String, required: true },
  description: { type: String, required: true },
  subject: { type: String, required: true },
  grade: { type: String, required: true },
  classId: { type: mongoose.Schema.Types.ObjectId, ref: 'Class', default: null },
  academicYearId: { type: mongoose.Schema.Types.ObjectId, ref: 'AcademicYear' },
  termId: { type: mongoose.Schema.Types.ObjectId, ref: 'Term' },
  dueDate: { type: Date, required: true },
  maxScore: { type: Number, default: 100 },
  attachments: [{ type: String }],
  isPublished: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
})

export default mongoose.models.Assignment || mongoose.model('Assignment', assignmentSchema)
