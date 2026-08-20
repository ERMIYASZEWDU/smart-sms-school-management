import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Calendar, CheckCircle, XCircle, Clock, Download, Filter, FileCheck } from 'lucide-react'
import { Button } from '../../components/Button'
import { getAttendance, getClasses } from '../../services/adminApi'

export const Attendance = () => {
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0])
  const [selectedClass, setSelectedClass] = useState('all')
  const [classes, setClasses] = useState([])
  const [attendanceData, setAttendanceData] = useState([])
  const [loading, setLoading] = useState(true)
  
  useEffect(() => {
    fetchClasses()
  }, [])

  useEffect(() => {
    fetchAttendance()
  }, [selectedDate, selectedClass])

  const fetchClasses = async () => {
    try {
      const data = await getClasses()
      setClasses(data)
    } catch (error) {
      console.error('Error fetching classes:', error)
    }
  }

  const fetchAttendance = async () => {
    try {
      setLoading(true)
      const params = {
        date: selectedDate
      }
      if (selectedClass !== 'all') {
        params.classId = selectedClass
      }
      
      const data = await getAttendance(params)
      setAttendanceData(data)
    } catch (error) {
      console.error('Error fetching attendance:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredData = selectedClass === 'all' 
    ? attendanceData 
    : attendanceData.filter(record => record.classId?._id === selectedClass)

  const stats = {
    total: filteredData.length,
    present: filteredData.filter(r => r.status === 'present').length,
    absent: filteredData.filter(r => r.status === 'absent').length,
    late: filteredData.filter(r => r.status === 'late').length,
    excused: filteredData.filter(r => r.status === 'excused').length
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'present': return 'bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300 border-green-300'
      case 'absent': return 'bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300 border-red-300'
      case 'late': return 'bg-orange-100 dark:bg-orange-900/40 text-orange-700 dark:text-orange-300 border-orange-300'
      case 'excused': return 'bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 border-blue-300'
      default: return 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-200 border-gray-300 dark:border-gray-600'
    }
  }

  const handleDownloadReport = () => {
    if (filteredData.length === 0) {
      alert('No attendance data to download')
      return
    }

    const classFilter = selectedClass === 'all' ? 'All_Classes' : 
      classes.find(c => c._id === selectedClass)?.name.replace(/\s+/g, '_') || 'Unknown'

    const csv = `Attendance Report - ${selectedDate}
Class,Roll No,Student Name,Status,Date

${filteredData.map(r => `${r.studentId?.grade || ''} ${r.studentId?.section || ''},${r.studentId?.enrollmentNumber || ''},${r.studentId?.name || ''},${r.status},${new Date(r.date).toLocaleString()}`).join('\n')}

SUMMARY
Total Students,${stats.total}
Present,${stats.present}
Absent,${stats.absent}
Late,${stats.late}
Excused,${stats.excused}
Attendance Rate,${stats.total > 0 ? ((stats.present / stats.total) * 100).toFixed(1) : 0}%
`
    const blob = new Blob([csv], { type: 'text/csv' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = `Attendance_${selectedDate}_${classFilter}.csv`
    link.click()
    alert('✅ Attendance report downloaded!')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 dark:from-gray-900 via-blue-50 dark:via-blue-900/40 to-purple-50 dark:to-purple-900/40 p-6 pt-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-7xl mx-auto"
      >
        {/* Header */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-8">
          <div>
            <div className="flex items-center gap-3">
              <Calendar size={36} className="text-orange-600 dark:text-orange-400" />
              <h1 className="text-4xl font-bold bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent">
                Attendance Management
              </h1>
            </div>
            <p className="text-gray-600 dark:text-gray-300 mt-2">Track and manage student attendance</p>
          </div>
          
          <div className="flex flex-wrap gap-3">
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="px-4 py-2 border-2 border-gray-200 dark:border-gray-700 rounded-xl focus:border-orange-500 focus:ring-2 focus:ring-orange-200 transition"
            />
            <select
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
              className="px-4 py-2 border-2 border-gray-200 dark:border-gray-700 rounded-xl focus:border-orange-500 focus:ring-2 focus:ring-orange-200 transition"
            >
              <option value="all">All Classes</option>
              {classes.map(cls => (
                <option key={cls._id} value={cls._id}>{cls.name}</option>
              ))}
            </select>
            <Button onClick={handleDownloadReport} className="flex items-center gap-2">
              <Download size={18} />
              Download Report
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg border border-gray-100 dark:border-gray-800"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 dark:text-gray-300 text-sm font-medium mb-1">Total Students</p>
                <p className="text-3xl font-bold text-gray-800 dark:text-gray-100">{stats.total}</p>
              </div>
              <div className="p-4 bg-gray-50 dark:bg-gray-900 rounded-xl">
                <Calendar size={28} className="text-gray-600 dark:text-gray-300" />
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
                <p className="text-3xl font-bold text-green-600 dark:text-green-400">{stats.present}</p>
                <p className="text-xs text-green-600 dark:text-green-400 font-semibold mt-1">
                  {((stats.present / stats.total) * 100).toFixed(1)}%
                </p>
              </div>
              <div className="p-4 bg-green-50 dark:bg-green-900/30 rounded-xl">
                <CheckCircle size={28} className="text-green-600 dark:text-green-400" />
              </div>
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
                <p className="text-3xl font-bold text-red-600 dark:text-red-400">{stats.absent}</p>
                <p className="text-xs text-red-600 dark:text-red-400 font-semibold mt-1">
                  {((stats.absent / stats.total) * 100).toFixed(1)}%
                </p>
              </div>
              <div className="p-4 bg-red-50 dark:bg-red-900/30 rounded-xl">
                <XCircle size={28} className="text-red-600 dark:text-red-400" />
              </div>
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
                <p className="text-3xl font-bold text-orange-600 dark:text-orange-400">{stats.late}</p>
                <p className="text-xs text-orange-600 dark:text-orange-400 font-semibold mt-1">
                  {((stats.late / stats.total) * 100).toFixed(1)}%
                </p>
              </div>
              <div className="p-4 bg-orange-50 dark:bg-orange-900/30 rounded-xl">
                <Clock size={28} className="text-orange-600 dark:text-orange-400" />
              </div>
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
                <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">{stats.excused}</p>
                <p className="text-xs text-blue-600 dark:text-blue-400 font-semibold mt-1">
                  {((stats.excused / stats.total) * 100).toFixed(1)}%
                </p>
              </div>
              <div className="p-4 bg-blue-50 dark:bg-blue-900/30 rounded-xl">
                <FileCheck size={28} className="text-blue-600 dark:text-blue-400" />
              </div>
            </div>
          </motion.div>
        </div>

        {/* Attendance Table */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-800 overflow-hidden"
        >
          <div className="p-6 bg-gradient-to-r from-orange-50 dark:from-orange-900/40 to-red-50 dark:to-red-900/40 border-b border-gray-100 dark:border-gray-800">
            <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100">
              Attendance Records - {new Date(selectedDate).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">Select status from dropdown to mark attendance</p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-900">
                <tr>
                  <th className="text-left p-4 font-bold text-gray-700 dark:text-gray-200">Class</th>
                  <th className="text-left p-4 font-bold text-gray-700 dark:text-gray-200">Roll No</th>
                  <th className="text-left p-4 font-bold text-gray-700 dark:text-gray-200">Student Name</th>
                  <th className="text-left p-4 font-bold text-gray-700 dark:text-gray-200">Status</th>
                  <th className="text-left p-4 font-bold text-gray-700 dark:text-gray-200">Check-in Time</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={5} className="p-8 text-center text-gray-600 dark:text-gray-300">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600 mx-auto mb-2"></div>
                      Loading attendance...
                    </td>
                  </tr>
                ) : filteredData.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="p-8 text-center text-gray-600 dark:text-gray-300">
                      No attendance records found for the selected date and class.
                    </td>
                  </tr>
                ) : (
                  filteredData.map((record, index) => (
                    <motion.tr
                      key={record._id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.6 + index * 0.03 }}
                      className="border-b border-gray-100 dark:border-gray-800 hover:bg-orange-50 transition-colors"
                    >
                      <td className="p-4 font-medium text-gray-700 dark:text-gray-200">
                        {record.studentId?.grade || 'N/A'} {record.studentId?.section || ''}
                      </td>
                      <td className="p-4 font-mono text-sm text-gray-600 dark:text-gray-300">
                        {record.studentId?.enrollmentNumber || 'N/A'}
                      </td>
                      <td className="p-4 font-semibold text-gray-800 dark:text-gray-100">
                        {record.studentId?.name || 'Unknown'}
                      </td>
                      <td className="p-4">
                        <span className={`px-4 py-2 rounded-lg text-sm font-semibold border-2 ${getStatusColor(record.status)}`}>
                          {record.status.toUpperCase()}
                        </span>
                      </td>
                      <td className="p-4 text-gray-600 dark:text-gray-300">
                        {new Date(record.date).toLocaleTimeString('en-US', { 
                          hour: '2-digit', 
                          minute: '2-digit' 
                        })}
                      </td>
                    </motion.tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {!loading && filteredData.length === 0 && (
            <div className="p-12 text-center">
              <Calendar size={64} className="mx-auto text-gray-300 dark:text-gray-400 mb-4" />
              <p className="text-gray-500 dark:text-gray-400 text-lg font-medium">No attendance records found</p>
              <p className="text-gray-400 dark:text-gray-500 text-sm">Try selecting a different class or date</p>
            </div>
          )}
        </motion.div>
      </motion.div>
    </div>
  )
}
