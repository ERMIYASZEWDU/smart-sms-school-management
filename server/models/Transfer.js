import mongoose from 'mongoose'

const transferSchema = new mongoose.Schema({
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true },
  fromClassId: { type: mongoose.Schema.Types.ObjectId, ref: 'Class', required: true },
  toClassId: { type: mongoose.Schema.Types.ObjectId, ref: 'Class', required: true },
  academicYearId: { type: mongoose.Schema.Types.ObjectId, ref: 'AcademicYear', required: true },
  transferDate: { type: Date, default: Date.now },
  reason: { type: String, required: true },
  remarks: { type: String },
  transferredBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  createdAt: { type: Date, default: Date.now }
})

// Indexes
transferSchema.index({ studentId: 1, academicYearId: 1 })
transferSchema.index({ transferDate: 1 })

export default mongoose.models.Transfer || mongoose.model('Transfer', transferSchema)
