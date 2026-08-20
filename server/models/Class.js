import mongoose from 'mongoose'

const classSchema = new mongoose.Schema({
  name: { type: String, required: true }, // e.g., "Grade 10-A" or "Grade 11 Natural Science-A"
  grade: { type: String, required: true }, // e.g., "Grade 10" or "Grade 11"
  section: { type: String, required: true }, // e.g., "A"
  stream: { 
    type: String, 
    enum: ['Natural Science', 'Social Science', null], 
    default: null 
  }, // For Grade 11-12 only
  teacherId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // Class teacher
  capacity: { type: Number, default: 40 },
  room: { type: String, default: null },
  
  // UPDATED: Changed from String to ObjectId reference
  academicYearId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'AcademicYear', 
    required: true,
    index: true
  },
  
  // Legacy field for backward compatibility (deprecated, will be removed after migration)
  academicYear: { type: String, default: null }, // e.g., "2025-2026" - DEPRECATED
  
  isActive: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
})

// Compound index for grade + section + stream + academicYearId uniqueness
classSchema.index({ grade: 1, section: 1, stream: 1, academicYearId: 1 }, { unique: true })

// Index for academic year queries
classSchema.index({ academicYearId: 1, isActive: 1 })

// Index for teacher assignment queries
classSchema.index({ teacherId: 1 })

export default mongoose.models.Class || mongoose.model('Class', classSchema)
