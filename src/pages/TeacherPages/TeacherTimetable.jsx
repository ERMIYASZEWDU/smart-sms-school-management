import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Calendar, Clock } from 'lucide-react'
import { getTimetable } from '../../services/teacherApi'

export const TeacherTimetable = () => {
  const [schedule, setSchedule] = useState({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchTimetable = async () => {
      try {
        setLoading(true)
        const data = await getTimetable()
        setSchedule(data)
      } catch (error) {
        console.error('Error fetching timetable:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchTimetable()
  }, [])

  const days = Object.keys(schedule)

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6 pt-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-7xl mx-auto"
      >
        <div className="mb-8">
          <div className="flex items-center gap-3">
            <Calendar size={36} className="text-indigo-600 dark:text-indigo-400" />
            <h1 className="text-4xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
              My Timetable
            </h1>
          </div>
          <p className="text-gray-600 dark:text-gray-300 mt-2">Your weekly teaching schedule</p>
        </div>

        {loading ? (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-12 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
            <p className="mt-4 text-gray-600 dark:text-gray-300">Loading timetable...</p>
          </div>
        ) : days.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-12 text-center">
            <Calendar size={48} className="mx-auto text-gray-300 dark:text-gray-400 mb-4" />
            <p className="text-gray-600 dark:text-gray-300">No timetable available</p>
          </div>
        ) : (
          <div className="grid gap-6">
            {days.map((day) => (
              <motion.div
                key={day}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden"
              >
                <div className="bg-gradient-to-r from-indigo-50 dark:from-indigo-900/40 to-purple-50 dark:to-purple-900/40 px-6 py-3 border-b">
                  <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100">{day}</h3>
                </div>
                <div className="p-6">
                  <div className="space-y-4">
                    {schedule[day].map((slot, index) => (
                      <div
                        key={index}
                        className="flex items-center gap-4 p-4 bg-gray-50 dark:bg-gray-900 rounded-lg hover:bg-indigo-50 transition"
                      >
                        <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 min-w-[140px]">
                          <Clock size={18} />
                          <span className="font-semibold">{slot.time}</span>
                        </div>
                        <div className="flex-1">
                          <h4 className="font-bold text-gray-800 dark:text-gray-100">{slot.subject}</h4>
                          <p className="text-sm text-gray-600 dark:text-gray-300">{slot.class}</p>
                        </div>
                        <div className="text-right">
                          <span className="px-3 py-1 bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300 rounded-full text-sm font-medium">
                            Room {slot.room}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </motion.div>
    </div>
  )
}
