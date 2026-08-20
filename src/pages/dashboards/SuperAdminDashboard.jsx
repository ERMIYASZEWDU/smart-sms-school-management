import React from 'react'
import { useTranslation } from 'react-i18next'
import { motion } from 'framer-motion'
import { Building2, Users, TrendingUp, Settings } from 'lucide-react'
import { useAuthStore } from '../../store/authStore'
import { resolvePhotoUrl } from '../../utils/api'

export const SuperAdminDashboard = () => {
  const { t } = useTranslation()
  const user = useAuthStore((s) => s.user)

  const stats = [
    { icon: Building2, label: 'Schools', value: '5', color: 'blue' },
    { icon: Users, label: 'Total Users', value: '5,234', color: 'green' },
    { icon: TrendingUp, label: 'Revenue', value: '$45K', color: 'purple' },
    { icon: Settings, label: 'Active', value: '100%', color: 'orange' }
  ]

  const schools = [
    { name: 'Main Campus', location: 'Downtown', students: 1200, teachers: 80 },
    { name: 'North Branch', location: 'North District', students: 950, teachers: 65 }
  ]

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4 md:p-8 pt-24">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-7xl mx-auto"
      >
        <div className="flex items-center gap-4 mb-8">
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center overflow-hidden shrink-0">
            {user?.profilePhoto ? (
              <img src={resolvePhotoUrl(user.profilePhoto)} alt={user?.name || 'User'} className="w-full h-full object-cover" />
            ) : (
              <span className="text-white font-bold text-lg">{(user?.name || 'S').charAt(0).toUpperCase()}</span>
            )}
          </div>
          <motion.h1 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="text-3xl font-bold"
          >
            {t('super_admin_dashboard')}
          </motion.h1>
        </div>

        {/* Stats */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {stats.map((stat, idx) => {
            const Icon = stat.icon
            const colors = { blue: 'from-blue-400 to-blue-600', green: 'from-green-400 to-green-600', purple: 'from-purple-400 to-purple-600', orange: 'from-orange-400 to-orange-600' }
            return (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 10, scale: 0.9 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ delay: 0.2 + idx * 0.1, duration: 0.5 }}
                whileHover={{ y: -5, boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)' }}
                className={`bg-gradient-to-br ${colors[stat.color]} text-white rounded-xl p-6 shadow-lg cursor-pointer transition-all`}
              >
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-sm opacity-90">{stat.label}</p>
                    <motion.p 
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.3 + idx * 0.1 }}
                      className="text-2xl font-bold mt-2"
                    >
                      {stat.value}
                    </motion.p>
                  </div>
                  <motion.div
                    animate={{ rotate: [0, 5, -5, 0] }}
                    transition={{ duration: 4, repeat: Infinity, delay: idx * 0.5 }}
                  >
                    <Icon size={24} className="opacity-75" />
                  </motion.div>
                </div>
              </motion.div>
            )
          })}
        </div>

        {/* Schools */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.6 }}
          whileHover={{ scale: 1.01 }}
          className="glassmorphism rounded-xl p-6 dark:bg-gray-800 mb-8 shadow-lg"
        >
          <h3 className="text-lg font-bold mb-4">Managed Schools</h3>
          <div className="space-y-3">
            {schools.map((school, idx) => (
              <motion.div 
                key={idx}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.5 + idx * 0.1 }}
                whileHover={{ x: 5 }}
                className="flex justify-between items-center p-4 bg-gray-50 dark:bg-gray-700 rounded-lg hover:shadow-md transition-all"
              >
                <div>
                  <p className="font-medium">{school.name}</p>
                  <p className="text-sm text-gray-500">{school.location}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm">{school.students} Students • {school.teachers} Teachers</p>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Admin Functions */}
        <div className="grid md:grid-cols-3 gap-4">
          {['Manage Schools', 'Manage Admins', 'System Settings', 'Audit Logs', 'Backups', 'Analytics'].map((item, idx) => (
            <motion.button
              key={idx}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 + idx * 0.1 }}
              whileHover={{ scale: 1.05, y: -3 }}
              whileTap={{ scale: 0.95 }}
              className="glassmorphism p-4 rounded-xl text-center hover:shadow-lg transition font-medium"
            >
              {item}
            </motion.button>
          ))}
        </div>
      </motion.div>
    </div>
  )
}
