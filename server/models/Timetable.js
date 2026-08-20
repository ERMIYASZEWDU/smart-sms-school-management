import mongoose from 'mongoose'

const timetableSchema = new mongoose.Schema({
  classId: { type: mongoose.Schema.Types.ObjectId, ref: 'Class', required: true },
  teacherId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  subjectId: { type: mongoose.Schema.Types.ObjectId, ref: 'Subject', required: true },
  dayOfWeek: { 
    type: String, 
    enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
    required: true 
  },
  startTime: { type: String, required: true }, // e.g., "08:00"
  endTime: { type: String, required: true }, // e.g., "09:00"
  room: { type: String, default: null },
  academicYear: { type: String, required: true },
  isActive: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
})

// Index for efficient queries
timetableSchema.index({ classId: 1, dayOfWeek: 1 })
timetableSchema.index({ teacherId: 1, dayOfWeek: 1 })

export default mongoose.models.Timetable || mongoose.model('Timetable', timetableSchema)
