/**
 * Centralized Error Handling Middleware
 * Provides consistent error responses across the application
 */

class AppError extends Error {
  constructor(message, statusCode, details = null) {
    super(message)
    this.statusCode = statusCode
    this.details = details
    this.isOperational = true
    Error.captureStackTrace(this, this.constructor)
  }
}

// Error handler middleware
export const errorHandler = (err, req, res, next) => {
  let error = { ...err }
  error.message = err.message
  error.statusCode = err.statusCode || 500

  // Log error for debugging (but not sensitive info)
  console.error('❌ Error:', {
    message: err.message,
    statusCode: error.statusCode,
    path: req.path,
    method: req.method,
    ...(process.env.NODE_ENV !== 'production' && { stack: err.stack })
  })

  // Mongoose bad ObjectId
  if (err.name === 'CastError') {
    error.message = 'Resource not found'
    error.statusCode = 404
  }

  // Mongoose duplicate key
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue || {})[0]
    error.message = `${field} already exists`
    error.statusCode = 400
  }

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    const messages = Object.values(err.errors).map(e => e.message)
    error.message = messages.join(', ')
    error.statusCode = 400
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    error.message = 'Invalid token'
    error.statusCode = 401
  }

  if (err.name === 'TokenExpiredError') {
    error.message = 'Token expired'
    error.statusCode = 401
  }

  // Generic production error response (hide details)
  const response = {
    success: false,
    message: error.statusCode === 500 && process.env.NODE_ENV === 'production'
      ? 'Internal server error'
      : error.message
  }

  // Include details only in development
  if (process.env.NODE_ENV !== 'production') {
    response.details = error.details
    response.stack = err.stack
  }

  res.status(error.statusCode).json(response)
}

// Async handler wrapper to catch errors
export const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next)
}

export { AppError }
