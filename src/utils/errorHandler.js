/**
 * Frontend Error Handling Utilities
 * Provides consistent error handling and user feedback
 */

/**
 * Extract user-friendly error message from API error
 */
export const getErrorMessage = (error) => {
  // Handle our custom error format from api.js interceptor
  if (error?.message) {
    return error.message
  }

  // Handle axios error format
  if (error?.response?.data?.message) {
    return error.response.data.message
  }

  // Handle network errors
  if (error?.message === 'Network Error') {
    return 'Network error. Please check your connection.'
  }

  // Handle timeout errors
  if (error?.code === 'ECONNABORTED') {
    return 'Request timeout. Please try again.'
  }

  // Default error message
  return 'An unexpected error occurred. Please try again.'
}

/**
 * Get validation error details
 */
export const getValidationErrors = (error) => {
  if (error?.details && Array.isArray(error.details)) {
    return error.details.reduce((acc, err) => {
      acc[err.param || err.path] = err.msg
      return acc
    }, {})
  }
  return null
}

/**
 * Check if error is a specific type
 */
export const isErrorType = (error, type) => {
  return error?.type === type
}

/**
 * Handle API error with toast notification
 * (Assumes you have a toast notification system)
 */
export const handleApiError = (error, showToast) => {
  const message = getErrorMessage(error)
  
  if (showToast) {
    const type = isErrorType(error, 'auth_error') ? 'error' :
                 isErrorType(error, 'validation_error') ? 'warning' :
                 'error'
    
    showToast(message, type)
  }
  
  return message
}

/**
 * Log error for debugging (only in development)
 */
export const logError = (error, context = '') => {
  if (import.meta.env.DEV) {
    console.error(`Error${context ? ` in ${context}` : ''}:`, error)
  }
}
