import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { BookOpen, CheckCircle, Clock, TrendingUp } from 'lucide-react'
import { getStudentDashboard } from '../../services/studentApi'
import { useAuthStore } from '../../store/authStore'
import { resolvePhotoUrl } from '../../utils/api'

export const StudentDashboard = () => {
  const user = useAuthStore((s) => s.user)
  const [dashboardData, setDashboardData] = useState({
    student: null,
    gpa: 0,
    attendancePercentage: 0,
    recentGrades: [],
    pendingAssignments: [],
    announcements: []
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    try {
      setLoading(true)
      const data = await getStudentDashboard()
      setDashboardData(data)
    } catch (error) {
      console.error('Error fetching student dashboard:', error)
    } finally {
      setLoading(false)
    }
  }

  const stats = [
    { 
      icon: TrendingUp, 
      label: 'GPA', 
      value: loading ? '...' : dashboardData.gpa?.toFixed(2) || '0.00', 
      subtitle: 'Current GPA',
      bgColor: 'bg-blue-50 dark:bg-blue-900/30',
      iconColor: 'text-blue-600 dark:text-blue-400'
    },
    { 
      icon: CheckCircle, 
      label: 'Attendance', 
      value: loading ? '...' : `${dashboardData.attendancePercentage}%`,
      subtitle: 'Present rate',
      bgColor: 'bg-green-50 dark:bg-green-900/30',
      iconColor: 'text-green-600 dark:text-green-400'
    },
    { 
      icon: Clock, 
      label: 'Pending', 
      value: loading ? '...' : dashboardData.pendingAssignments?.length || 0,
      subtitle: 'Assignments',
      bgColor: 'bg-orange-50 dark:bg-orange-900/30',
      iconColor: 'text-orange-600 dark:text-orange-400'
    },
    { 
      icon: BookOpen, 
      label: 'Class', 
      value: loading ? '...' : dashboardData.student?.grade || 'N/A',
      subtitle: dashboardData.student?.section || '',
      bgColor: 'bg-purple-50 dark:bg-purple-900/30',
      iconColor: 'text-purple-600 dark:text-purple-400'
    }
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 dark:from-gray-900 via-blue-50 dark:via-blue-900/40 to-purple-50 dark:to-purple-900/40 p-6">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center overflow-hidden shrink-0">
            {user?.profilePhoto ? (
              <img src={resolvePhotoUrl(user.profilePhoto)} alt={user?.name || 'User'} className="w-full h-full object-cover" />
            ) : (
              <span className="text-white font-bold text-lg">{(user?.name || 'U').charAt(0).toUpperCase()}</span>
            )}
          </div>
          <div className="min-w-0">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">
              Student Dashboard
            </h1>
            <p className="text-lg text-gray-600 dark:text-gray-300">
              Welcome back, {loading ? '...' : dashboardData.student?.name || 'Student'}! 👋
            </p>
          </div>
        </div>
      </motion.div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {stats.map((stat, idx) => {
          const Icon = stat.icon
          return (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
              whileHover={{ y: -4, boxShadow: '0 10px 25px rgba(0,0,0,0.10)' }}
              className={`${stat.bgColor} rounded-2xl p-6 shadow-lg border border-gray-100 dark:border-gray-800`}
            >
              <div className="flex items-start justify-between mb-4">
                <p className="text-gray-700 dark:text-gray-200 text-sm font-semibold">{stat.label}</p>
                <div className={`p-2.5 rounded-xl bg-white dark:bg-gray-800`}>
                  <Icon size={20} className={stat.iconColor} />
                </div>
              </div>
              
              <p className="text-3xl font-bold text-gray-900 dark:text-white mb-2">{stat.value}</p>
              <p className="text-sm text-gray-600 dark:text-gray-300">{stat.subtitle}</p>
            </motion.div>
          )
        })}
      </div>

      {/* Recent Grades */}
      <div className="grid md:grid-cols-2 gap-6 mb-8">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg border border-gray-100 dark:border-gray-800"
        >
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Recent Grades</h2>
          {loading ? (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">Loading...</div>
          ) : dashboardData.recentGrades?.length === 0 ? (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">No grades yet</div>
          ) : (
            <div className="space-y-3">
              {dashboardData.recentGrades?.map((grade, idx) => (
                <div key={idx} className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-900 rounded-lg">
                  <div>
                    <p className="font-semibold text-gray-900 dark:text-white">{grade.subject}</p>
                    <p className="text-sm text-gray-600 dark:text-gray-300">{grade.gradeType}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-blue-600 dark:text-blue-400">{grade.score}/{grade.maxScore}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {new Date(grade.date).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </motion.div>

        {/* Pending Assignments */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg border border-gray-100 dark:border-gray-800"
        >
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Pending Assignments</h2>
          {loading ? (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">Loading...</div>
          ) : dashboardData.pendingAssignments?.length === 0 ? (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">No pending assignments</div>
          ) : (
            <div className="space-y-3">
              {dashboardData.pendingAssignments?.map((assignment, idx) => (
                <div key={idx} className="p-3 bg-orange-50 dark:bg-orange-900/30 rounded-lg border border-orange-200 dark:border-orange-900/50">
                  <p className="font-semibold text-gray-900 dark:text-white">{assignment.title}</p>
                  <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">{assignment.subject}</p>
                  <div className="flex items-center gap-2 text-xs text-orange-600 dark:text-orange-400">
                    <Clock size={14} />
                    <span>Due: {new Date(assignment.dueDate).toLocaleDateString()}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </motion.div>
      </div>

      {/* Announcements */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg border border-gray-100 dark:border-gray-800"
      >
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Announcements</h2>
        {loading ? (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">Loading...</div>
        ) : dashboardData.announcements?.length === 0 ? (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">No announcements</div>
        ) : (
          <div className="space-y-4">
            {dashboardData.announcements?.map((announcement, idx) => (
              <div key={idx} className="p-4 bg-blue-50 dark:bg-blue-900/30 rounded-lg border border-blue-200 dark:border-blue-900/50">
                <div className="flex items-start justify-between mb-2">
                  <h3 className="font-semibold text-gray-900 dark:text-white">{announcement.title}</h3>
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    announcement.priority === 'urgent' ? 'bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300' :
                    announcement.priority === 'high' ? 'bg-orange-100 dark:bg-orange-900/40 text-orange-700 dark:text-orange-300' :
                    'bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300'
                  }`}>
                    {announcement.priority}
                  </span>
                </div>
                <p className="text-sm text-gray-700 dark:text-gray-200 mb-2">{announcement.content}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {new Date(announcement.publishDate).toLocaleDateString()}
                </p>
              </div>
            ))}
          </div>
        )}
      </motion.div>
    </div>
  )
}
