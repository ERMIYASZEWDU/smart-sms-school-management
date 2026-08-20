import mongoose from 'mongoose'

const auditLogSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  action: { 
    type: String, 
    required: true,
    enum: [
      'student_created', 'student_updated', 'student_promoted', 'student_transferred',
      'teacher_created', 'teacher_updated', 'teacher_assigned',
      'attendance_marked', 'attendance_updated',
      'grade_created', 'grade_updated',
      'fee_created', 'payment_recorded',
      'report_card_generated', 'report_card_published',
      'academic_year_created', 'term_created',
      'class_created', 'class_updated',
      'announcement_created', 'assignment_created',
      'other'
    ]
  },
  entityType: { type: String }, // 'Student', 'Teacher', 'Fee', etc.
  entityId: { type: mongoose.Schema.Types.ObjectId },
  description: { type: String, required: true },
  ipAddress: { type: String },
  userAgent: { type: String },
  metadata: { type: mongoose.Schema.Types.Mixed }, // Additional context
  timestamp: { type: Date, default: Date.now }
})

// Indexes
auditLogSchema.index({ userId: 1, timestamp: -1 })
auditLogSchema.index({ action: 1, timestamp: -1 })
auditLogSchema.index({ entityType: 1, entityId: 1 })

export default mongoose.models.AuditLog || mongoose.model('AuditLog', auditLogSchema)
