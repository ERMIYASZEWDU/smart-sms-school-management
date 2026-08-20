import React from 'react'
import { motion } from 'framer-motion'

export const Table = ({ headers, data, actions }) => {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm"
    >
      <table className="w-full bg-white dark:bg-gray-800">
        <thead>
          <tr className="border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
            {headers.map((header, idx) => (
              <th
                key={idx}
                className="px-6 py-3 text-left text-sm font-semibold text-gray-900 dark:text-gray-100"
              >
                {header}
              </th>
            ))}
            {actions && <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900 dark:text-gray-100">Actions</th>}
          </tr>
        </thead>
        <tbody>
          {data.map((row, rowIdx) => (
            <tr
              key={rowIdx}
              className="border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
            >
              {Object.values(row).map((cell, cellIdx) => (
                <td key={cellIdx} className="px-6 py-3 text-sm text-gray-700 dark:text-gray-300">
                  {cell}
                </td>
              ))}
              {actions && (
                <td className="px-6 py-3 text-sm flex gap-2">
                  {actions.map((action, idx) => (
                    <button
                      key={idx}
                      onClick={() => action.onClick(row)}
                      className="px-3 py-1.5 text-xs font-medium rounded-lg bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 hover:bg-blue-200 dark:hover:bg-blue-900/50 transition-colors"
                    >
                      {action.label}
                    </button>
                  ))}
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </motion.div>
  )
}
