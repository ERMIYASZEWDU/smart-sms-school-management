import React from 'react'
import { Loader2 } from 'lucide-react'

/**
 * Loading Spinner Component
 * Displays a loading indicator with optional message
 */
export const LoadingSpinner = ({ 
  size = 'md', 
  message = 'Loading...', 
  fullScreen = false,
  className = '' 
}) => {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12',
    xl: 'w-16 h-16'
  }

  const content = (
    <div className={`flex flex-col items-center justify-center gap-3 ${className}`}>
      <Loader2 
        className={`${sizeClasses[size]} animate-spin text-blue-600 dark:text-blue-400`} 
      />
      {message && (
        <p className="text-sm text-gray-600 dark:text-gray-400">
          {message}
        </p>
      )}
    </div>
  )

  if (fullScreen) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm z-50">
        {content}
      </div>
    )
  }

  return content
}

/**
 * Inline Loading Spinner (for buttons, small spaces)
 */
export const InlineSpinner = ({ size = 'sm', className = '' }) => {
  const sizeClasses = {
    xs: 'w-3 h-3',
    sm: 'w-4 h-4',
    md: 'w-5 h-5'
  }

  return (
    <Loader2 
      className={`${sizeClasses[size]} animate-spin ${className}`} 
    />
  )
}
