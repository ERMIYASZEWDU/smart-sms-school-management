import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Calendar, CheckCircle, XCircle, Clock, Save, AlertCircle } from 'lucide-react'
import { getMyStudents, markAttendance, getAttendance } from '../../services/teacherApi'
import apiClient from '../../utils/api'

export const TeacherAttendance = () => {
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0])
  const [selectedClassId, setSelectedClassId] = useState('all')
  const [classes, setClasses] = useState([])
  const [students, setStudents] = useState([])
  const [attendance, setAttendance] = useState({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  // Load teacher's assigned classes on mount
  useEffect(() => {
    fetchClasses()
  }, [])

  // Reload students whenever selected class changes
  useEffect(() => {
    fetchStudents()
  }, [selectedClassId])

  // Reload existing attendance records when date or students change
  useEffect(() => {
    if (students.length > 0) fetchExistingAttendance()
  }, [selectedDate, students.length])

  const fetchClasses = async () => {
    try {
      const res = await apiClient.get('/api/teacher/classes')
      setClasses(res.data)
    } catch (err) {
      console.error('Error fetching classes:', err)
    }
  }

  const fetchStudents = async () => {
    try {
      setLoading(true)
      setError('')
      const params = {}
      if (selectedClassId !== 'all') params.classId = selectedClassId
      const data = await getMyStudents(params)
      setStudents(data)

      // Default every student to present
      const init = {}
      data.forEach(s => { init[s._id] = 'present' })
      setAttendance(init)
    } catch (err) {
      setError('Failed to load students')
    } finally {
      setLoading(false)
    }
  }

  const fetchExistingAttendance = async () => {
    try {
      const params = { date: selectedDate }
      if (selectedClassId !== 'all') params.classId = selectedClassId
      const data = await getAttendance(params)

      const existing = {}
      data.forEach(r => {
        if (r.studentId?._id) existing[r.studentId._id] = r.status
      })
      // Merge: existing records override defaults, students without records stay 'present'
      setAttendance(prev => ({ ...prev, ...existing }))
    } catch (err) {
      // Non-critical — just keep defaults
    }
  }

  const handleStatusChange = (studentId, status) => {
    setAttendance(prev => ({ ...prev, [studentId]: status }))
  }

  const handleSaveAttendance = async () => {
    if (students.length === 0) {
      setError('No students to mark attendance for.')
      return
    }
    try {
      setSaving(true)
      setError('')
      setSuccess('')

      const classId = selectedClassId !== 'all' ? selectedClassId : null
      const records = students.map(s => ({
        studentId: s._id,
        status: attendance[s._id] || 'present'
      }))

      await markAttendance({ classId, date: selectedDate, students: records })
      setSuccess(`Attendance saved for ${students.length} students!`)
      setTimeout(() => setSuccess(''), 3000)
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Unknown error'
      setError(`Failed to save attendance: ${msg}`)
    } finally {
      setSaving(false)
    }
  }

  const stats = {
    total: students.length,
    present: Object.values(attendance).filter(s => s === 'present').length,
    absent: Object.values(attendance).filter(s => s === 'absent').length,
    late: Object.values(attendance).filter(s => s === 'late').length,
    excused: Object.values(attendance).filter(s => s === 'excused').length
  }
  const attendanceRate = stats.total > 0
    ? (((stats.present + stats.late) / stats.total) * 100).toFixed(1)
    : 0

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6 pt-8">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-7xl mx-auto">

        {/* Header */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-8">
          <div>
            <div className="flex items-center gap-3">
              <Calendar size={36} className="text-orange-600 dark:text-orange-400" />
              <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100">Mark Attendance</h1>
            </div>
            <p className="text-gray-600 dark:text-gray-300 mt-1">Mark daily attendance for your classes</p>
          </div>
          <div className="flex flex-wrap gap-3 items-center">
            {/* Class selector */}
            <select
              value={selectedClassId}
              onChange={e => setSelectedClassId(e.target.value)}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 bg-white dark:bg-gray-800 text-sm"
            >
              <option value="all">All My Classes</option>
              {classes.map(c => (
                <option key={c._id} value={c._id}>{c.name}</option>
              ))}
            </select>
            <input
              type="date"
              value={selectedDate}
              onChange={e => setSelectedDate(e.target.value)}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 text-sm"
            />
            <button
              onClick={handleSaveAttendance}
              disabled={saving || students.length === 0}
              className="flex items-center gap-2 px-6 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition font-semibold disabled:opacity-50 text-sm"
            >
              <Save size={18} />
              {saving ? 'Saving...' : 'Save Attendance'}
            </button>
          </div>
        </div>

        {/* Messages */}
        {success && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-900/50 text-green-700 dark:text-green-300 px-4 py-3 rounded-lg mb-6">
            ✅ {success}
          </motion.div>
        )}
        {error && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-900/50 text-red-700 dark:text-red-300 px-4 py-3 rounded-lg mb-6">
            {error}
          </motion.div>
        )}

        {/* No classes assigned warning */}
        {!loading && classes.length === 0 && (
          <div className="bg-yellow-50 dark:bg-yellow-900/30 border border-yellow-200 rounded-lg p-6 mb-6 flex items-start gap-3">
            <AlertCircle size={24} className="text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-yellow-800">No classes assigned</p>
              <p className="text-sm text-yellow-700 dark:text-yellow-300 mt-1">
                Ask your admin to assign you to a class. Once assigned, students will appear here automatically.
              </p>
            </div>
          </div>
        )}

        {/* Stats */}
        <div className="grid md:grid-cols-5 gap-4 mb-6">
          {[
            { label: 'Total', value: stats.total, bg: 'bg-gray-50', border: 'border-gray-200', text: 'text-gray-600', num: 'text-gray-700' },
            { label: 'Present', value: stats.present, bg: 'bg-green-50', border: 'border-green-200', text: 'text-green-600', num: 'text-green-700' },
            { label: 'Absent', value: stats.absent, bg: 'bg-red-50', border: 'border-red-200', text: 'text-red-600', num: 'text-red-700' },
            { label: 'Late', value: stats.late, bg: 'bg-orange-50', border: 'border-orange-200', text: 'text-orange-600', num: 'text-orange-700' },
            { label: 'Excused', value: stats.excused, bg: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-600', num: 'text-blue-700' },
          ].map(s => (
            <div key={s.label} className={`${s.bg} rounded-lg p-4 border ${s.border}`}>
              <p className={`text-sm ${s.text}`}>{s.label}</p>
              <p className={`text-2xl font-bold ${s.num} mt-1`}>{s.value}</p>
            </div>
          ))}
        </div>

        <div className="bg-purple-50 dark:bg-purple-900/30 border border-purple-200 dark:border-purple-900/50 rounded-lg p-4 mb-6 flex justify-between items-center">
          <div>
            <p className="text-sm font-medium text-purple-600 dark:text-purple-400">Attendance Rate</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">(Present + Late) / Total</p>
          </div>
          <p className="text-3xl font-bold text-purple-700 dark:text-purple-300">{attendanceRate}%</p>
        </div>

        {/* Table */}
        {loading ? (
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-12 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600 mx-auto"></div>
            <p className="mt-4 text-gray-600 dark:text-gray-300">Loading students...</p>
          </div>
        ) : students.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-12 text-center">
            <AlertCircle size={48} className="mx-auto text-gray-300 dark:text-gray-400 mb-4" />
            <p className="text-gray-600 dark:text-gray-300 font-medium">No students found</p>
            <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">
              {classes.length === 0
                ? 'You have no assigned classes yet.'
                : 'No active students in the selected class.'}
            </p>
          </div>
        ) : (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-200">Student</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-200">Enrollment No</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-200">Grade / Section</th>
                    <th className="px-6 py-3 text-center text-sm font-semibold text-gray-700 dark:text-gray-200">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {students.map((student, idx) => (
                    <motion.tr
                      key={student._id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.03 }}
                      className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800 transition"
                    >
                      <td className="px-6 py-4 font-medium text-gray-800 dark:text-gray-100">{student.name}</td>
                      <td className="px-6 py-4 text-gray-600 dark:text-gray-300 font-mono text-sm">{student.enrollmentNumber}</td>
                      <td className="px-6 py-4 text-gray-600 dark:text-gray-300">{student.grade} — {student.section}</td>
                      <td className="px-6 py-4">
                        <div className="flex justify-center gap-2 flex-wrap">
                          {['present','absent','late','excused'].map(status => {
                            const icons = { present: <CheckCircle size={13} />, absent: <XCircle size={13} />, late: <Clock size={13} />, excused: <AlertCircle size={13} /> }
                            const colors = {
                              present:  { active: 'bg-green-500 text-white shadow-md',  idle: 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-green-100' },
                              absent:   { active: 'bg-red-500 text-white shadow-md',    idle: 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-red-100' },
                              late:     { active: 'bg-orange-500 text-white shadow-md', idle: 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-orange-100' },
                              excused:  { active: 'bg-blue-500 text-white shadow-md',   idle: 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-blue-100' },
                            }
                            const isActive = attendance[student._id] === status
                            return (
                              <button
                                key={status}
                                onClick={() => handleStatusChange(student._id, status)}
                                className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium transition capitalize ${isActive ? colors[status].active : colors[status].idle}`}
                              >
                                {icons[status]}
                                {status.charAt(0).toUpperCase() + status.slice(1)}
                              </button>
                            )
                          })}
                        </div>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  )
}
