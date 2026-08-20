import React from 'react'
import { motion } from 'framer-motion'

export const StatCard = ({ icon: Icon, label, value, color = 'blue', delay = 0 }) => {
  const colorClasses = {
    blue: 'from-blue-600 to-blue-700',
    green: 'from-green-600 to-green-700',
    purple: 'from-purple-600 to-purple-700',
    orange: 'from-orange-600 to-orange-700',
    red: 'from-red-600 to-red-700',
    pink: 'from-pink-600 to-pink-700'
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      className={`bg-gradient-to-br ${colorClasses[color]} text-white rounded-lg p-6 shadow-md hover:shadow-lg transition-shadow`}
    >
      <div className="flex justify-between items-start">
        <div>
          <p className="text-sm font-medium opacity-90">{label}</p>
          <p className="text-3xl font-bold mt-2">{value}</p>
        </div>
        <Icon size={28} className="opacity-70" />
      </div>
    </motion.div>
  )
}
