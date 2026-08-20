import mongoose from 'mongoose'

const teacherSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  name: { type: String, required: true },
  employeeId: { type: String, unique: true, required: true },
  phone: { type: String, required: true },
  email: { type: String, required: true },
  department: { type: String, default: null },
  qualification: { type: String, default: null },
  assignedClassIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Class' }],
  assignedSubjectIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Subject' }],
  joiningDate: { type: Date, default: Date.now },
  status: { type: String, enum: ['active', 'inactive', 'on_leave'], default: 'active' },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
})

export default mongoose.models.Teacher || mongoose.model('Teacher', teacherSchema)
