import mongoose from 'mongoose'

const parentSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  name: { type: String, required: true },
  studentIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Student' }],
  phone: { type: String, required: true },
  email: { type: String, required: true },
  address: { type: String, default: null },
  occupation: { type: String, default: null },
  relationship: { type: String, enum: ['father', 'mother', 'guardian'], default: 'guardian' },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
})

export default mongoose.models.Parent || mongoose.model('Parent', parentSchema)
