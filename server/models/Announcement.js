import mongoose from 'mongoose'

const announcementSchema = new mongoose.Schema({
  title: { type: String, required: true },
  message: { type: String, required: true },
  content: { type: String, required: true }, // Full HTML/markdown content
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  
  // Targeting options
  targetRole: { 
    type: [String], 
    enum: ['all', 'student', 'teacher', 'parent', 'admin'],
    default: ['all']
  },
  targetGrade: { type: String, default: null }, // e.g., "Grade 10", "Grade 11", null = all grades
  targetSection: { type: String, default: null }, // e.g., "A", "B", null = all sections
  targetStream: { 
    type: String, 
    enum: ['Natural Science', 'Social Science', null],
    default: null 
  }, // For Grade 11-12 only
  targetClass: { type: String, default: null }, // Specific class ID or name
  
  priority: { type: String, enum: ['low', 'medium', 'high', 'urgent'], default: 'medium' },
  isPublished: { type: Boolean, default: true },
  publishDate: { type: Date, default: Date.now },
  expiryDate: { type: Date, default: null },
  attachments: [{ 
    name: String,
    url: String,
    size: Number,
    type: String
  }],
  
  // Statistics
  viewCount: { type: Number, default: 0 },
  recipientCount: { type: Number, default: 0 }, // How many users should receive this
  
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
})

// Indexes for efficient queries
announcementSchema.index({ createdBy: 1 })
announcementSchema.index({ targetRole: 1, isPublished: 1, publishDate: -1 })
announcementSchema.index({ targetGrade: 1, targetSection: 1, targetStream: 1 })
announcementSchema.index({ expiryDate: 1 })

export default mongoose.models.Announcement || mongoose.model('Announcement', announcementSchema)
