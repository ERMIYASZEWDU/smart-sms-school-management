/**
 * Common Components Index
 * Re-exports all common components for easy importing
 */

export { LoadingSpinner, InlineSpinner } from './LoadingSpinner'
export { 
  EmptyState, 
  NoResultsFound, 
  NoStudentsFound, 
  NoTeachersFound,
  NoGradesFound,
  NoAssignmentsFound,
  NoAttendanceFound,
  NoDataAvailable
} from './EmptyState'
export { ErrorMessage, InlineError, ErrorFallback } from './ErrorMessage'
export { ConfirmDialog, useConfirmDialog } from './ConfirmDialog'
export { Pagination, SimplePagination } from './Pagination'
export { ToastContainer, useToast, useToastStore } from './Toast'
