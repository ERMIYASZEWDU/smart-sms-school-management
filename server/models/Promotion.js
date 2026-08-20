import mongoose from 'mongoose'

const promotionSchema = new mongoose.Schema({
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true },
  fromClassId: { type: mongoose.Schema.Types.ObjectId, ref: 'Class', required: true },
  toClassId: { type: mongoose.Schema.Types.ObjectId, ref: 'Class', required: true },
  fromAcademicYearId: { type: mongoose.Schema.Types.ObjectId, ref: 'AcademicYear', required: true },
  toAcademicYearId: { type: mongoose.Schema.Types.ObjectId, ref: 'AcademicYear', required: true },
  promotionDate: { type: Date, default: Date.now },
  status: { 
    type: String, 
    enum: ['promoted', 'retained', 'conditional'], 
    default: 'promoted' 
  },
  remarks: { type: String },
  promotedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  createdAt: { type: Date, default: Date.now }
})

// Indexes
promotionSchema.index({ studentId: 1, fromAcademicYearId: 1 })
promotionSchema.index({ promotionDate: 1 })

export default mongoose.models.Promotion || mongoose.model('Promotion', promotionSchema)
