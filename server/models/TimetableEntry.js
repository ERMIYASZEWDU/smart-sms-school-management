import mongoose from 'mongoose'

const timetableEntrySchema = new mongoose.Schema({
  classId: { type: mongoose.Schema.Types.ObjectId, ref: 'Class', required: true },
  subjectId: { type: mongoose.Schema.Types.ObjectId, ref: 'Subject', required: true },
  teacherId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  academicYearId: { type: mongoose.Schema.Types.ObjectId, ref: 'AcademicYear', required: true },
  termId: { type: mongoose.Schema.Types.ObjectId, ref: 'Term' },
  dayOfWeek: { 
    type: String, 
    enum: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'],
    required: true 
  },
  startTime: { type: String, required: true }, // e.g., "08:00"
  endTime: { type: String, required: true }, // e.g., "09:00"
  room: { type: String },
  isActive: { type: Boolean, default: true },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
})

// Indexes for conflict detection and queries
timetableEntrySchema.index({ classId: 1, dayOfWeek: 1, startTime: 1 })
timetableEntrySchema.index({ teacherId: 1, dayOfWeek: 1, startTime: 1 })
timetableEntrySchema.index({ room: 1, dayOfWeek: 1, startTime: 1 })
timetableEntrySchema.index({ academicYearId: 1, isActive: 1 })

export default mongoose.models.TimetableEntry || mongoose.model('TimetableEntry', timetableEntrySchema)
