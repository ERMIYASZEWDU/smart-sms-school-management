import React from 'react'
import { AlertCircle, XCircle, AlertTriangle, RefreshCw } from 'lucide-react'

/**
 * Error Message Component
 * Displays error messages with appropriate styling
 */
export const ErrorMessage = ({ 
  message = '', 
  type = 'error',
  onRetry = null,
  onDismiss = null,
  className = '' 
}) => {
  const config = {
    error: {
      icon: XCircle,
      bgColor: 'bg-red-50 dark:bg-red-900/20',
      borderColor: 'border-red-200 dark:border-red-800',
      textColor: 'text-red-800 dark:text-red-200',
      iconColor: 'text-red-500 dark:text-red-400'
    },
    warning: {
      icon: AlertTriangle,
      bgColor: 'bg-yellow-50 dark:bg-yellow-900/20',
      borderColor: 'border-yellow-200 dark:border-yellow-800',
      textColor: 'text-yellow-800 dark:text-yellow-200',
      iconColor: 'text-yellow-500 dark:text-yellow-400'
    },
    info: {
      icon: AlertCircle,
      bgColor: 'bg-blue-50 dark:bg-blue-900/20',
      borderColor: 'border-blue-200 dark:border-blue-800',
      textColor: 'text-blue-800 dark:text-blue-200',
      iconColor: 'text-blue-500 dark:text-blue-400'
    }
  }

  const { icon: Icon, bgColor, borderColor, textColor, iconColor } = config[type] || config.error

  return (
    <div 
      className={`${bgColor} ${borderColor} ${textColor} border rounded-lg p-4 ${className}`}
      role="alert"
    >
      <div className="flex items-start gap-3">
        <Icon className={`w-5 h-5 ${iconColor} flex-shrink-0 mt-0.5`} />
        <div className="flex-1">
          <p className="text-sm font-medium">{message}</p>
          {(onRetry || onDismiss) && (
            <div className="flex gap-2 mt-3">
              {onRetry && (
                <button
                  onClick={onRetry}
                  className="inline-flex items-center gap-1 text-sm font-medium hover:underline"
                >
                  <RefreshCw className="w-3 h-3" />
                  Try Again
                </button>
              )}
              {onDismiss && (
                <button
                  onClick={onDismiss}
                  className="text-sm font-medium hover:underline ml-auto"
                >
                  Dismiss
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

/**
 * Inline Error (for form fields)
 */
export const InlineError = ({ message, className = '' }) => {
  if (!message) return null
  
  return (
    <p className={`text-sm text-red-600 dark:text-red-400 mt-1 ${className}`}>
      {message}
    </p>
  )
}

/**
 * Error Boundary Fallback
 */
export const ErrorFallback = ({ error, resetError }) => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 p-4">
      <div className="max-w-md w-full">
        <ErrorMessage
          type="error"
          message="Something went wrong. Please refresh the page or try again."
          onRetry={resetError}
        />
        {import.meta.env.DEV && error && (
          <div className="mt-4 p-4 bg-gray-100 dark:bg-gray-800 rounded-lg">
            <p className="text-xs text-gray-600 dark:text-gray-400 font-mono">
              {error.toString()}
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
