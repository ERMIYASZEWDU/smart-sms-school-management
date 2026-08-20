import mongoose from 'mongoose'
import bcrypt from 'bcryptjs'

const userSchema = new mongoose.Schema({
  email: { type: String, required: true, lowercase: true, trim: true },
  password: { type: String, required: true },
  name: { type: String, required: true },
  role: { type: String, enum: ['student', 'teacher', 'parent', 'admin', 'superadmin'], required: true },
  profilePhoto: { type: String, default: null },
  phone: { type: String, default: null },
  phoneNormalized: { type: String, default: null }, // +251XXXXXXXXX format
  isEmailVerified: { type: Boolean, default: false },
  status: { type: String, enum: ['active', 'inactive'], default: 'active' },
  // OTP fields for password reset
  otpHash: { type: String, default: null },
  otpExpiresAt: { type: Date, default: null },
  otpAttempts: { type: Number, default: 0 },
  otpLastSentAt: { type: Date, default: null },
  resetToken: { type: String, default: null },
  resetTokenExpiresAt: { type: Date, default: null },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
})

userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next()
  const salt = await bcrypt.genSalt(10)
  this.password = await bcrypt.hash(this.password, salt)
  next()
})

userSchema.methods.comparePassword = async function(password) {
  return await bcrypt.compare(password, this.password)
}

// Indexes for efficient queries
userSchema.index({ email: 1 }, { unique: true })
userSchema.index({ role: 1 })
userSchema.index({ phoneNormalized: 1 })

export default mongoose.models.User || mongoose.model('User', userSchema)
