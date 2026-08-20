/**
 * Request Validation Middleware
 * Provides reusable validation rules for different entities
 */
import { body, param, query, validationResult } from 'express-validator'
import { AppError } from './errorHandler.js'

// Validation error handler
export const validate = (req, res, next) => {
  const errors = validationResult(req)
  if (!errors.isEmpty()) {
    const errorMessages = errors.array().map(err => err.msg).join(', ')
    throw new AppError(errorMessages, 400, errors.array())
  }
  next()
}

// User validation rules
export const validateRegister = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Valid email is required'),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters'),
  body('name')
    .trim()
    .isLength({ min: 2 })
    .withMessage('Name must be at least 2 characters'),
  // Self-registration must never grant admin/superadmin. Admin accounts
  // are created by existing admins through user management only.
  body('role')
    .isIn(['student', 'teacher', 'parent'])
    .withMessage('Invalid role'),
  body('phone')
    .optional({ values: 'falsy' })
    .matches(/^[+]?[0-9\s-]{9,15}$/)
    .withMessage('Valid phone number is required'),
  validate
]

export const validateLogin = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Valid email is required'),
  body('password')
    .notEmpty()
    .withMessage('Password is required'),
  validate
]

// Student validation rules
export const validateStudent = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Valid email is required'),
  body('password')
    .optional()
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters'),
  body('name')
    .trim()
    .isLength({ min: 2 })
    .withMessage('Name must be at least 2 characters'),
  body('enrollmentNumber')
    .trim()
    .notEmpty()
    .withMessage('Enrollment number is required'),
  body('grade')
    .trim()
    .notEmpty()
    .withMessage('Grade is required'),
  body('section')
    .trim()
    .notEmpty()
    .withMessage('Section is required'),
  body('rollNumber')
    .isInt({ min: 1 })
    .withMessage('Roll number must be a positive integer'),
  body('dateOfBirth')
    .isISO8601()
    .withMessage('Valid date of birth is required'),
  body('guardianName')
    .trim()
    .notEmpty()
    .withMessage('Guardian name is required'),
  body('guardianPhone')
    .trim()
    .matches(/^[0-9+\-\s()]+$/)
    .withMessage('Valid guardian phone is required'),
  body('address')
    .trim()
    .notEmpty()
    .withMessage('Address is required'),
  validate
]

export const validateUpdateStudent = [
  body('name')
    .optional()
    .trim()
    .isLength({ min: 2 })
    .withMessage('Name must be at least 2 characters'),
  body('grade')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Grade cannot be empty'),
  body('section')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Section cannot be empty'),
  body('rollNumber')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Roll number must be a positive integer'),
  body('dateOfBirth')
    .optional()
    .isISO8601()
    .withMessage('Valid date of birth is required'),
  body('guardianPhone')
    .optional()
    .trim()
    .matches(/^[0-9+\-\s()]+$/)
    .withMessage('Valid guardian phone is required'),
  body('status')
    .optional()
    .isIn(['active', 'inactive', 'graduated', 'transferred'])
    .withMessage('Invalid status'),
  validate
]

// Teacher validation rules
export const validateTeacher = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Valid email is required'),
  body('password')
    .optional()
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters'),
  body('name')
    .trim()
    .isLength({ min: 2 })
    .withMessage('Name must be at least 2 characters'),
  body('phone')
    .trim()
    .matches(/^[0-9+\-\s()]+$/)
    .withMessage('Valid phone number is required'),
  validate
]

// Parent validation rules
export const validateParent = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Valid email is required'),
  body('password')
    .optional()
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters'),
  body('name')
    .trim()
    .isLength({ min: 2 })
    .withMessage('Name must be at least 2 characters'),
  body('phone')
    .trim()
    .matches(/^[0-9+\-\s()]+$/)
    .withMessage('Valid phone number is required'),
  body('relationship')
    .optional()
    .isIn(['father', 'mother', 'guardian'])
    .withMessage('Invalid relationship'),
  validate
]

// Grade validation rules
export const validateGrade = [
  body('studentId')
    .isMongoId()
    .withMessage('Valid student ID is required'),
  body('subject')
    .trim()
    .notEmpty()
    .withMessage('Subject is required'),
  body('score')
    .isFloat({ min: 0 })
    .withMessage('Score must be a non-negative number'),
  body('maxScore')
    .optional()
    .isFloat({ min: 1 })
    .withMessage('Max score must be at least 1'),
  body('gradeType')
    .isIn(['quiz', 'midterm', 'final', 'assignment', 'overall'])
    .withMessage('Invalid grade type'),
  validate
]

// Attendance validation rules
export const validateAttendance = [
  body('date')
    .optional()
    .isISO8601()
    .withMessage('Valid date is required'),
  body('students')
    .isArray({ min: 1 })
    .withMessage('At least one student is required'),
  body('students.*.studentId')
    .isMongoId()
    .withMessage('Valid student ID is required'),
  body('students.*.status')
    .isIn(['present', 'absent', 'late', 'excused'])
    .withMessage('Invalid attendance status'),
  validate
]

// Assignment validation rules
export const validateAssignment = [
  body('title')
    .trim()
    .isLength({ min: 3 })
    .withMessage('Title must be at least 3 characters'),
  body('description')
    .trim()
    .notEmpty()
    .withMessage('Description is required'),
  body('subject')
    .trim()
    .notEmpty()
    .withMessage('Subject is required'),
  body('dueDate')
    .isISO8601()
    .withMessage('Valid due date is required')
    .custom((value) => {
      if (new Date(value) < new Date()) {
        throw new Error('Due date must be in the future')
      }
      return true
    }),
  body('maxScore')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Max score must be at least 1'),
  validate
]

// Class validation rules
export const validateClass = [
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Class name is required'),
  body('grade')
    .trim()
    .notEmpty()
    .withMessage('Grade is required'),
  body('section')
    .trim()
    .notEmpty()
    .withMessage('Section is required'),
  body('academicYearId')
    .notEmpty()
    .withMessage('Academic year is required')
    .isMongoId()
    .withMessage('Invalid academic year'),
  body('capacity')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Capacity must be at least 1'),
  validate
]

// Subject validation rules
export const validateSubject = [
  body('name')
    .trim()
    .isLength({ min: 2 })
    .withMessage('Subject name must be at least 2 characters'),
  body('code')
    .trim()
    .isLength({ min: 2 })
    .withMessage('Subject code must be at least 2 characters')
    .matches(/^[A-Z0-9]+$/)
    .withMessage('Subject code must contain only uppercase letters and numbers'),
  body('grade')
    .trim()
    .notEmpty()
    .withMessage('Grade is required'),
  body('credits')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Credits must be at least 1'),
  validate
]

// Announcement validation rules
export const validateAnnouncement = [
  body('title')
    .trim()
    .isLength({ min: 3 })
    .withMessage('Title must be at least 3 characters'),
  body('content')
    .trim()
    .isLength({ min: 10 })
    .withMessage('Content must be at least 10 characters'),
  body('targetRole')
    .optional()
    .isArray()
    .withMessage('Target role must be an array'),
  body('targetRole.*')
    .optional()
    .isIn(['all', 'student', 'teacher', 'parent', 'admin'])
    .withMessage('Invalid target role'),
  body('priority')
    .optional()
    .isIn(['low', 'medium', 'high', 'urgent'])
    .withMessage('Invalid priority'),
  validate
]

// ObjectId parameter validation
export const validateObjectId = (paramName = 'id') => [
  param(paramName)
    .isMongoId()
    .withMessage(`Invalid ${paramName}`),
  validate
]

// Query parameter validation
export const validatePagination = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),
  validate
]

export const validateDateRange = [
  query('startDate')
    .optional()
    .isISO8601()
    .withMessage('Valid start date is required'),
  query('endDate')
    .optional()
    .isISO8601()
    .withMessage('Valid end date is required')
    .custom((value, { req }) => {
      if (req.query.startDate && new Date(value) < new Date(req.query.startDate)) {
        throw new Error('End date must be after start date')
      }
      return true
    }),
  validate
]
