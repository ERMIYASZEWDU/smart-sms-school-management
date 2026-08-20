import mongoose from 'mongoose'

const enrollmentSchema = new mongoose.Schema({
  studentId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Student', 
    required: true,
    index: true 
  },
  classId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Class', 
    required: true,
    index: true 
  },
  academicYearId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'AcademicYear', 
    required: true,
    index: true 
  },
  
  // Denormalized fields for faster queries (cached from Class)
  grade: { type: String, required: true }, // e.g., "Grade 10"
  section: { type: String, required: true }, // e.g., "A"
  stream: { 
    type: String, 
    enum: ['Natural Science', 'Social Science', null], 
    default: null 
  }, // Only for Grade 11-12
  
  // Enrollment metadata
  enrollmentDate: { type: Date, default: Date.now },
  enrollmentNumber: { type: String, unique: true, sparse: true }, // Optional unique identifier
  rollNumber: { type: Number, required: true }, // Roll number in class
  
  // Status workflow
  status: { 
    type: String, 
    enum: ['active', 'promoted', 'transferred', 'graduated', 'withdrawn', 'suspended', 'completed'],
    default: 'active',
    index: true
  },
  
  // Status change tracking
  statusChangeDate: { type: Date, default: null },
  statusChangeReason: { type: String, default: null },
  statusChangedBy: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    default: null 
  },
  
  // Promotion tracking
  promotedTo: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Enrollment', 
    default: null 
  }, // Next enrollment after promotion
  promotedFrom: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Enrollment', 
    default: null 
  }, // Previous enrollment
  
  // Transfer tracking
  transferredTo: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Enrollment', 
    default: null 
  },
  transferredFrom: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Enrollment', 
    default: null 
  },
  
  // Administrative fields
  enrolledBy: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  }, // Admin who enrolled the student
  remarks: { type: String, default: null },
  
  // Timestamps
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
})

// ============================================================
// INDEXES FOR PERFORMANCE
// ============================================================

// Compound index: Prevent duplicate active enrollment in same academic year
enrollmentSchema.index(
  { studentId: 1, academicYearId: 1, status: 1 }, 
  { 
    unique: true,
    partialFilterExpression: { status: 'active' }
  }
)

// Compound index: Find all students in a class for a specific academic year
enrollmentSchema.index({ classId: 1, academicYearId: 1, status: 1 })

// Compound index: Filter students by grade, section, stream, academic year
enrollmentSchema.index({ grade: 1, section: 1, stream: 1, academicYearId: 1 })

// Index for enrollment history queries
enrollmentSchema.index({ studentId: 1, createdAt: -1 })

// Index for status queries
enrollmentSchema.index({ status: 1, academicYearId: 1 })

// ============================================================
// METHODS
// ============================================================

// Update enrollment status
enrollmentSchema.methods.updateStatus = async function(newStatus, reason, changedBy) {
  this.status = newStatus
  this.statusChangeDate = new Date()
  this.statusChangeReason = reason
  this.statusChangedBy = changedBy
  this.updatedAt = new Date()
  return await this.save()
}

// Link to next enrollment (promotion/transfer)
enrollmentSchema.methods.linkToNext = async function(nextEnrollmentId, type = 'promotion') {
  if (type === 'promotion') {
    this.promotedTo = nextEnrollmentId
    this.status = 'promoted'
  } else if (type === 'transfer') {
    this.transferredTo = nextEnrollmentId
    this.status = 'transferred'
  }
  this.statusChangeDate = new Date()
  this.updatedAt = new Date()
  return await this.save()
}

// ============================================================
// STATIC METHODS
// ============================================================

// Get current active enrollment for a student
enrollmentSchema.statics.getCurrentEnrollment = async function(studentId, academicYearId = null) {
  const query = { 
    studentId, 
    status: 'active' 
  }
  
  if (academicYearId) {
    query.academicYearId = academicYearId
  }
  
  return await this.findOne(query)
    .populate('classId')
    .populate('academicYearId')
    .sort({ createdAt: -1 })
}

// Get enrollment history for a student
enrollmentSchema.statics.getEnrollmentHistory = async function(studentId) {
  return await this.find({ studentId })
    .populate('classId')
    .populate('academicYearId')
    .populate('enrolledBy', 'name email')
    .populate('statusChangedBy', 'name email')
    .sort({ createdAt: -1 })
}

// Get all students enrolled in a class for a specific academic year
enrollmentSchema.statics.getClassStudents = async function(classId, academicYearId, status = 'active') {
  return await this.find({ 
    classId, 
    academicYearId,
    status 
  })
    .populate('studentId')
    .sort({ rollNumber: 1 })
}

// Check if student is already enrolled in academic year
enrollmentSchema.statics.isEnrolled = async function(studentId, academicYearId) {
  const enrollment = await this.findOne({ 
    studentId, 
    academicYearId,
    status: 'active'
  })
  return !!enrollment
}

// Count students enrolled in a class
enrollmentSchema.statics.countClassStudents = async function(classId, academicYearId, status = 'active') {
  return await this.countDocuments({ 
    classId, 
    academicYearId,
    status 
  })
}

// Get students by grade/section/stream for academic year (for filtering)
enrollmentSchema.statics.getStudentsByClass = async function(filters) {
  const query = { status: 'active' }
  
  if (filters.academicYearId) query.academicYearId = filters.academicYearId
  if (filters.grade) query.grade = filters.grade
  if (filters.section) query.section = filters.section
  if (filters.stream) query.stream = filters.stream
  
  return await this.find(query)
    .populate('studentId')
    .populate('classId')
    .populate('academicYearId')
    .sort({ grade: 1, section: 1, rollNumber: 1 })
}

// ============================================================
// PRE-SAVE HOOKS
// ============================================================

enrollmentSchema.pre('save', function(next) {
  this.updatedAt = new Date()
  next()
})

// ============================================================
// VALIDATION
// ============================================================

// Validate stream is only set for Grade 11-12
enrollmentSchema.pre('save', function(next) {
  const gradeNumber = parseInt(this.grade.replace('Grade ', ''))
  
  if (gradeNumber >= 11 && gradeNumber <= 12) {
    // Grade 11-12 must have a stream
    if (!this.stream) {
      return next(new Error('Stream is required for Grade 11 and 12'))
    }
  } else {
    // Grade 1-10 must NOT have a stream
    if (this.stream) {
      this.stream = null
    }
  }
  
  next()
})

export default mongoose.models.Enrollment || mongoose.model('Enrollment', enrollmentSchema)
