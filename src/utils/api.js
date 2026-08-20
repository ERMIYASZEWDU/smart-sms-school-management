import axios from 'axios'
import { useAuthStore } from '../store/authStore'

// In development/preview, use relative /api paths so requests flow through the
// Vite dev-server proxy to the backend. In production, point VITE_API_URL at the
// deployed backend (e.g. https://smart-sms-backend.onrender.com).
const API_BASE_URL = import.meta.env.VITE_API_URL || ''

// Resolve a stored profile photo to a usable src. New uploads are stored
// as base64 data URLs; legacy values are relative /uploads/... paths that
// need the API origin prepended.
export const resolvePhotoUrl = (photo) => {
  if (!photo) return photo
  if (photo.startsWith('data:') || photo.startsWith('http')) return photo
  return `${API_BASE_URL}${photo}`
}

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  },
  timeout: 90000 // 90 second timeout (for Render cold starts)
})

// Request interceptor
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Response interceptor
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    // Handle network errors
    if (!error.response) {
      const config = error.config || {}
      const method = (config.method || 'get').toLowerCase()
      // Retry once after a short delay when the server never responded.
      // This absorbs Render free-tier cold starts (backend sleeps after
      // inactivity and takes 30-90s to wake up). Safe methods retry
      // automatically; other calls opt in with { retryOnNetwork: true }.
      if (!config.__networkRetried && (config.retryOnNetwork || ['get', 'head', 'options'].includes(method))) {
        config.__networkRetried = true
        console.warn(`Server unreachable on ${method.toUpperCase()} ${config.url || ''} - retrying once after cold-start wait`)
        return new Promise((resolve) => setTimeout(resolve, 10000)).then(() => apiClient(config))
      }

      console.error('Network error:', error.message)
      
      // Check if it's a timeout error (likely Render cold start)
      if (error.code === 'ECONNABORTED' || error.message.includes('timeout')) {
        return Promise.reject({
          message: 'Server is waking up from sleep. Please wait 60 seconds and try again.',
          type: 'timeout_error',
          hint: 'Render free tier servers sleep after inactivity and take 30-90 seconds to wake up.'
        })
      }
      
      return Promise.reject({
        message: 'Cannot connect to server. Please check your internet connection and try again.',
        type: 'network_error'
      })
    }

    const { status, data } = error.response

    // Handle authentication errors
    if (status === 401) {
      const authStore = useAuthStore.getState()
      authStore.logout()
      
      // Only redirect if not already on login page
      if (window.location.pathname !== '/login') {
        window.location.href = '/login'
      }
      
      return Promise.reject({
        message: data?.message || 'Session expired. Please login again.',
        type: 'auth_error',
        status
      })
    }

    // Handle forbidden errors
    if (status === 403) {
      return Promise.reject({
        message: data?.message || 'Access denied',
        type: 'permission_error',
        status
      })
    }

    // Handle not found errors
    if (status === 404) {
      return Promise.reject({
        message: data?.message || 'Resource not found',
        type: 'not_found',
        status,
        notRegistered: data?.notRegistered
      })
    }

    // Handle validation errors
    if (status === 400 || status === 422) {
      return Promise.reject({
        message: data?.message || 'Validation error',
        details: data?.details,
        type: 'validation_error',
        status
      })
    }

    // Handle rate limit errors
    if (status === 429) {
      return Promise.reject({
        message: data?.message || 'Too many requests. Please try again later.',
        retryAfter: data?.retryAfter,
        type: 'rate_limit',
        status
      })
    }

    // Handle server errors
    if (status >= 500) {
      return Promise.reject({
        message: data?.message || 'Server error. Please try again later.',
        type: 'server_error',
        status
      })
    }

    // Handle other errors
    return Promise.reject({
      message: data?.message || 'An error occurred',
      type: 'unknown_error',
      status
    })
  }
)

/**
 * Build a query string from params, stripping undefined/null/empty values
 * so URLSearchParams doesn't serialize them as the literal string 'undefined'.
 */
export const buildQuery = (params = {}) => {
  const clean = Object.fromEntries(
    Object.entries(params).filter(([, v]) => v != null && v !== '')
  )
  return new URLSearchParams(clean).toString()
}

export default apiClient
