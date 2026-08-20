import React, { useState } from 'react'
import { Modal } from './Modal'
import { Button } from './Button'
import { Calendar, Check, X, Users } from 'lucide-react'

export const MarkAttendanceModal = ({ isOpen, onClose, onSave, students = [], classes = [] }) => {
  const [selectedClass, setSelectedClass] = useState('')
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])
  const [attendance, setAttendance] = useState({})

  const handleAttendanceToggle = (studentId, status) => {
    setAttendance(prev => ({
      ...prev,
      [studentId]: status
    }))
  }

  const handleMarkAll = (status) => {
    const allAttendance = {}
    students.forEach(student => {
      allAttendance[student._id || student.id] = status
    })
    setAttendance(allAttendance)
  }

  const handleSubmit = () => {
    const attendanceData = {
      class: selectedClass,
      date: date,
      records: students.map(student => ({
        studentId: student._id || student.id,
        name: student.name,
        status: attendance[student._id || student.id] || 'absent'
      }))
    }
    onSave(attendanceData)
    onClose()
  }

  const presentCount = Object.values(attendance).filter(s => s === 'present').length
  const absentCount = Object.values(attendance).filter(s => s === 'absent').length
  const totalCount = students.length

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Mark Attendance" size="lg">
      <div className="space-y-4 sm:space-y-5">
        {/* Date and Class Selection */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
          <div>
            <label className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-200 mb-1.5">
              Date
            </label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-800"
            />
          </div>
          <div>
            <label className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-200 mb-1.5">
              Class
            </label>
            <select
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-800"
            >
              <option value="">Select Class</option>
              {classes.map(cls => (
                <option key={cls._id || cls} value={cls._id || cls}>
                  {cls.name || `Class ${cls}`}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="flex flex-col sm:flex-row gap-2">
          <Button
            type="button"
            variant="secondary"
            onClick={() => handleMarkAll('present')}
            className="flex items-center justify-center gap-2 text-sm"
          >
            <Check className="w-4 h-4" />
            Mark All Present
          </Button>
          <Button
            type="button"
            variant="secondary"
            onClick={() => handleMarkAll('absent')}
            className="flex items-center justify-center gap-2 text-sm"
          >
            <X className="w-4 h-4" />
            Mark All Absent
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-2 sm:gap-4 p-3 sm:p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
          <div className="text-center">
            <div className="text-lg sm:text-2xl font-bold text-gray-800 dark:text-gray-100">{totalCount}</div>
            <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-300">Total</div>
          </div>
          <div className="text-center">
            <div className="text-lg sm:text-2xl font-bold text-green-600 dark:text-green-400">{presentCount}</div>
            <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-300">Present</div>
          </div>
          <div className="text-center">
            <div className="text-lg sm:text-2xl font-bold text-red-600 dark:text-red-400">{absentCount}</div>
            <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-300">Absent</div>
          </div>
        </div>

        {/* Student List */}
        <div className="border rounded-lg overflow-x-auto">
          <div className="max-h-[300px] sm:max-h-[400px] overflow-y-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-900 sticky top-0 z-10">
                <tr>
                  <th className="px-2 sm:px-4 py-2 sm:py-3 text-left text-xs sm:text-sm font-semibold text-gray-700 dark:text-gray-200">Roll</th>
                  <th className="px-2 sm:px-4 py-2 sm:py-3 text-left text-xs sm:text-sm font-semibold text-gray-700 dark:text-gray-200">Student Name</th>
                  <th className="px-2 sm:px-4 py-2 sm:py-3 text-center text-xs sm:text-sm font-semibold text-gray-700 dark:text-gray-200">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {students.map(student => (
                  <tr key={student._id || student.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                    <td className="px-2 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm text-gray-700 dark:text-gray-200">{student.rollNumber}</td>
                    <td className="px-2 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm font-medium text-gray-800 dark:text-gray-100">{student.name}</td>
                    <td className="px-2 sm:px-4 py-2 sm:py-3">
                      <div className="flex justify-center gap-1 sm:gap-2">
                        <button
                          type="button"
                          onClick={() => handleAttendanceToggle(student._id || student.id, 'present')}
                          className={`px-2 sm:px-4 py-1 sm:py-2 rounded-lg text-xs sm:text-sm font-medium transition-all ${
                            attendance[student._id || student.id] === 'present'
                              ? 'bg-green-500 text-white shadow-md'
                              : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                          }`}
                        >
                          <Check className="w-3 h-3 sm:w-4 sm:h-4 inline sm:mr-1" />
                          <span className="hidden sm:inline">Present</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleAttendanceToggle(student._id || student.id, 'absent')}
                          className={`px-2 sm:px-4 py-1 sm:py-2 rounded-lg text-xs sm:text-sm font-medium transition-all ${
                            attendance[student._id || student.id] === 'absent'
                              ? 'bg-red-500 text-white shadow-md'
                              : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                          }`}
                        >
                          <X className="w-3 h-3 sm:w-4 sm:h-4 inline sm:mr-1" />
                          <span className="hidden sm:inline">Absent</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Footer Buttons - Always visible */}
        <div className="flex flex-col-reverse sm:flex-row justify-end gap-2 sm:gap-3 pt-4 border-t border-gray-200 dark:border-gray-700 -mx-4 sm:-mx-6 px-4 sm:px-6 pb-2 bg-gray-50 dark:bg-gray-900 sticky bottom-0">
          <Button type="button" variant="secondary" onClick={onClose} className="w-full sm:w-auto">
            Cancel
          </Button>
          <Button type="button" onClick={handleSubmit} className="w-full sm:w-auto">
            Save Attendance
          </Button>
        </div>
      </div>
    </Modal>
  )
}
