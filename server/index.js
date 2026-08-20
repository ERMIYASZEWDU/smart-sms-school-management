import express from 'express'
import mongoose from 'mongoose'
import path from 'path'
import { fileURLToPath } from 'url'
import cors from 'cors'
import dotenv from 'dotenv'
import helmet from 'helmet'
import authRoutes from './routes/auth.js'
import studentRoutes from './routes/student.js'
import teacherRoutes from './routes/teacher.js'
import adminRoutes from './routes/admin.js'
import parentRoutes from './routes/parent.js'
import profileRoutes from './routes/profile.js'
import notificationsRoutes from './routes/notifications.js'
import announcementsRoutes from './routes/announcements.js'
import enrollmentRoutes from './routes/enrollment.js'
import academicYearRoutes from './routes/academicYear.js'
import termRoutes from './routes/term.js'
import promotionRoutes from './routes/promotion.js'
import transferRoutes from './routes/transfer.js'
import analyticsRoutes from './routes/analytics.js'
import reportCardRoutes from './routes/reportCard.js'
import { errorHandler } from './middleware/errorHandler.js'
import { apiLimiter } from './middleware/rateLimiter.js'

dotenv.config()

const app = express()

// Security middleware - Always enable in production, optional in development
app.use(helmet({
  contentSecurityPolicy: false, // Disable CSP to avoid breaking frontend
  crossOriginEmbedderPolicy: false
}))

// CORS configuration - Allow multiple origins
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:3000',
  'https://school-management-ebon-five.vercel.app',
  'https://smart-sms-school-management.vercel.app', // Old URL (keep for compatibility)
  process.env.CORS_ORIGIN
].filter(Boolean)

const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (mobile apps, Postman, etc.)
    if (!origin) return callback(null, true)
    
    if (allowedOrigins.indexOf(origin) !== -1 || process.env.NODE_ENV === 'development') {
      callback(null, true)
    } else {
      callback(new Error('Not allowed by CORS'))
    }
  },
  credentials: true,
  optionsSuccessStatus: 200,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}
app.use(cors(corsOptions))

// Body parsing middleware
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true, limit: '10mb' }))

// Serve static files for uploads (absolute path so it matches where legacy
// photos were written regardless of the process working directory)
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
app.use('/uploads', express.static(path.join(__dirname, '../uploads')))

// Rate limiting
app.use('/api/', apiLimiter)

// MongoDB Connection
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/school-management')
  .then(() => console.log('✅ Connected to MongoDB'))
  .catch(err => {
    console.error('❌ MongoDB connection error:', err.message)
    console.log('⚠️  Server is running but database is not connected.')
    console.log('📝 To fix this:')
    console.log('   1. Install MongoDB: https://www.mongodb.com/try/download/community')
    console.log('   2. Start MongoDB service')
    console.log('   3. OR use MongoDB Atlas (cloud): https://www.mongodb.com/cloud/atlas')
  })

// Routes - All routes now use /api prefix to match frontend expectations
app.use('/api/auth', authRoutes)
app.use('/api/profile', profileRoutes)
app.use('/api/student', studentRoutes)
app.use('/api/teacher', teacherRoutes)
app.use('/api/admin', adminRoutes)
app.use('/api/parent', parentRoutes)
app.use('/api/notifications', notificationsRoutes)
app.use('/api/announcements', announcementsRoutes)
app.use('/api/enrollment', enrollmentRoutes)
app.use('/api/academic-years', academicYearRoutes)
app.use('/api/terms', termRoutes)
app.use('/api/promotions', promotionRoutes)
app.use('/api/transfers', transferRoutes)
app.use('/api/analytics', analyticsRoutes)
app.use('/api/report-cards', reportCardRoutes)

// Root route - helpful message
app.get('/', (req, res) => {
  res.json({
    message: '🎓 School Management System API',
    status: 'Running',
    version: '1.0.0',
    endpoints: {
      auth: '/api/auth/login, /api/auth/register',
      admin: '/api/admin/*',
      teacher: '/api/teacher/*',
      student: '/api/student/*',
      parent: '/api/parent/*',
      notifications: '/api/notifications/*',
      health: '/health'
    },
    frontend: 'http://localhost:5173',
    documentation: 'See INTEGRATION_COMPLETE.md for full API documentation'
  })
})

// Health check - Enhanced with security info
app.get('/health', (req, res) => {
  const dbStatus = mongoose.connection.readyState === 1 ? 'connected' : 'disconnected'
  res.json({ 
    status: 'ok',
    database: dbStatus,
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    message: dbStatus === 'connected' 
      ? 'Backend is healthy and ready!' 
      : 'Backend is running but database is not connected'
  })
})

// API Health check with more details (for monitoring tools)
app.get('/api/health', (req, res) => {
  const health = {
    status: 'ok',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
    memory: {
      used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
      total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024)
    },
    message: 'Backend is awake and running!'
  }
  
  // Return 503 if database is not connected
  if (health.database !== 'connected') {
    return res.status(503).json({ ...health, status: 'error', message: 'Database not connected. Please check MongoDB connection.' })
  }
  
  res.json(health)
})

// Database status check (helpful for debugging)
app.get('/api/db-status', async (req, res) => {
  try {
    const dbStatus = mongoose.connection.readyState === 1 ? 'connected' : 'disconnected'
    
    if (dbStatus !== 'connected') {
      return res.status(503).json({
        status: 'error',
        database: dbStatus,
        message: 'Database not connected',
        troubleshooting: [
          'Check MONGODB_URI environment variable',
          'Verify MongoDB Atlas network access allows Render IPs',
          'Check MongoDB Atlas database user credentials'
        ]
      })
    }

    // Count users to verify database has data
    const User = mongoose.model('User')
    const userCount = await User.countDocuments()
    
    res.json({
      status: 'ok',
      database: 'connected',
      userCount,
      hasData: userCount > 0,
      message: userCount > 0 
        ? `Database is connected and has ${userCount} users` 
        : 'Database is connected but no users found. Run seed script.',
      nextStep: userCount === 0 
        ? 'Run: npm run seed on Render shell or use /api/init-db endpoint'
        : 'Database ready for use'
    })
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: 'Error checking database status',
      error: error.message
    })
  }
})

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found',
    path: req.originalUrl
  })
})

// Global error handler (must be last)
app.use(errorHandler)

const PORT = process.env.PORT || 5000
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
})
