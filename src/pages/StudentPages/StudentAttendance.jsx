import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Calendar, CheckCircle, XCircle, Clock, AlertCircle, TrendingUp } from 'lucide-react'
import { getStudentAttendance } from '../../services/studentApi'

export const StudentAttendance = () => {
  const [attendanceData, setAttendanceData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [dateRange, setDateRange] = useState('all')

  useEffect(() => {
    fetchAttendance()
  }, [dateRange])

  const fetchAttendance = async () => {
    try {
      setLoading(true)
      const params = {}
      
      if (dateRange === '30days') {
        const endDate = new Date()
        const startDate = new Date()
        startDate.setDate(startDate.getDate() - 30)
        params.startDate = startDate.toISOString()
        params.endDate = endDate.toISOString()
      } else if (dateRange === '7days') {
        const endDate = new Date()
        const startDate = new Date()
        startDate.setDate(startDate.getDate() - 7)
        params.startDate = startDate.toISOString()
        params.endDate = endDate.toISOString()
      }

      const data = await getStudentAttendance(params)
      setAttendanceData(data)
      setError('')
    } catch (err) {
      console.error('Error fetching attendance:', err)
      setError('Failed to load attendance')
    } finally {
      setLoading(false)
    }
  }

  const getStatusIcon = (status) => {
    switch (status) {
      case 'present':
        return <CheckCircle size={20} className="text-green-600 dark:text-green-400" />
      case 'absent':
        return <XCircle size={20} className="text-red-600 dark:text-red-400" />
      case 'late':
        return <Clock size={20} className="text-orange-600 dark:text-orange-400" />
      case 'excused':
        return <AlertCircle size={20} className="text-blue-600 dark:text-blue-400" />
      default:
        return null
    }
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'present':
        return 'bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300 border-green-300'
      case 'absent':
        return 'bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300 border-red-300'
      case 'late':
        return 'bg-orange-100 dark:bg-orange-900/40 text-orange-700 dark:text-orange-300 border-orange-300'
      case 'excused':
        return 'bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 border-blue-300'
      default:
        return 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-200 border-gray-300 dark:border-gray-600'
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6 pt-8 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-300">Loading attendance...</p>
        </div>
      </div>
    )
  }

  const stats = attendanceData?.statistics || {}
  const attendance = attendanceData?.attendance || []

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 dark:from-gray-900 via-green-50 dark:via-green-900/40 to-blue-50 dark:to-blue-900/40 p-6 pt-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-7xl mx-auto"
      >
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <Calendar size={36} className="text-green-600 dark:text-green-400" />
            <h1 className="text-4xl font-bold bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent">
              My Attendance
            </h1>
          </div>
          <p className="text-gray-600 dark:text-gray-300">Track your attendance record</p>
        </div>

        {error && (
          <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-900/50 text-red-700 dark:text-red-300 px-4 py-3 rounded-lg mb-6">
            {error}
          </div>
        )}

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg border border-gray-100 dark:border-gray-800"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 dark:text-gray-300 text-sm font-medium mb-1">Attendance Rate</p>
                <p className="text-3xl font-bold text-green-600 dark:text-green-400">{stats.percentage}%</p>
              </div>
              <div className="p-3 bg-green-50 dark:bg-green-900/30 rounded-xl">
                <TrendingUp size={24} className="text-green-600 dark:text-green-400" />
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg border border-gray-100 dark:border-gray-800"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 dark:text-gray-300 text-sm font-medium mb-1">Present</p>
                <p className="text-3xl font-bold text-green-600 dark:text-green-400">{stats.present || 0}</p>
              </div>
              <CheckCircle size={24} className="text-green-600 dark:text-green-400" />
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg border border-gray-100 dark:border-gray-800"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 dark:text-gray-300 text-sm font-medium mb-1">Absent</p>
                <p className="text-3xl font-bold text-red-600 dark:text-red-400">{stats.absent || 0}</p>
              </div>
              <XCircle size={24} className="text-red-600 dark:text-red-400" />
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg border border-gray-100 dark:border-gray-800"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 dark:text-gray-300 text-sm font-medium mb-1">Late</p>
                <p className="text-3xl font-bold text-orange-600 dark:text-orange-400">{stats.late || 0}</p>
              </div>
              <Clock size={24} className="text-orange-600 dark:text-orange-400" />
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg border border-gray-100 dark:border-gray-800"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 dark:text-gray-300 text-sm font-medium mb-1">Excused</p>
                <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">{stats.excused || 0}</p>
              </div>
              <AlertCircle size={24} className="text-blue-600 dark:text-blue-400" />
            </div>
          </motion.div>
        </div>

        {/* Filter */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700 mb-6"
        >
          <div className="flex items-center gap-4">
            <Calendar size={20} className="text-gray-600 dark:text-gray-300" />
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 bg-white dark:bg-gray-800"
            >
              <option value="all">All Time</option>
              <option value="7days">Last 7 Days</option>
              <option value="30days">Last 30 Days</option>
            </select>
            <span className="text-sm text-gray-600 dark:text-gray-300">
              Total Records: {stats.total || 0}
            </span>
          </div>
        </motion.div>

        {/* Attendance Table */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-800 overflow-hidden"
        >
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gradient-to-r from-green-50 dark:from-green-900/40 to-blue-50 dark:to-blue-900/40">
                <tr>
                  <th className="text-left p-4 font-bold text-gray-700 dark:text-gray-200">Date</th>
                  <th className="text-left p-4 font-bold text-gray-700 dark:text-gray-200">Subject</th>
                  <th className="text-left p-4 font-bold text-gray-700 dark:text-gray-200">Status</th>
                  <th className="text-left p-4 font-bold text-gray-700 dark:text-gray-200">Remarks</th>
                  <th className="text-left p-4 font-bold text-gray-700 dark:text-gray-200">Marked By</th>
                </tr>
              </thead>
              <tbody>
                {attendance.length > 0 ? (
                  attendance.map((record, index) => (
                    <motion.tr
                      key={record._id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.8 + index * 0.05 }}
                      className="border-b border-gray-100 dark:border-gray-800 hover:bg-green-50 transition-colors"
                    >
                      <td className="p-4 font-semibold text-gray-800 dark:text-gray-100">
                        {new Date(record.date).toLocaleDateString('en-US', {
                          weekday: 'short',
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric'
                        })}
                      </td>
                      <td className="p-4 text-gray-700 dark:text-gray-200">{record.subject || 'General'}</td>
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          {getStatusIcon(record.status)}
                          <span className={`px-3 py-1 rounded-full text-sm font-semibold border-2 capitalize ${getStatusColor(record.status)}`}>
                            {record.status}
                          </span>
                        </div>
                      </td>
                      <td className="p-4 text-gray-600 dark:text-gray-300 text-sm">
                        {record.remarks || '-'}
                      </td>
                      <td className="p-4 text-blue-600 dark:text-blue-400 text-sm">
                        {record.markedBy?.name || 'N/A'}
                      </td>
                    </motion.tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="p-12 text-center">
                      <Calendar size={48} className="text-gray-300 dark:text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-500 dark:text-gray-400 text-lg">No attendance records found</p>
                      <p className="text-gray-400 dark:text-gray-500 text-sm mt-1">Your attendance will be recorded by teachers</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </motion.div>
      </motion.div>
    </div>
  )
}
