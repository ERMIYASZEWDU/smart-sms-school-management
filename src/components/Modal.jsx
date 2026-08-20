import React, { useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X } from 'lucide-react'

export const Modal = ({ isOpen, title, children, onClose, size = 'md', footer = null }) => {
  const sizeClasses = {
    sm: 'max-w-sm',
    md: 'max-w-[700px]',
    lg: 'max-w-[850px]',
    xl: 'max-w-xl',
    '2xl': 'max-w-2xl',
    large: 'max-w-[850px]',
    '3xl': 'max-w-3xl'
  }

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [isOpen])

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop - z-index: 1050 */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[1050]"
            style={{ margin: 0 }}
          />
          
          {/* Modal Container - z-index: 1055 */}
          <div className="fixed inset-0 z-[1055] overflow-hidden flex items-center justify-center p-3 sm:p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ duration: 0.2 }}
              className={`relative w-full ${sizeClasses[size]} bg-white dark:bg-gray-800 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 flex flex-col`}
              style={{
                maxHeight: 'calc(100vh - 60px)',
                margin: '30px auto'
              }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header - Fixed at top */}
              <div className="flex justify-between items-center px-4 py-2.5 sm:px-5 sm:py-3 border-b border-gray-200 dark:border-gray-700 flex-shrink-0 bg-white dark:bg-gray-800 rounded-t-xl">
                <h2 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white truncate pr-4">
                  {title}
                </h2>
                <button
                  onClick={onClose}
                  className="flex-shrink-0 p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                  type="button"
                >
                  <X size={20} className="text-gray-500 dark:text-gray-400" />
                </button>
              </div>
              
              {/* Body - Scrollable content */}
              <div 
                className="flex-1 overflow-y-auto overflow-x-hidden px-4 py-3 sm:px-5 sm:py-3 overscroll-contain"
                style={{
                  maxHeight: 'calc(100vh - 220px)'
                }}
              >
                {children}
              </div>

              {/* Footer - Fixed at bottom (if provided) */}
              {footer && (
                <div className="flex-shrink-0 px-4 py-2.5 sm:px-5 sm:py-3 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 rounded-b-xl">
                  {footer}
                </div>
              )}
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  )
}
