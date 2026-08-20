/**
 * Shared test utilities
 * - Spins up an in-memory MongoDB for each test suite
 * - Provides factories for creating test data (users, students, parents, teachers)
 * - Builds a testable Express app instance
 */
import mongoose from 'mongoose'
import { MongoMemoryServer } from 'mongodb-memory-server'
import express from 'express'
import cors from 'cors'

let mongod = null

/**
 * Start in-memory MongoDB before all tests
 */
export async function setupDb() {
  mongod = await MongoMemoryServer.create()
  const uri = mongod.getUri()
  await mongoose.connect(uri)
  return uri
}

/**
 * Drop database and disconnect after all tests
 */
export async function teardownDb() {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.connection.dropDatabase()
    await mongoose.disconnect()
  }
  if (mongod) {
    await mongod.stop()
    mongod = null
  }
}

/**
 * Clear all collections AND rate limiter state between tests
 */
export async function clearDb() {
  const collections = mongoose.connection.collections
  for (const key in collections) {
    await collections[key].deleteMany({})
  }
  // Clear in-memory rate limiter so tests don't accumulate limits
  const { clearRateLimit } = await import('../middleware/rateLimiter.js')
  clearRateLimit()
}

// ─── Model imports ────────────────────────────────────────────────────────────
import User from '../models/User.js'
import Student from '../models/Student.js'
import Parent from '../models/Parent.js'
import Teacher from '../models/Teacher.js'
import Notification from '../models/Notification.js'

// ─── Factories ────────────────────────────────────────────────────────────────

/**
 * Create a User document (password is hashed by pre-save hook)
 */
export async function createUser(overrides = {}) {
  const data = {
    email: `test-${Date.now()}-${Math.random().toString(36).slice(2, 8)}@example.com`,
    password: 'password123',
    name: 'Test User',
    role: 'student',
    ...overrides,
  }
  return User.create(data)
}

/**
 * Create a Student linked to a User
 */
export async function createStudent(overrides = {}) {
  const user = overrides.userId
    ? null
    : await createUser({ role: 'student', name: overrides.name || 'Test Student' })

  const data = {
    userId: user?._id,
    name: user?.name || 'Test Student',
    enrollmentNumber: `STU-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    grade: 'Grade 10',
    section: 'A',
    stream: null,
    rollNumber: 1,
    dateOfBirth: new Date('2010-01-01'),
    guardianName: 'Guardian',
    guardianPhone: '+251911111111',
    address: '123 Test St',
    status: 'active',
    ...overrides,
  }
  if (!data.userId && user) data.userId = user._id
  const student = await Student.create(data)
  return { user, student }
}

/**
 * Create a Parent linked to a User and optionally to students
 */
export async function createParent(studentIds = [], overrides = {}) {
  const user = overrides.userId
    ? null
    : await createUser({ role: 'parent', name: overrides.name || 'Test Parent' })

  const data = {
    userId: user?._id,
    name: user?.name || 'Test Parent',
    studentIds: studentIds,
    phone: '+251922222222',
    email: `parent-${Date.now()}-${Math.random().toString(36).slice(2, 8)}@example.com`,
    ...overrides,
  }
  if (!data.userId && user) data.userId = user._id
  const parent = await Parent.create(data)
  return { user, parent }
}

/**
 * Create a Teacher linked to a User
 */
export async function createTeacher(overrides = {}) {
  const user = overrides.userId
    ? null
    : await createUser({ role: 'teacher', name: overrides.name || 'Test Teacher' })

  const data = {
    userId: user?._id,
    name: user?.name || 'Test Teacher',
    employeeId: `TCH-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    phone: '+251933333333',
    email: `teacher-${Date.now()}-${Math.random().toString(36).slice(2, 8)}@example.com`,
    status: 'active',
    ...overrides,
  }
  if (!data.userId && user) data.userId = user._id
  const teacher = await Teacher.create(data)
  return { user, teacher }
}

// ─── Express app builder for route testing ─────────────────────────────────────

/**
 * Build a testable Express app that mounts the auth routes
 * (and any other routes you need to test).
 */
export async function buildTestApp() {
  const app = express()
  app.use(express.json())
  app.use(cors())

  // Set env vars the server expects
  process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-secret-key'
  process.env.NODE_ENV = 'test'

  // Import and mount auth routes
  const { default: authRoutes } = await import('../routes/auth.js')
  app.use('/api/auth', authRoutes)

  // Import and mount admin routes
  const { default: adminRoutes } = await import('../routes/admin.js')
  app.use('/api/admin', adminRoutes)

  // Import and mount teacher routes
  const { default: teacherRoutes } = await import('../routes/teacher.js')
  app.use('/api/teacher', teacherRoutes)

  // Import and mount announcements routes
  const { default: announcementRoutes } = await import('../routes/announcements.js')
  app.use('/api/announcements', announcementRoutes)

  // Import and mount notification routes
  const { default: notificationRoutes } = await import('../routes/notification.js')
  app.use('/api/notifications', notificationRoutes)

  // Error handler
  const { errorHandler } = await import('../middleware/errorHandler.js')
  app.use(errorHandler)

  return app
}
