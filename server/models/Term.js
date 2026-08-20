import mongoose from 'mongoose'

const termSchema = new mongoose.Schema({
  name: { type: String, required: true }, // e.g., "Term 1", "Semester 1"
  academicYearId: { type: mongoose.Schema.Types.ObjectId, ref: 'AcademicYear', required: true },
  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true },
  isActive: { type: Boolean, default: false }, // Only one per academic year should be active
  termNumber: { type: Number, required: true }, // 1, 2, 3
  description: { type: String },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
})

// Compound index for academic year + term number uniqueness
termSchema.index({ academicYearId: 1, termNumber: 1 }, { unique: true })
termSchema.index({ isActive: 1 })

export default mongoose.models.Term || mongoose.model('Term', termSchema)
