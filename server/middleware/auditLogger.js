/**
 * Audit Logging Middleware
 * Tracks important actions for security and compliance
 */

import mongoose from 'mongoose'

// Audit Log Schema
const auditLogSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  userEmail: { type: String, required: true },
  userRole: { type: String, required: true },
  action: { type: String, required: true }, // CREATE, UPDATE, DELETE, VIEW, LOGIN, LOGOUT
  resource: { type: String, required: true }, // student, teacher, attendance, grade, etc.
  resourceId: { type: String, default: null }, // ID of the affected resource
  details: { type: Object, default: {} }, // Additional context
  ipAddress: { type: String, required: true },
  userAgent: { type: String, default: null },
  timestamp: { type: Date, default: Date.now },
  success: { type: Boolean, default: true }
})

// Index for efficient queries
auditLogSchema.index({ userId: 1, timestamp: -1 })
auditLogSchema.index({ resource: 1, action: 1, timestamp: -1 })
auditLogSchema.index({ timestamp: -1 })

const AuditLog = mongoose.model('AuditLog', auditLogSchema)

/**
 * Log an audit event
 */
export const logAudit = async (data) => {
  try {
    const auditLog = new AuditLog(data)
    await auditLog.save()
  } catch (err) {
    console.error('❌ Failed to save audit log:', err.message)
    // Don't throw - audit logging should not break the application
  }
}

/**
 * Middleware to automatically log certain actions
 */
export const auditMiddleware = (action, resource) => {
  return async (req, res, next) => {
    // Store original send function
    const originalSend = res.send

    // Override send to capture response
    res.send = function(data) {
      // Log audit after successful operation
      if (res.statusCode >= 200 && res.statusCode < 400 && req.user) {
        logAudit({
          userId: req.user.id,
          userEmail: req.user.email,
          userRole: req.user.role,
          action,
          resource,
          resourceId: req.params.id || req.params.studentId || req.params.teacherId || req.body.id || null,
          details: {
            method: req.method,
            path: req.path,
            query: req.query,
            body: sanitizeBody(req.body) // Remove sensitive data
          },
          ipAddress: req.ip || req.connection.remoteAddress,
          userAgent: req.get('user-agent'),
          success: true
        })
      }

      // Call original send
      originalSend.call(this, data)
    }

    next()
  }
}

/**
 * Remove sensitive data from logged body
 */
const sanitizeBody = (body) => {
  if (!body) return {}
  
  const sanitized = { ...body }
  
  // Remove sensitive fields
  delete sanitized.password
  delete sanitized.token
  delete sanitized.jwt
  delete sanitized.secret
  
  return sanitized
}

/**
 * Middleware to log authentication events
 */
export const logAuthEvent = async (req, res, next) => {
  const originalJson = res.json

  res.json = function(data) {
    // Log login attempts
    if (req.path === '/login') {
      const success = res.statusCode === 200
      logAudit({
        userId: data.user?.id || 'unknown',
        userEmail: req.body.email || 'unknown',
        userRole: data.user?.role || 'unknown',
        action: success ? 'LOGIN_SUCCESS' : 'LOGIN_FAILED',
        resource: 'auth',
        resourceId: null,
        details: {
          method: req.method,
          path: req.path
        },
        ipAddress: req.ip || req.connection.remoteAddress,
        userAgent: req.get('user-agent'),
        success
      })
    }

    originalJson.call(this, data)
  }

  next()
}

/**
 * Get recent audit logs (for admin dashboard)
 */
export const getRecentAuditLogs = async (filters = {}, limit = 50) => {
  try {
    const query = {}
    
    if (filters.userId) query.userId = filters.userId
    if (filters.resource) query.resource = filters.resource
    if (filters.action) query.action = filters.action
    if (filters.startDate) query.timestamp = { $gte: new Date(filters.startDate) }
    if (filters.endDate) {
      query.timestamp = { ...query.timestamp, $lte: new Date(filters.endDate) }
    }

    const logs = await AuditLog
      .find(query)
      .sort({ timestamp: -1 })
      .limit(limit)
      .populate('userId', 'name email role')
      .lean()

    return logs
  } catch (err) {
    console.error('❌ Failed to fetch audit logs:', err.message)
    return []
  }
}

export default AuditLog
