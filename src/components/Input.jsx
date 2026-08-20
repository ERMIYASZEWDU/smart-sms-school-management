import React from 'react'

export const Input = ({
  label = null,
  error = null,
  icon: Icon = null,
  ...props
}) => {
  return (
    <div className="w-full">
      {label && (
        <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
          {label}
        </label>
      )}
      <div className="relative">
        {Icon && (
          <Icon size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        )}
        <input
          {...props}
          className={`w-full ${Icon ? 'pl-10' : 'pl-4'} pr-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg font-medium transition-all focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent dark:bg-gray-700 dark:text-white ${
            error ? 'border-red-500 focus:ring-red-600' : ''
          }`}
        />
      </div>
      {error && <p className="text-red-500 text-sm mt-1">{error}</p>}
    </div>
  )
}
