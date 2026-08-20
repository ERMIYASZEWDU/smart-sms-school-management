import mongoose from 'mongoose'

const academicYearSchema = new mongoose.Schema({
  name: { type: String, required: true }, // e.g., "2026/2027"
  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true },
  isActive: { type: Boolean, default: false }, // Only one should be active at a time
  isArchived: { type: Boolean, default: false },
  description: { type: String },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
})

// Indexes
academicYearSchema.index({ name: 1 }, { unique: true })
academicYearSchema.index({ isActive: 1 })
academicYearSchema.index({ isArchived: 1 })

export default mongoose.models.AcademicYear || mongoose.model('AcademicYear', academicYearSchema)
