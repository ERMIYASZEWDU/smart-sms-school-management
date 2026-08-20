import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { Calendar, Plus, Download, RefreshCw, Edit, Trash2, Save, X, Settings } from 'lucide-react'
import { Modal } from '../../components/Modal'
import { Button } from '../../components/Button'
import { Input } from '../../components/Input'

const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']

const subjects = ['Mathematics', 'English', 'Science', 'History', 'Geography', 'Physics', 'Chemistry', 'Biology', 'Computer Science', 'Physical Education', 'Art', 'Music']
const teachers = ['Mr. John Smith', 'Ms. Sarah Johnson', 'Dr. Michael Brown', 'Mrs. Emily Davis', 'Mr. David Wilson', 'Ms. Lisa Anderson', 'Dr. James Taylor']
const classes = ['Class 9-A', 'Class 9-B', 'Class 10-A', 'Class 10-B', 'Class 11-Science', 'Class 11-Arts', 'Class 12-Science', 'Class 12-Arts']

export const Timetable = () => {
  const [selectedClass, setSelectedClass] = useState('Class 9-A')
  const [timetableData, setTimetableData] = useState({})
  const [isGenerating, setIsGenerating] = useState(false)
  const [editMode, setEditMode] = useState(false)
  const [showAddModal, setShowAddModal] = useState(false)
  const [showSettingsModal, setShowSettingsModal] = useState(false)
  const [selectedCell, setSelectedCell] = useState(null)
  const [formData, setFormData] = useState({ subject: '', teacher: '', room: '' })
  
  // Timetable Settings
  const [timetableSettings, setTimetableSettings] = useState({
    numberOfPeriods: 7,
    periodDuration: 45, // minutes
    enableBreak: true,
    breakAfterPeriod: 3,
    breakDuration: 15, // minutes
    enableLunch: true,
    lunchAfterPeriod: 5,
    lunchDuration: 45, // minutes
    startTime: '08:00'
  })

  // Helper functions
  const timeToMinutes = (time) => {
    const [hours, minutes] = time.split(':').map(Number)
    return hours * 60 + minutes
  }

  const minutesToTime = (minutes) => {
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`
  }

  // Generate time slots dynamically based on settings
  const generateTimeSlots = () => {
    const slots = []
    const { numberOfPeriods, periodDuration, enableBreak, breakAfterPeriod, breakDuration, enableLunch, lunchAfterPeriod, lunchDuration, startTime } = timetableSettings
    
    let currentTime = startTime
    let slotId = 1
    
    for (let i = 1; i <= numberOfPeriods; i++) {
      const startMinutes = timeToMinutes(currentTime)
      const endMinutes = startMinutes + periodDuration
      const endTime = minutesToTime(endMinutes)
      
      slots.push({
        id: slotId++,
        time: `${currentTime} - ${endTime}`,
        period: `Period ${i}`,
        isBreak: false
      })
      
      currentTime = endTime
      
      // Add break after specified period (if enabled)
      if (enableBreak && i === breakAfterPeriod) {
        const breakStart = currentTime
        const breakEnd = minutesToTime(timeToMinutes(currentTime) + breakDuration)
        slots.push({
          id: slotId++,
          time: `${breakStart} - ${breakEnd}`,
          period: 'Break',
          isBreak: true
        })
        currentTime = breakEnd
      }
      
      // Add lunch after specified period (if enabled)
      if (enableLunch && i === lunchAfterPeriod) {
        const lunchStart = currentTime
        const lunchEnd = minutesToTime(timeToMinutes(currentTime) + lunchDuration)
        slots.push({
          id: slotId++,
          time: `${lunchStart} - ${lunchEnd}`,
          period: 'Lunch',
          isBreak: true
        })
        currentTime = lunchEnd
      }
    }
    
    return slots
  }

  const timeSlots = generateTimeSlots()

  // Generate random timetable
  const generateTimetable = () => {
    setIsGenerating(true)
    
    setTimeout(() => {
      const newTimetable = {}
      
      daysOfWeek.forEach(day => {
        newTimetable[day] = {}
        timeSlots.forEach(slot => {
          if (!slot.isBreak) {
            const randomSubject = subjects[Math.floor(Math.random() * subjects.length)]
            const randomTeacher = teachers[Math.floor(Math.random() * teachers.length)]
            const roomNumber = Math.floor(Math.random() * 50) + 101
            
            newTimetable[day][slot.id] = {
              subject: randomSubject,
              teacher: randomTeacher,
              room: `Room ${roomNumber}`
            }
          }
        })
      })
      
      setTimetableData(newTimetable)
      setIsGenerating(false)
    }, 1500)
  }

  const handleCellClick = (day, slotId) => {
    if (editMode && !timeSlots.find(s => s.id === slotId)?.isBreak) {
      setSelectedCell({ day, slotId })
      const existingData = timetableData[day]?.[slotId]
      if (existingData) {
        setFormData({
          subject: existingData.subject,
          teacher: existingData.teacher,
          room: existingData.room
        })
      } else {
        setFormData({ subject: '', teacher: '', room: '' })
      }
      setShowAddModal(true)
    }
  }

  const handleSaveCell = () => {
    if (selectedCell && formData.subject && formData.teacher) {
      setTimetableData(prev => ({
        ...prev,
        [selectedCell.day]: {
          ...prev[selectedCell.day],
          [selectedCell.slotId]: {
            subject: formData.subject,
            teacher: formData.teacher,
            room: formData.room
          }
        }
      }))
      setShowAddModal(false)
      setFormData({ subject: '', teacher: '', room: '' })
    }
  }

  const handleDeleteCell = (day, slotId, e) => {
    e.stopPropagation()
    const newTimetable = { ...timetableData }
    if (newTimetable[day]) {
      delete newTimetable[day][slotId]
    }
    setTimetableData(newTimetable)
  }

  const exportTimetable = () => {
    try {
      const csvContent = generateCSV()
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.setAttribute('href', url)
      link.setAttribute('download', `${selectedClass}_timetable.csv`)
      link.style.visibility = 'hidden'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)
    } catch (error) {
      console.error('Error exporting CSV:', error)
      alert('Failed to export timetable. Please try again.')
    }
  }

  const generateCSV = () => {
    let csv = 'Time/Day,' + daysOfWeek.join(',') + '\n'
    
    timeSlots.forEach(slot => {
      csv += `"${slot.time} (${slot.period})"`
      
      daysOfWeek.forEach(day => {
        const cellData = timetableData[day]?.[slot.id]
        if (slot.isBreak) {
          csv += ',"' + slot.period + '"'
        } else if (cellData) {
          csv += `,"${cellData.subject} | ${cellData.teacher} | ${cellData.room}"`
        } else {
          csv += ',""'
        }
      })
      csv += '\n'
    })
    
    return csv
  }

  const handleSaveSettings = () => {
    setShowSettingsModal(false)
    // Regenerate timetable if it exists
    if (Object.keys(timetableData).length > 0) {
      generateTimetable()
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-full mx-auto"
      >
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100 flex items-center gap-2">
              <Calendar className="text-blue-600 dark:text-blue-400" />
              Class Timetable
            </h1>
            <p className="text-gray-600 dark:text-gray-300 mt-1">Manage and generate class schedules</p>
          </div>

          <div className="flex gap-2 flex-wrap">
            <Button
              onClick={() => setShowSettingsModal(true)}
              variant="outline"
              className="flex items-center gap-2"
            >
              <Settings className="w-4 h-4" />
              Settings
            </Button>

            <Button
              onClick={generateTimetable}
              disabled={isGenerating}
              className="flex items-center gap-2"
            >
              <RefreshCw className={`w-4 h-4 ${isGenerating ? 'animate-spin' : ''}`} />
              {isGenerating ? 'Generating...' : 'Auto Generate'}
            </Button>
            
            <Button
              onClick={() => setEditMode(!editMode)}
              variant={editMode ? 'primary' : 'secondary'}
              className="flex items-center gap-2"
            >
              <Edit className="w-4 h-4" />
              {editMode ? 'Done Editing' : 'Edit Mode'}
            </Button>

            <Button
              onClick={exportTimetable}
              variant="secondary"
              className="flex items-center gap-2"
              disabled={Object.keys(timetableData).length === 0}
            >
              <Download className="w-4 h-4" />
              Export CSV
            </Button>
          </div>
        </div>

        {/* Class Selector */}
        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 mb-6 shadow-sm">
          <label className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-2">
            Select Class
          </label>
          <select
            value={selectedClass}
            onChange={(e) => setSelectedClass(e.target.value)}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-800"
          >
            {classes.map(cls => (
              <option key={cls} value={cls}>{cls}</option>
            ))}
          </select>
        </div>

        {/* Timetable Grid */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-max">
              <thead className="bg-gradient-to-r from-blue-600 to-blue-700">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-white border-r border-blue-500">
                    Time / Day
                  </th>
                  {daysOfWeek.map(day => (
                    <th key={day} className="px-4 py-3 text-center text-sm font-semibold text-white border-r border-blue-500 last:border-r-0">
                      {day}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {timeSlots.map((slot, idx) => (
                  <tr key={slot.id} className={`border-b ${idx % 2 === 0 ? 'bg-white dark:bg-gray-800' : 'bg-gray-50 dark:bg-gray-900'}`}>
                    <td className={`px-4 py-3 border-r ${slot.isBreak ? 'bg-yellow-50 dark:bg-yellow-900/30 font-semibold text-yellow-800' : 'text-gray-700 dark:text-gray-200'}`}>
                      <div className="text-sm font-medium">{slot.time}</div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">{slot.period}</div>
                    </td>
                    {daysOfWeek.map(day => {
                      const cellData = timetableData[day]?.[slot.id]
                      
                      if (slot.isBreak) {
                        return (
                          <td key={day} className="px-4 py-3 text-center bg-yellow-50 dark:bg-yellow-900/30 border-r last:border-r-0">
                            <span className="text-sm font-semibold text-yellow-800">{slot.period}</span>
                          </td>
                        )
                      }
                      
                      return (
                        <td
                          key={day}
                          onClick={() => handleCellClick(day, slot.id)}
                          className={`px-4 py-3 border-r last:border-r-0 relative group ${
                            editMode ? 'cursor-pointer hover:bg-blue-50 dark:hover:bg-blue-900/40' : ''
                          } ${cellData ? 'bg-gradient-to-br from-blue-50 dark:from-blue-900/40 to-blue-100' : ''}`}
                        >
                          {cellData ? (
                            <motion.div
                              initial={{ opacity: 0, scale: 0.9 }}
                              animate={{ opacity: 1, scale: 1 }}
                              className="relative"
                            >
                              <div className="text-sm font-semibold text-gray-800 dark:text-gray-100 mb-1">
                                {cellData.subject}
                              </div>
                              <div className="text-xs text-gray-600 dark:text-gray-300">{cellData.teacher}</div>
                              <div className="text-xs text-blue-600 dark:text-blue-400 font-medium mt-1">{cellData.room}</div>
                              
                              {editMode && (
                                <button
                                  onClick={(e) => handleDeleteCell(day, slot.id, e)}
                                  className="absolute top-0 right-0 opacity-0 group-hover:opacity-100 transition-opacity p-1 bg-red-500 text-white rounded-full hover:bg-red-600"
                                >
                                  <X className="w-3 h-3" />
                                </button>
                              )}
                            </motion.div>
                          ) : (
                            editMode && (
                              <div className="text-center text-gray-400 dark:text-gray-500 text-sm">
                                <Plus className="w-5 h-5 mx-auto" />
                                <span className="text-xs">Add</span>
                              </div>
                            )
                          )}
                        </td>
                      )
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Empty State */}
        {Object.keys(timetableData).length === 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-12"
          >
            <Calendar className="w-16 h-16 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-200 mb-2">
              No Timetable Generated Yet
            </h3>
            <p className="text-gray-600 dark:text-gray-300 mb-4">
              Click "Auto Generate" to create a timetable automatically or enable "Edit Mode" to create manually
            </p>
          </motion.div>
        )}
      </motion.div>

      {/* Add/Edit Modal */}
      <Modal
        isOpen={showAddModal}
        onClose={() => {
          setShowAddModal(false)
          setFormData({ subject: '', teacher: '', room: '' })
        }}
        title="Add/Edit Period"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">Subject</label>
            <select
              value={formData.subject}
              onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-800"
            >
              <option value="">Select Subject</option>
              {subjects.map(subject => (
                <option key={subject} value={subject}>{subject}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">Teacher</label>
            <select
              value={formData.teacher}
              onChange={(e) => setFormData({ ...formData, teacher: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-800"
            >
              <option value="">Select Teacher</option>
              {teachers.map(teacher => (
                <option key={teacher} value={teacher}>{teacher}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">Room</label>
            <Input
              value={formData.room}
              onChange={(e) => setFormData({ ...formData, room: e.target.value })}
              placeholder="e.g., Room 101"
            />
          </div>

          <div className="flex gap-2 justify-end mt-6">
            <Button
              variant="secondary"
              onClick={() => {
                setShowAddModal(false)
                setFormData({ subject: '', teacher: '', room: '' })
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSaveCell}
              disabled={!formData.subject || !formData.teacher}
            >
              <Save className="w-4 h-4 mr-2" />
              Save
            </Button>
          </div>
        </div>
      </Modal>

      {/* Settings Modal */}
      <Modal
        isOpen={showSettingsModal}
        onClose={() => setShowSettingsModal(false)}
        title="Timetable Settings"
        size="lg"
        footer={
          <div className="flex gap-3 justify-end">
            <Button variant="secondary" onClick={() => setShowSettingsModal(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveSettings}>
              <Save className="w-4 h-4 mr-2" />
              Save Settings
            </Button>
          </div>
        }
      >
        <div className="space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
                Number of Periods (6 or 7)
              </label>
              <select
                value={timetableSettings.numberOfPeriods}
                onChange={(e) => setTimetableSettings({ ...timetableSettings, numberOfPeriods: parseInt(e.target.value) })}
                className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-800"
              >
                <option value={6}>6 Periods</option>
                <option value={7}>7 Periods</option>
                <option value={8}>8 Periods</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
                Period Duration (minutes)
              </label>
              <Input
                type="number"
                value={timetableSettings.periodDuration}
                onChange={(e) => setTimetableSettings({ ...timetableSettings, periodDuration: parseInt(e.target.value) })}
                min="30"
                max="60"
                placeholder="45"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
                School Start Time
              </label>
              <Input
                type="time"
                value={timetableSettings.startTime}
                onChange={(e) => setTimetableSettings({ ...timetableSettings, startTime: e.target.value })}
              />
            </div>
          </div>

          <hr className="border-gray-200 dark:border-gray-700" />

          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-base font-semibold text-gray-800 dark:text-gray-100">Break Settings</h3>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={timetableSettings.enableBreak}
                  onChange={(e) => setTimetableSettings({ ...timetableSettings, enableBreak: e.target.checked })}
                  className="w-4 h-4 text-blue-600 dark:text-blue-400 border-gray-300 dark:border-gray-600 rounded focus:ring-blue-500"
                />
                <span className="text-sm font-medium text-gray-700 dark:text-gray-200">Enable Break</span>
              </label>
            </div>
            <div className={`grid grid-cols-1 md:grid-cols-2 gap-4 ${!timetableSettings.enableBreak ? 'opacity-50 pointer-events-none' : ''}`}>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
                  Break After Period
                </label>
                <select
                  value={timetableSettings.breakAfterPeriod}
                  onChange={(e) => setTimetableSettings({ ...timetableSettings, breakAfterPeriod: parseInt(e.target.value) })}
                  className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-800"
                  disabled={!timetableSettings.enableBreak}
                >
                  {Array.from({ length: timetableSettings.numberOfPeriods }, (_, i) => (
                    <option key={i + 1} value={i + 1}>After Period {i + 1}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
                  Break Duration (minutes)
                </label>
                <Input
                  type="number"
                  value={timetableSettings.breakDuration}
                  onChange={(e) => setTimetableSettings({ ...timetableSettings, breakDuration: parseInt(e.target.value) })}
                  min="10"
                  max="30"
                  placeholder="15"
                  disabled={!timetableSettings.enableBreak}
                />
              </div>
            </div>
          </div>

          <hr className="border-gray-200 dark:border-gray-700" />

          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-base font-semibold text-gray-800 dark:text-gray-100">Lunch Settings</h3>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={timetableSettings.enableLunch}
                  onChange={(e) => setTimetableSettings({ ...timetableSettings, enableLunch: e.target.checked })}
                  className="w-4 h-4 text-blue-600 dark:text-blue-400 border-gray-300 dark:border-gray-600 rounded focus:ring-blue-500"
                />
                <span className="text-sm font-medium text-gray-700 dark:text-gray-200">Enable Lunch</span>
              </label>
            </div>
            <div className={`grid grid-cols-1 md:grid-cols-2 gap-4 ${!timetableSettings.enableLunch ? 'opacity-50 pointer-events-none' : ''}`}>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
                  Lunch After Period
                </label>
                <select
                  value={timetableSettings.lunchAfterPeriod}
                  onChange={(e) => setTimetableSettings({ ...timetableSettings, lunchAfterPeriod: parseInt(e.target.value) })}
                  className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-800"
                  disabled={!timetableSettings.enableLunch}
                >
                  {Array.from({ length: timetableSettings.numberOfPeriods }, (_, i) => (
                    <option key={i + 1} value={i + 1}>After Period {i + 1}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
                  Lunch Duration (minutes)
                </label>
                <Input
                  type="number"
                  value={timetableSettings.lunchDuration}
                  onChange={(e) => setTimetableSettings({ ...timetableSettings, lunchDuration: parseInt(e.target.value) })}
                  min="30"
                  max="60"
                  placeholder="45"
                  disabled={!timetableSettings.enableLunch}
                />
              </div>
            </div>
          </div>

          <div className="bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-900/50 rounded-lg p-4 mt-4">
            <p className="text-sm text-blue-800">
              <strong>Note:</strong> Changing these settings will regenerate the timetable if one exists. 
              Make sure to save any important changes before updating settings.
            </p>
          </div>
        </div>
      </Modal>
    </div>
  )
}
