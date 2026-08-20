import React from 'react'
import { motion } from 'framer-motion'

export const GenericPage = ({ title, subtitle, icon: Icon }) => {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4 sm:p-6 pt-6 sm:pt-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-7xl mx-auto"
      >
        <div className="mb-6 sm:mb-8">
          <div className="flex items-center gap-3 sm:gap-4">
            {Icon && (
              <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-xl bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center shrink-0">
                <Icon size={24} className="text-blue-600 dark:text-blue-400" />
              </div>
            )}
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 dark:text-white">{title}</h1>
              <p className="text-gray-600 dark:text-gray-400 mt-1 text-sm sm:text-base">{subtitle}</p>
            </div>
          </div>
        </div>

        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.15 }}
          className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-8 sm:p-12 text-center"
        >
          {Icon && (
            <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
              <Icon size={32} className="text-blue-600 dark:text-blue-400" />
            </div>
          )}
          <h2 className="text-xl sm:text-2xl font-bold text-gray-800 dark:text-white mb-2">{title}</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6 text-sm sm:text-base">{subtitle}</p>
          <p className="text-gray-500 dark:text-gray-500 text-sm">This page is coming soon. Please check back later.</p>
        </motion.div>
      </motion.div>
    </div>
  )
}
