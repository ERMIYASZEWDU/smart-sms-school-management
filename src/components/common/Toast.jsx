import React, { useEffect } from 'react'
import { CheckCircle, XCircle, AlertCircle, Info, X } from 'lucide-react'
import { create } from 'zustand'

/**
 * Toast Store
 * Manages toast notifications globally
 */
export const useToastStore = create((set, get) => ({
  toasts: [],
  
  addToast: (toast) => {
    const id = Date.now() + Math.random()
    const newToast = {
      id,
      type: 'info',
      duration: 5000,
      ...toast
    }
    
    set((state) => ({
      toasts: [...state.toasts, newToast]
    }))
    
    // Auto-remove after duration
    if (newToast.duration > 0) {
      setTimeout(() => {
        get().removeToast(id)
      }, newToast.duration)
    }
    
    return id
  },
  
  removeToast: (id) => {
    set((state) => ({
      toasts: state.toasts.filter(toast => toast.id !== id)
    }))
  },
  
  clearAll: () => {
    set({ toasts: [] })
  }
}))

/**
 * Toast Component
 */
const Toast = ({ toast, onClose }) => {
  const config = {
    success: {
      icon: CheckCircle,
      bgColor: 'bg-green-50 dark:bg-green-900/30',
      borderColor: 'border-green-500 dark:border-green-600',
      iconColor: 'text-green-500 dark:text-green-400',
      textColor: 'text-green-900 dark:text-green-100'
    },
    error: {
      icon: XCircle,
      bgColor: 'bg-red-50 dark:bg-red-900/30',
      borderColor: 'border-red-500 dark:border-red-600',
      iconColor: 'text-red-500 dark:text-red-400',
      textColor: 'text-red-900 dark:text-red-100'
    },
    warning: {
      icon: AlertCircle,
      bgColor: 'bg-yellow-50 dark:bg-yellow-900/30',
      borderColor: 'border-yellow-500 dark:border-yellow-600',
      iconColor: 'text-yellow-500 dark:text-yellow-400',
      textColor: 'text-yellow-900 dark:text-yellow-100'
    },
    info: {
      icon: Info,
      bgColor: 'bg-blue-50 dark:bg-blue-900/30',
      borderColor: 'border-blue-500 dark:border-blue-600',
      iconColor: 'text-blue-500 dark:text-blue-400',
      textColor: 'text-blue-900 dark:text-blue-100'
    }
  }

  const { icon: Icon, bgColor, borderColor, iconColor, textColor } = config[toast.type] || config.info

  return (
    <div
      className={`${bgColor} ${textColor} ${borderColor} border-l-4 rounded-lg shadow-lg p-4 mb-3 flex items-start gap-3 min-w-[300px] max-w-md animate-in slide-in-from-right duration-300`}
      role="alert"
    >
      <Icon className={`w-5 h-5 ${iconColor} flex-shrink-0 mt-0.5`} />
      <div className="flex-1">
        {toast.title && (
          <h4 className="font-semibold mb-1">{toast.title}</h4>
        )}
        <p className="text-sm">{toast.message}</p>
      </div>
      <button
        onClick={onClose}
        className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
        aria-label="Close"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  )
}

/**
 * Toast Container
 * Renders all active toasts
 */
export const ToastContainer = () => {
  const { toasts, removeToast } = useToastStore()

  return (
    <div
      className="fixed top-4 right-4 z-50 pointer-events-none"
      aria-live="polite"
      aria-atomic="true"
    >
      <div className="pointer-events-auto">
        {toasts.map((toast) => (
          <Toast
            key={toast.id}
            toast={toast}
            onClose={() => removeToast(toast.id)}
          />
        ))}
      </div>
    </div>
  )
}

/**
 * Hook for using toasts
 */
export const useToast = () => {
  const addToast = useToastStore(state => state.addToast)
  
  return {
    success: (message, title) => addToast({ type: 'success', message, title }),
    error: (message, title) => addToast({ type: 'error', message, title }),
    warning: (message, title) => addToast({ type: 'warning', message, title }),
    info: (message, title) => addToast({ type: 'info', message, title }),
    custom: (toast) => addToast(toast)
  }
}
