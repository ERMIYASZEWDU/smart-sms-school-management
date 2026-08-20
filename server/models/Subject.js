import mongoose from 'mongoose'

const subjectSchema = new mongoose.Schema({
  name: { type: String, required: true }, // e.g., "Mathematics"
  code: { type: String, required: true, unique: true }, // e.g., "MATH101"
  description: { type: String, default: null },
  grade: { type: String, required: true }, // e.g., "Grade 10"
  teacherId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  credits: { type: Number, default: 1 },
  isActive: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
})

export default mongoose.models.Subject || mongoose.model('Subject', subjectSchema)
