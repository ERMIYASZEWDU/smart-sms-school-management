import React, { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { motion } from 'framer-motion'
import { Users, BookOpen, CheckCircle, Clock, TrendingUp, AlertTriangle, Download, Calendar, Menu, Bell, Search, User } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts'
import { getTeacherDashboard } from '../../services/teacherApi'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../../store/authStore'
import { resolvePhotoUrl } from '../../utils/api'

const assignmentStatusData = [
  { name: 'Submitted', value: 280, fill: '#10b981' },
  { name: 'Pending', value: 45, fill: '#f59e0b' },
  { name: 'Not Submitted', value: 25, fill: '#ef4444' }
]

export const TeacherDashboard = () => {
  const { t } = useTranslation()
  const user = useAuthStore((s) => s.user)
  const navigate = useNavigate()
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [loading, setLoading] = useState(true)
  const [dashboardData, setDashboardData] = useState({
    totalStudents: 0,
    totalClasses: 0,
    assignmentsCount: 0,
    avgScore: 0,
    recentAssignments: [],
    attendanceData: [],
    classPerformance: []
  })

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true)
        const data = await getTeacherDashboard()
        setDashboardData(data)
      } catch (error) {
        console.error('Error fetching dashboard data:', error)
        // Show error notification if needed
      } finally {
        setLoading(false)
      }
    }

    fetchDashboardData()
  }, [])

  const stats = [
    { icon: Users, label: 'Total Students', value: loading ? '...' : dashboardData.totalStudents.toString(), subtitle: '+4.2% from last month', bgColor: 'bg-blue-50 dark:bg-blue-900/30', textColor: 'text-blue-600 dark:text-blue-400', borderColor: 'border-blue-200 dark:border-blue-900/50' },
    { icon: BookOpen, label: 'Classes', value: loading ? '...' : dashboardData.totalClasses.toString(), subtitle: '+1 new class', bgColor: 'bg-green-50 dark:bg-green-900/30', textColor: 'text-green-600 dark:text-green-400', borderColor: 'border-green-200 dark:border-green-900/50' },
    { icon: CheckCircle, label: 'Assignments', value: loading ? '...' : dashboardData.assignmentsCount.toString(), subtitle: '+3 this week', bgColor: 'bg-purple-50 dark:bg-purple-900/30', textColor: 'text-purple-600 dark:text-purple-400', borderColor: 'border-purple-200 dark:border-purple-900/50' },
    { icon: TrendingUp, label: 'Avg Score', value: loading ? '...' : `${dashboardData.avgScore}%`, subtitle: '+2.1% from last month', bgColor: 'bg-orange-50 dark:bg-orange-900/30', textColor: 'text-orange-600 dark:text-orange-400', borderColor: 'border-orange-200 dark:border-orange-900/50' }
  ]

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-300">Loading dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6 pt-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-full mx-auto"
      >
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-11 h-11 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center overflow-hidden shrink-0">
              {user?.profilePhoto ? (
                <img src={resolvePhotoUrl(user.profilePhoto)} alt={user?.name || 'User'} className="w-full h-full object-cover" />
              ) : (
                <span className="text-white font-bold">{(user?.name || 'T').charAt(0).toUpperCase()}</span>
              )}
            </div>
            <div className="min-w-0">
              <motion.h1 
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="text-3xl font-bold text-gray-800 dark:text-gray-100"
              >
                Dashboard
              </motion.h1>
              <p className="text-gray-600 dark:text-gray-300 mt-1">Welcome back, {user?.name || 'Teacher'}! 👋</p>
            </div>
          </div>
          
          <div className="flex gap-3 w-full sm:w-auto">
            <motion.button
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
              whileHover={{ scale: 1.05 }}
              className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:shadow-md transition"
            >
              <Calendar size={18} className="text-gray-600 dark:text-gray-300" />
              <span className="text-sm font-medium text-gray-700 dark:text-gray-200">This Month</span>
            </motion.button>
            <motion.button
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.15 }}
              whileHover={{ scale: 1.05 }}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
            >
              <Download size={18} />
              <span className="text-sm font-medium">Download Report</span>
            </motion.button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {stats.map((stat, idx) => {
            const Icon = stat.icon
            return (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 20, scale: 0.9 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ delay: 0.2 + idx * 0.08 }}
                whileHover={{ y: -4 }}
                className={`${stat.bgColor} border ${stat.borderColor} rounded-lg p-5 transition-all cursor-pointer`}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className={`p-2 rounded-lg ${stat.textColor} bg-white/50 dark:bg-gray-800/50`}>
                    <Icon size={20} />
                  </div>
                  <span className={`text-xs font-semibold ${stat.textColor} px-2 py-1 rounded-full bg-white/60 dark:bg-gray-800/60`}>
                    +2.1%
                  </span>
                </div>
                <p className="text-gray-600 dark:text-gray-300 text-sm font-medium">{stat.label}</p>
                <motion.p 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.3 + idx * 0.08 }}
                  className={`text-2xl font-bold ${stat.textColor} mt-1`}
                >
                  {stat.value}
                </motion.p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">{stat.subtitle}</p>
              </motion.div>
            )
          })}
        </div>

        {/* Main Grid */}
        <div className="grid lg:grid-cols-3 gap-6 mb-6">
          {/* Attendance Trend Chart */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700"
          >
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100">Attendance Trend</h3>
              <select className="px-3 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 cursor-pointer hover:border-gray-400 dark:hover:border-gray-500">
                <option>Last 6 Months</option>
                <option>Last Year</option>
              </select>
            </div>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={dashboardData.attendanceData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                <XAxis dataKey="month" stroke="#999" style={{ fontSize: '12px' }} />
                <YAxis stroke="#999" style={{ fontSize: '12px' }} />
                <Tooltip contentStyle={{ backgroundColor: '#fff', border: '1px solid #ddd', borderRadius: '6px' }} />
                <Bar dataKey="present" stackId="a" fill="#10b981" name="Present" />
                <Bar dataKey="absent" stackId="a" fill="#ef4444" name="Absent" />
              </BarChart>
            </ResponsiveContainer>
          </motion.div>

          {/* Assignment Status */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ delay: 0.45 }}
            className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700"
          >
            <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100 mb-4">Assignment Status</h3>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie data={assignmentStatusData} cx="50%" cy="50%" innerRadius={50} outerRadius={90} dataKey="value">
                  {assignmentStatusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            <div className="mt-4 space-y-2 text-xs">
              {assignmentStatusData.map((item, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.5 + idx * 0.05 }}
                  className="flex items-center justify-between"
                >
                  <span className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: item.fill }}></span>
                    <span className="text-gray-600 dark:text-gray-300">{item.name}</span>
                  </span>
                  <span className="font-semibold text-gray-800 dark:text-gray-100">{item.value}</span>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>

        {/* Class Performance and Notifications */}
        <div className="grid lg:grid-cols-3 gap-6 mb-6">
          {/* Class Performance */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700"
          >
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100">Class Performance Overview</h3>
              <select className="px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 cursor-pointer">
                <option>This Month</option>
                <option>Last Month</option>
              </select>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead className="border-b border-gray-200 dark:border-gray-700">
                  <tr>
                    <th className="text-left py-2 px-3 font-semibold text-gray-700 dark:text-gray-200">Class</th>
                    <th className="text-left py-2 px-3 font-semibold text-gray-700 dark:text-gray-200">Avg Score</th>
                    <th className="text-left py-2 px-3 font-semibold text-gray-700 dark:text-gray-200">Excellent</th>
                    <th className="text-left py-2 px-3 font-semibold text-gray-700 dark:text-gray-200">Good</th>
                    <th className="text-left py-2 px-3 font-semibold text-gray-700 dark:text-gray-200">Average</th>
                  </tr>
                </thead>
                <tbody>
                  {dashboardData.classPerformance.map((item, idx) => (
                    <motion.tr
                      key={idx}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.55 + idx * 0.05 }}
                      className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800"
                    >
                      <td className="py-3 px-3 font-medium text-gray-800 dark:text-gray-100">{item.class}</td>
                      <td className="py-3 px-3">
                        <div className="flex items-center gap-2">
                          <div className="w-12 bg-gray-200 dark:bg-gray-700 rounded-full h-1.5">
                            <div className="bg-green-500 h-1.5 rounded-full" style={{ width: `${item.average}%` }}></div>
                          </div>
                          <span className="font-semibold text-gray-700 dark:text-gray-200">{item.average}%</span>
                        </div>
                      </td>
                      <td className="py-3 px-3"><span className="bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300 px-2 py-1 rounded text-xs font-semibold">{item.excellent}</span></td>
                      <td className="py-3 px-3"><span className="bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 px-2 py-1 rounded text-xs font-semibold">{item.good}</span></td>
                      <td className="py-3 px-3"><span className="bg-orange-100 dark:bg-orange-900/40 text-orange-700 dark:text-orange-300 px-2 py-1 rounded text-xs font-semibold">{item.average_grade}</span></td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          </motion.div>

          {/* Recent Notifications */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ delay: 0.55 }}
            className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700"
          >
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100">Recent Notifications</h3>
              <a href="#" className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 text-xs font-semibold">View All</a>
            </div>
            <div className="space-y-3 max-h-64 overflow-y-auto">
              {[
                { icon: '📋', title: 'Attendance sheet submission deadline today', time: '2 hours ago', color: 'bg-red-50 dark:bg-red-900/30 border-red-200 dark:border-red-900/50' },
                { icon: '📅', title: 'Parent-Teacher meeting scheduled on 30 May', time: '1 day ago', color: 'bg-green-50 dark:bg-green-900/30 border-green-200 dark:border-green-900/50' },
                { icon: '✅', title: 'Assignment submissions closed for Grade 11-A', time: '2 days ago', color: 'bg-blue-50 dark:bg-blue-900/30 border-blue-200 dark:border-blue-900/50' },
                { icon: '🎓', title: 'Final exam schedule has been published', time: '3 days ago', color: 'bg-purple-50 dark:bg-purple-900/30 border-purple-200 dark:border-purple-900/50' }
              ].map((notif, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.6 + idx * 0.05 }}
                  className={`p-3 ${notif.color} border rounded-lg`}
                >
                  <div className="flex gap-2">
                    <span className="text-lg flex-shrink-0">{notif.icon}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-gray-800 dark:text-gray-100 line-clamp-2">{notif.title}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{notif.time}</p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>

        {/* Quick Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="grid md:grid-cols-3 gap-4"
        >
          {[
            { icon: '📝', label: 'Create Assignment', action: () => navigate('/teacher/assignments') },
            { icon: '✔️', label: 'Mark Attendance', action: () => navigate('/teacher/attendance') },
            { icon: '📊', label: 'Upload Grades', action: () => navigate('/teacher/grades') },
            { icon: '💬', label: 'Message Parents', action: () => {} },
            { icon: '📚', label: 'View Syllabus', action: () => {} },
            { icon: '👥', label: 'Student Reports', action: () => navigate('/teacher/students') }
          ].map((link, idx) => (
            <motion.button
              key={idx}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.75 + idx * 0.06 }}
              whileHover={{ scale: 1.02, y: -2 }}
              whileTap={{ scale: 0.98 }}
              onClick={link.action}
              className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 text-center hover:shadow-md transition"
            >
              <div className="text-3xl mb-2">{link.icon}</div>
              <p className="text-gray-800 dark:text-gray-100 font-semibold text-sm">{link.label}</p>
            </motion.button>
          ))}
        </motion.div>

        {/* Footer */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
          className="mt-8 text-center text-xs text-gray-500 dark:text-gray-400 border-t border-gray-200 dark:border-gray-700 pt-6"
        >
          <p>© 2026 EduManage School Management System. All rights reserved. Version 2.0.0</p>
        </motion.div>
      </motion.div>
    </div>
  )
}
