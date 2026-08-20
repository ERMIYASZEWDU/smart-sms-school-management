import React from 'react'
import { 
  Inbox, 
  Search, 
  AlertCircle, 
  FileX, 
  Users, 
  BookOpen,
  ClipboardList,
  Calendar
} from 'lucide-react'

/**
 * Empty State Component
 * Displays when no data is available
 */
export const EmptyState = ({ 
  icon: Icon = Inbox,
  title = 'No data found',
  description = 'There is no data to display at the moment.',
  action = null,
  className = ''
}) => {
  return (
    <div className={`flex flex-col items-center justify-center py-12 px-4 ${className}`}>
      <div className="w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mb-4">
        <Icon className="w-8 h-8 text-gray-400 dark:text-gray-500" />
      </div>
      <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
        {title}
      </h3>
      <p className="text-sm text-gray-600 dark:text-gray-400 text-center max-w-md mb-6">
        {description}
      </p>
      {action && (
        <div>
          {action}
        </div>
      )}
    </div>
  )
}

/**
 * Predefined Empty States
 */
export const NoResultsFound = ({ searchTerm, onClear }) => (
  <EmptyState
    icon={Search}
    title="No results found"
    description={
      searchTerm 
        ? `No results found for "${searchTerm}". Try adjusting your search.`
        : 'No results found. Try adjusting your filters.'
    }
    action={
      onClear && (
        <button
          onClick={onClear}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          Clear Search
        </button>
      )
    }
  />
)

export const NoStudentsFound = ({ onCreate }) => (
  <EmptyState
    icon={Users}
    title="No students yet"
    description="Get started by adding your first student to the system."
    action={
      onCreate && (
        <button
          onClick={onCreate}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          Add First Student
        </button>
      )
    }
  />
)

export const NoTeachersFound = ({ onCreate }) => (
  <EmptyState
    icon={Users}
    title="No teachers yet"
    description="Get started by adding your first teacher to the system."
    action={
      onCreate && (
        <button
          onClick={onCreate}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          Add First Teacher
        </button>
      )
    }
  />
)

export const NoGradesFound = () => (
  <EmptyState
    icon={BookOpen}
    title="No grades yet"
    description="Grades will appear here once teachers start posting results."
  />
)

export const NoAssignmentsFound = ({ onCreate, isTeacher }) => (
  <EmptyState
    icon={ClipboardList}
    title="No assignments yet"
    description={
      isTeacher
        ? "You haven't created any assignments yet."
        : "No assignments have been posted yet."
    }
    action={
      onCreate && (
        <button
          onClick={onCreate}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          Create Assignment
        </button>
      )
    }
  />
)

export const NoAttendanceFound = () => (
  <EmptyState
    icon={Calendar}
    title="No attendance records"
    description="Attendance records will appear here once they are marked."
  />
)

export const NoDataAvailable = () => (
  <EmptyState
    icon={FileX}
    title="No data available"
    description="There is currently no data to display."
  />
)
