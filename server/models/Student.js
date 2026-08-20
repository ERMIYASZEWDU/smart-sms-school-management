import mongoose from 'mongoose'

const studentSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  name: { type: String, required: true },
  enrollmentNumber: { type: String, required: true },
  
  // UPDATED: Added current enrollment reference
  currentEnrollmentId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Enrollment', 
    default: null
  },
  
  // Cache fields for backward compatibility (automatically synced from current enrollment)
  classId: { type: mongoose.Schema.Types.ObjectId, ref: 'Class', default: null },
  grade: { type: String, required: true },
  section: { type: String, required: true },
  stream: { 
    type: String, 
    enum: ['Natural Science', 'Social Science', null], 
    default: null 
  }, // For Grade 11-12
  rollNumber: { type: Number, required: true },
  
  // Student personal information
  dateOfBirth: { type: Date, required: true },
  guardianName: { type: String, required: true },
  guardianPhone: { type: String, required: true },
  parentIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Parent' }],
  address: { type: String, required: true },
  photo: { type: String, default: null }, // base64 data URL (stored in MongoDB, survives redeploys)
  
  // Academic metrics
  gpa: { type: Number, default: 0 },
  attendance: { type: Number, default: 100 },
  
  // Status
  status: { 
    type: String, 
    enum: ['active', 'inactive', 'graduated', 'transferred'], 
    default: 'active' 
  },
  
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
})

// Indexes for efficient queries
studentSchema.index({ userId: 1 })
studentSchema.index({ classId: 1 })
studentSchema.index({ enrollmentNumber: 1 }, { unique: true })
studentSchema.index({ grade: 1, section: 1 })
studentSchema.index({ status: 1 })
studentSchema.index({ currentEnrollmentId: 1 })

export default mongoose.models.Student || mongoose.model('Student', studentSchema)
