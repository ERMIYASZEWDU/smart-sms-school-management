/**
 * Rate Limiting Middleware
 * Protects API endpoints from abuse and brute force attacks
 */

// Simple in-memory rate limiter
// In production, use Redis for distributed rate limiting
const requestCounts = new Map()

/**
 * Create a rate limiter middleware
 * @param {number} windowMs - Time window in milliseconds
 * @param {number} maxRequests - Maximum requests allowed in the window
 * @param {string} message - Error message to send when limit is exceeded
 */
export const createRateLimiter = (windowMs = 15 * 60 * 1000, maxRequests = 100, message = 'Too many requests') => {
  return (req, res, next) => {
    // Get client identifier (IP + User ID if authenticated)
    const identifier = req.user?.id 
      ? `${req.ip}-${req.user.id}` 
      : req.ip || req.connection.remoteAddress
    
    const now = Date.now()
    const windowStart = now - windowMs

    // Get or create request log for this identifier
    if (!requestCounts.has(identifier)) {
      requestCounts.set(identifier, [])
    }

    const requests = requestCounts.get(identifier)
    
    // Remove old requests outside the time window
    const recentRequests = requests.filter(timestamp => timestamp > windowStart)
    
    // Check if limit exceeded
    if (recentRequests.length >= maxRequests) {
      const oldestRequest = recentRequests[0]
      const resetTime = Math.ceil((oldestRequest + windowMs - now) / 1000)
      
      return res.status(429).json({
        success: false,
        message,
        retryAfter: resetTime
      })
    }

    // Add current request
    recentRequests.push(now)
    requestCounts.set(identifier, recentRequests)

    // Set rate limit headers
    res.setHeader('X-RateLimit-Limit', maxRequests)
    res.setHeader('X-RateLimit-Remaining', maxRequests - recentRequests.length)
    res.setHeader('X-RateLimit-Reset', new Date(now + windowMs).toISOString())

    next()
  }
}

// Cleanup old entries periodically (every 10 minutes)
setInterval(() => {
  const now = Date.now()
  const maxAge = 60 * 60 * 1000 // 1 hour
  
  for (const [identifier, requests] of requestCounts.entries()) {
    const recentRequests = requests.filter(timestamp => timestamp > now - maxAge)
    
    if (recentRequests.length === 0) {
      requestCounts.delete(identifier)
    } else {
      requestCounts.set(identifier, recentRequests)
    }
  }
}, 10 * 60 * 1000)

// Predefined rate limiters for different scenarios
export const authLimiter = createRateLimiter(
  15 * 60 * 1000, // 15 minutes
  50, // 50 requests per 15 minutes (increased for development/testing)
  'Too many authentication attempts. Please try again later.'
)

export const apiLimiter = createRateLimiter(
  15 * 60 * 1000, // 15 minutes
  200, // 200 requests
  'Too many requests. Please slow down.'
)

export const strictLimiter = createRateLimiter(
  60 * 1000, // 1 minute
  15, // 15 requests per minute (increased from 10)
  'Too many requests. Please wait a moment.'
)

// Export function to manually clear rate limits (for development/admin use)
export const clearRateLimit = (identifier) => {
  if (identifier) {
    requestCounts.delete(identifier)
    return true
  }
  // Clear all if no identifier provided
  requestCounts.clear()
  return true
}
