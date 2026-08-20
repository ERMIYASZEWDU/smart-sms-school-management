import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Calendar, Clock, BookOpen, User, MapPin } from 'lucide-react'
import { getStudentTimetable } from '../../services/studentApi'

export const StudentTimetable = () => {
  const [timetable, setTimetable] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const daysOrder = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']

  useEffect(() => {
    fetchTimetable()
  }, [])

  const fetchTimetable = async () => {
    try {
      setLoading(true)
      const data = await getStudentTimetable()
      setTimetable(data)
      setError('')
    } catch (err) {
      console.error('Error fetching timetable:', err)
      setError('Failed to load timetable')
    } finally {
      setLoading(false)
    }
  }

  const groupByDay = () => {
    const grouped = {}
    daysOrder.forEach(day => {
      grouped[day] = timetable.filter(item => item.dayOfWeek === day)
        .sort((a, b) => a.startTime.localeCompare(b.startTime))
    })
    return grouped
  }

  const getTimeColor = (startTime) => {
    const hour = parseInt(startTime.split(':')[0])
    if (hour < 10) return 'bg-blue-100 dark:bg-blue-900/40 border-blue-300 text-blue-700 dark:text-blue-300'
    if (hour < 12) return 'bg-green-100 dark:bg-green-900/40 border-green-300 text-green-700 dark:text-green-300'
    if (hour < 14) return 'bg-yellow-100 dark:bg-yellow-900/40 border-yellow-300 text-yellow-700 dark:text-yellow-300'
    if (hour < 16) return 'bg-orange-100 dark:bg-orange-900/40 border-orange-300 text-orange-700 dark:text-orange-300'
    return 'bg-purple-100 dark:bg-purple-900/40 border-purple-300 text-purple-700 dark:text-purple-300'
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6 pt-8 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-300">Loading timetable...</p>
        </div>
      </div>
    )
  }

  const groupedTimetable = groupByDay()

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 dark:from-gray-900 via-blue-50 dark:via-blue-900/40 to-purple-50 dark:to-purple-900/40 p-6 pt-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-7xl mx-auto"
      >
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <Calendar size={36} className="text-blue-600 dark:text-blue-400" />
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              My Timetable
            </h1>
          </div>
          <p className="text-gray-600 dark:text-gray-300">Your weekly class schedule</p>
        </div>

        {error && (
          <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-900/50 text-red-700 dark:text-red-300 px-4 py-3 rounded-lg mb-6">
            {error}
          </div>
        )}

        {/* Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg border border-gray-100 dark:border-gray-800">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 dark:text-gray-300 text-sm font-medium mb-1">Total Classes</p>
                <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">{timetable.length}</p>
              </div>
              <BookOpen size={28} className="text-blue-600 dark:text-blue-400" />
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg border border-gray-100 dark:border-gray-800">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 dark:text-gray-300 text-sm font-medium mb-1">Subjects</p>
                <p className="text-3xl font-bold text-green-600 dark:text-green-400">
                  {new Set(timetable.map(t => t.subjectId?._id)).size}
                </p>
              </div>
              <BookOpen size={28} className="text-green-600 dark:text-green-400" />
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg border border-gray-100 dark:border-gray-800">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 dark:text-gray-300 text-sm font-medium mb-1">Active Days</p>
                <p className="text-3xl font-bold text-purple-600 dark:text-purple-400">
                  {Object.values(groupedTimetable).filter(day => day.length > 0).length}
                </p>
              </div>
              <Calendar size={28} className="text-purple-600 dark:text-purple-400" />
            </div>
          </div>
        </div>

        {/* Timetable by Day */}
        <div className="space-y-6">
          {daysOrder.map((day, dayIndex) => (
            groupedTimetable[day].length > 0 && (
              <motion.div
                key={day}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: dayIndex * 0.1 }}
                className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-800 overflow-hidden"
              >
                {/* Day Header */}
                <div className="bg-gradient-to-r from-blue-600 to-purple-600 px-6 py-4">
                  <h3 className="text-xl font-bold text-white flex items-center gap-2">
                    <Calendar size={24} />
                    {day}
                  </h3>
                </div>

                {/* Classes for the Day */}
                <div className="p-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {groupedTimetable[day].map((item, index) => (
                      <motion.div
                        key={item._id}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: index * 0.05 }}
                        className={`rounded-xl border-2 p-4 hover:shadow-md transition-all ${getTimeColor(item.startTime)}`}
                      >
                        {/* Time */}
                        <div className="flex items-center gap-2 mb-3">
                          <Clock size={18} />
                          <span className="font-bold text-lg">
                            {item.startTime} - {item.endTime}
                          </span>
                        </div>

                        {/* Subject */}
                        <div className="mb-3">
                          <div className="flex items-center gap-2 mb-1">
                            <BookOpen size={16} />
                            <span className="text-sm font-medium">Subject</span>
                          </div>
                          <p className="text-lg font-bold">
                            {item.subjectId?.name || 'Unknown Subject'}
                          </p>
                          <p className="text-xs opacity-75">
                            {item.subjectId?.code || ''}
                          </p>
                        </div>

                        {/* Teacher */}
                        <div className="mb-3">
                          <div className="flex items-center gap-2 mb-1">
                            <User size={16} />
                            <span className="text-sm font-medium">Teacher</span>
                          </div>
                          <p className="text-sm font-semibold">
                            {item.teacherId?.name || 'N/A'}
                          </p>
                        </div>

                        {/* Room */}
                        {item.room && (
                          <div className="flex items-center gap-2">
                            <MapPin size={16} />
                            <span className="text-sm">
                              Room: <span className="font-semibold">{item.room}</span>
                            </span>
                          </div>
                        )}
                      </motion.div>
                    ))}
                  </div>
                </div>
              </motion.div>
            )
          ))}
        </div>

        {/* No Timetable */}
        {timetable.length === 0 && (
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-800 p-12 text-center">
            <Calendar size={64} className="text-gray-300 dark:text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500 dark:text-gray-400 text-lg">No timetable available yet</p>
            <p className="text-gray-400 dark:text-gray-500 text-sm mt-2">
              Your class schedule will appear here once the admin creates it
            </p>
          </div>
        )}
      </motion.div>
    </div>
  )
}
