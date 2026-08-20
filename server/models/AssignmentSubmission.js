import mongoose from 'mongoose'

const assignmentSubmissionSchema = new mongoose.Schema({
  assignmentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Assignment', required: true },
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true },
  submittedAt: { type: Date, default: Date.now },
  content: { type: String, default: null },
  attachments: [{ type: String }],
  status: { 
    type: String, 
    enum: ['submitted', 'late', 'graded', 'resubmit'], 
    default: 'submitted' 
  },
  score: { type: Number, default: null },
  feedback: { type: String, default: null },
  gradedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  gradedAt: { type: Date, default: null },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
})

// Index for efficient queries
assignmentSubmissionSchema.index({ assignmentId: 1, studentId: 1 }, { unique: true })

export default mongoose.models.AssignmentSubmission || mongoose.model('AssignmentSubmission', assignmentSubmissionSchema)
