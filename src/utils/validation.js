/**
 * Frontend Form Validation Utilities
 * Provides client-side validation before sending to server
 */

/**
 * Validation rules
 */
export const rules = {
  required: (value) => {
    if (value === null || value === undefined || value === '') {
      return 'This field is required'
    }
    return null
  },

  email: (value) => {
    if (!value) return null
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(value) ? null : 'Invalid email address'
  },

  phone: (value) => {
    if (!value) return null
    const phoneRegex = /^[0-9+\-\s()]+$/
    return phoneRegex.test(value) ? null : 'Invalid phone number'
  },

  minLength: (min) => (value) => {
    if (!value) return null
    return value.length >= min ? null : `Must be at least ${min} characters`
  },

  maxLength: (max) => (value) => {
    if (!value) return null
    return value.length <= max ? null : `Must be at most ${max} characters`
  },

  minValue: (min) => (value) => {
    if (value === null || value === undefined || value === '') return null
    return Number(value) >= min ? null : `Must be at least ${min}`
  },

  maxValue: (max) => (value) => {
    if (value === null || value === undefined || value === '') return null
    return Number(value) <= max ? null : `Must be at most ${max}`
  },

  integer: (value) => {
    if (value === null || value === undefined || value === '') return null
    return Number.isInteger(Number(value)) ? null : 'Must be a whole number'
  },

  number: (value) => {
    if (value === null || value === undefined || value === '') return null
    return !isNaN(Number(value)) ? null : 'Must be a number'
  },

  date: (value) => {
    if (!value) return null
    const date = new Date(value)
    return !isNaN(date.getTime()) ? null : 'Invalid date'
  },

  futureDate: (value) => {
    if (!value) return null
    const date = new Date(value)
    return date > new Date() ? null : 'Date must be in the future'
  },

  pastDate: (value) => {
    if (!value) return null
    const date = new Date(value)
    return date < new Date() ? null : 'Date must be in the past'
  },

  match: (fieldName, fieldValue) => (value) => {
    return value === fieldValue ? null : `Must match ${fieldName}`
  },

  pattern: (regex, message) => (value) => {
    if (!value) return null
    return regex.test(value) ? null : message || 'Invalid format'
  }
}

/**
 * Validate a single field
 */
export const validateField = (value, validationRules) => {
  if (!Array.isArray(validationRules)) {
    validationRules = [validationRules]
  }

  for (const rule of validationRules) {
    const error = rule(value)
    if (error) {
      return error
    }
  }

  return null
}

/**
 * Validate entire form
 */
export const validateForm = (formData, validationSchema) => {
  const errors = {}
  let isValid = true

  for (const [field, fieldRules] of Object.entries(validationSchema)) {
    const error = validateField(formData[field], fieldRules)
    if (error) {
      errors[field] = error
      isValid = false
    }
  }

  return { isValid, errors }
}

/**
 * Predefined validation schemas
 */
export const schemas = {
  student: {
    email: [rules.required, rules.email],
    password: [rules.required, rules.minLength(6)],
    name: [rules.required, rules.minLength(2)],
    enrollmentNumber: [rules.required],
    grade: [rules.required],
    section: [rules.required],
    rollNumber: [rules.required, rules.integer, rules.minValue(1)],
    dateOfBirth: [rules.required, rules.date, rules.pastDate],
    guardianName: [rules.required],
    guardianPhone: [rules.required, rules.phone],
    address: [rules.required]
  },

  teacher: {
    email: [rules.required, rules.email],
    password: [rules.required, rules.minLength(6)],
    name: [rules.required, rules.minLength(2)],
    phone: [rules.required, rules.phone]
  },

  parent: {
    email: [rules.required, rules.email],
    password: [rules.required, rules.minLength(6)],
    name: [rules.required, rules.minLength(2)],
    phone: [rules.required, rules.phone]
  },

  grade: {
    studentId: [rules.required],
    subject: [rules.required],
    score: [rules.required, rules.number, rules.minValue(0)],
    gradeType: [rules.required]
  },

  assignment: {
    title: [rules.required, rules.minLength(3)],
    description: [rules.required],
    subject: [rules.required],
    dueDate: [rules.required, rules.date, rules.futureDate]
  },

  class: {
    name: [rules.required],
    grade: [rules.required],
    section: [rules.required],
    academicYear: [rules.required, rules.pattern(/^\d{4}-\d{4}$/, 'Must be in format YYYY-YYYY')]
  },

  subject: {
    name: [rules.required, rules.minLength(2)],
    code: [rules.required, rules.pattern(/^[A-Z0-9]+$/, 'Must contain only uppercase letters and numbers')],
    grade: [rules.required]
  },

  login: {
    email: [rules.required, rules.email],
    password: [rules.required]
  },

  register: {
    email: [rules.required, rules.email],
    password: [rules.required, rules.minLength(6)],
    name: [rules.required, rules.minLength(2)],
    role: [rules.required]
  }
}

/**
 * Sanitize input (remove dangerous characters)
 */
export const sanitizeInput = (input) => {
  if (typeof input !== 'string') return input
  
  // Remove potential XSS characters
  return input
    .replace(/[<>]/g, '')
    .trim()
}

/**
 * Sanitize form data
 */
export const sanitizeFormData = (formData) => {
  const sanitized = {}
  
  for (const [key, value] of Object.entries(formData)) {
    if (typeof value === 'string') {
      sanitized[key] = sanitizeInput(value)
    } else {
      sanitized[key] = value
    }
  }
  
  return sanitized
}
