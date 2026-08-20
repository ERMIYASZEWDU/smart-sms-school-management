import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { FileText, Plus, Edit, Trash2, Calendar, Clock, Users, Award } from 'lucide-react'
import { Modal } from '../../components/Modal'
import { Button } from '../../components/Button'
import { Input } from '../../components/Input'

export const Examinations = () => {
  const [exams, setExams] = useState([
    { 
      id: 1, 
      name: 'Mid-Term Exam', 
      subject: 'Mathematics', 
      class: 'Grade 10-A', 
      date: '2026-02-15', 
      time: '09:00 AM', 
      duration: '2 hours', 
      markBreakdown: { quiz: 10, midExam: 30, finalExam: 60 },
      totalMarks: 100, 
      status: 'Scheduled' 
    },
    { 
      id: 2, 
      name: 'Mid-Term Exam', 
      subject: 'English', 
      class: 'Grade 10-A', 
      date: '2026-02-16', 
      time: '09:00 AM', 
      duration: '2 hours', 
      markBreakdown: { quiz: 15, midExam: 35, finalExam: 50 },
      totalMarks: 100, 
      status: 'Scheduled' 
    },
    { 
      id: 3, 
      name: 'Mid-Term Exam', 
      subject: 'Science', 
      class: 'Grade 9-B', 
      date: '2026-02-17', 
      time: '10:00 AM', 
      duration: '1.5 hours', 
      markBreakdown: { quiz: 10, midExam: 25, finalExam: 40 },
      totalMarks: 75, 
      status: 'Scheduled' 
    },
    { 
      id: 4, 
      name: 'Quiz', 
      subject: 'Mathematics', 
      class: 'Grade 12-A', 
      date: '2026-01-20', 
      time: '11:00 AM', 
      duration: '30 minutes', 
      markBreakdown: { quiz: 20, midExam: 0, finalExam: 0 },
      totalMarks: 20, 
      status: 'Completed' 
    },
    { 
      id: 5, 
      name: 'Final Exam', 
      subject: 'Social Studies', 
      class: 'Grade 11-A', 
      date: '2026-03-10', 
      time: '09:00 AM', 
      duration: '3 hours', 
      markBreakdown: { quiz: 10, midExam: 30, finalExam: 60 },
      totalMarks: 100, 
      status: 'Scheduled' 
    },
    { 
      id: 6, 
      name: 'Unit Test', 
      subject: 'Computer Science', 
      class: 'Grade 11-B', 
      date: '2026-01-25', 
      time: '02:00 PM', 
      duration: '1 hour', 
      markBreakdown: { quiz: 10, midExam: 40, finalExam: 0 },
      totalMarks: 50, 
      status: 'In Progress' 
    },
    { 
      id: 7, 
      name: 'Mid-Term Exam', 
      subject: 'Amharic', 
      class: 'Grade 10-B', 
      date: '2026-02-18', 
      time: '09:00 AM', 
      duration: '2 hours', 
      markBreakdown: { quiz: 10, midExam: 30, finalExam: 60 },
      totalMarks: 100, 
      status: 'Scheduled' 
    },
    { 
      id: 8, 
      name: 'Practical Exam', 
      subject: 'Science Lab', 
      class: 'Grade 12-A', 
      date: '2026-02-20', 
      time: '10:00 AM', 
      duration: '2 hours', 
      markBreakdown: { quiz: 0, midExam: 0, finalExam: 50 },
      totalMarks: 50, 
      status: 'Scheduled' 
    }
  ])

  const [showAddModal, setShowAddModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [selectedExam, setSelectedExam] = useState(null)
  const [formData, setFormData] = useState({
    name: '',
    subject: '',
    class: '',
    date: '',
    time: '',
    duration: '',
    quiz: 10,
    midExam: 30,
    finalExam: 60,
    totalMarks: 100,
    status: 'Scheduled'
  })

  // Calculate total marks from breakdown
  const calculateTotalMarks = (quiz, midExam, finalExam) => {
    return parseInt(quiz || 0) + parseInt(midExam || 0) + parseInt(finalExam || 0)
  }

  const handleAdd = () => {
    setFormData({ 
      name: '', 
      subject: '', 
      class: '', 
      date: '', 
      time: '', 
      duration: '', 
      quiz: 10,
      midExam: 30,
      finalExam: 60,
      totalMarks: 100,
      status: 'Scheduled' 
    })
    setShowAddModal(true)
  }

  const handleEdit = (exam) => {
    setSelectedExam(exam)
    setFormData({
      ...exam,
      quiz: exam.markBreakdown.quiz,
      midExam: exam.markBreakdown.midExam,
      finalExam: exam.markBreakdown.finalExam
    })
    setShowEditModal(true)
  }

  const handleDelete = (id) => {
    if (window.confirm('Are you sure you want to delete this examination?')) {
      setExams(exams.filter(e => e.id !== id))
      alert('Examination deleted successfully!')
    }
  }

  const handleSave = () => {
    const totalMarks = calculateTotalMarks(formData.quiz, formData.midExam, formData.finalExam)
    
    const examData = {
      ...formData,
      markBreakdown: {
        quiz: parseInt(String(formData.quiz || '0')),
        midExam: parseInt(String(formData.midExam || '0')),
        finalExam: parseInt(String(formData.finalExam || '0'))
      },
      totalMarks
    }
    
    if (showAddModal) {
      const newExam = {
        ...examData,
        id: Math.max(...exams.map(e => e.id)) + 1
      }
      setExams([...exams, newExam])
      alert('Examination added successfully!')
    } else {
      setExams(exams.map(e => e.id === selectedExam.id ? { ...examData, id: selectedExam.id } : e))
      alert('Examination updated successfully!')
    }
    setShowAddModal(false)
    setShowEditModal(false)
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'Scheduled': return 'bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 border-blue-300'
      case 'In Progress': return 'bg-orange-100 dark:bg-orange-900/40 text-orange-700 dark:text-orange-300 border-orange-300'
      case 'Completed': return 'bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300 border-green-300'
      case 'Cancelled': return 'bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300 border-red-300'
      default: return 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-200 border-gray-300 dark:border-gray-600'
    }
  }

  const stats = {
    total: exams.length,
    scheduled: exams.filter(e => e.status === 'Scheduled').length,
    inProgress: exams.filter(e => e.status === 'In Progress').length,
    completed: exams.filter(e => e.status === 'Completed').length
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 dark:from-gray-900 via-blue-50 dark:via-blue-900/40 to-purple-50 dark:to-purple-900/40 p-6 pt-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-7xl mx-auto"
      >
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <div className="flex items-center gap-3">
              <FileText size={36} className="text-indigo-600 dark:text-indigo-400" />
              <h1 className="text-4xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                Examinations
              </h1>
            </div>
            <p className="text-gray-600 dark:text-gray-300 mt-2">Manage exams, tests, and assessments</p>
          </div>
          <Button onClick={handleAdd} className="flex items-center gap-2">
            <Plus size={20} />
            Schedule New Exam
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg border border-gray-100 dark:border-gray-800"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 dark:text-gray-300 text-sm font-medium mb-1">Total Exams</p>
                <p className="text-3xl font-bold text-indigo-600 dark:text-indigo-400">{stats.total}</p>
              </div>
              <div className="p-4 bg-indigo-50 dark:bg-indigo-900/30 rounded-xl">
                <FileText size={28} className="text-indigo-600 dark:text-indigo-400" />
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
                <p className="text-gray-600 dark:text-gray-300 text-sm font-medium mb-1">Scheduled</p>
                <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">{stats.scheduled}</p>
              </div>
              <div className="p-4 bg-blue-50 dark:bg-blue-900/30 rounded-xl">
                <Calendar size={28} className="text-blue-600 dark:text-blue-400" />
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
                <p className="text-gray-600 dark:text-gray-300 text-sm font-medium mb-1">In Progress</p>
                <p className="text-3xl font-bold text-orange-600 dark:text-orange-400">{stats.inProgress}</p>
              </div>
              <div className="p-4 bg-orange-50 dark:bg-orange-900/30 rounded-xl">
                <Clock size={28} className="text-orange-600 dark:text-orange-400" />
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
                <p className="text-gray-600 dark:text-gray-300 text-sm font-medium mb-1">Completed</p>
                <p className="text-3xl font-bold text-green-600 dark:text-green-400">{stats.completed}</p>
              </div>
              <div className="p-4 bg-green-50 dark:bg-green-900/30 rounded-xl">
                <Award size={28} className="text-green-600 dark:text-green-400" />
              </div>
            </div>
          </motion.div>
        </div>

        {/* Examinations Table */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-800 overflow-hidden"
        >
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gradient-to-r from-indigo-50 dark:from-indigo-900/40 to-purple-50 dark:to-purple-900/40">
                <tr>
                  <th className="text-left p-4 font-bold text-gray-700 dark:text-gray-200">Exam Name</th>
                  <th className="text-left p-4 font-bold text-gray-700 dark:text-gray-200">Subject</th>
                  <th className="text-left p-4 font-bold text-gray-700 dark:text-gray-200">Class</th>
                  <th className="text-left p-4 font-bold text-gray-700 dark:text-gray-200">Date</th>
                  <th className="text-left p-4 font-bold text-gray-700 dark:text-gray-200">Time</th>
                  <th className="text-left p-4 font-bold text-gray-700 dark:text-gray-200">Duration</th>
                  <th className="text-left p-4 font-bold text-gray-700 dark:text-gray-200">Mark Breakdown</th>
                  <th className="text-left p-4 font-bold text-gray-700 dark:text-gray-200">Total</th>
                  <th className="text-left p-4 font-bold text-gray-700 dark:text-gray-200">Status</th>
                  <th className="text-left p-4 font-bold text-gray-700 dark:text-gray-200">Actions</th>
                </tr>
              </thead>
              <tbody>
                {exams.map((exam, index) => (
                  <motion.tr
                    key={exam.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.6 + index * 0.05 }}
                    className="border-b border-gray-100 dark:border-gray-800 hover:bg-indigo-50 transition-colors"
                  >
                    <td className="p-4 font-semibold text-gray-800 dark:text-gray-100">{exam.name}</td>
                    <td className="p-4 text-indigo-600 dark:text-indigo-400 font-medium">{exam.subject}</td>
                    <td className="p-4 text-gray-700 dark:text-gray-200">{exam.class}</td>
                    <td className="p-4 text-gray-700 dark:text-gray-200">{new Date(exam.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</td>
                    <td className="p-4 text-gray-700 dark:text-gray-200">{exam.time}</td>
                    <td className="p-4 text-gray-700 dark:text-gray-200">{exam.duration}</td>
                    <td className="p-4">
                      <div className="text-xs space-y-1">
                        <div className="flex justify-between">
                          <span className="text-gray-600 dark:text-gray-300">Quiz:</span>
                          <span className="font-semibold text-blue-600 dark:text-blue-400">{exam.markBreakdown.quiz}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600 dark:text-gray-300">Mid:</span>
                          <span className="font-semibold text-purple-600 dark:text-purple-400">{exam.markBreakdown.midExam}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600 dark:text-gray-300">Final:</span>
                          <span className="font-semibold text-green-600 dark:text-green-400">{exam.markBreakdown.finalExam}</span>
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <span className="text-xl font-bold text-gray-800 dark:text-gray-100">{exam.totalMarks}</span>
                    </td>
                    <td className="p-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold border-2 ${getStatusColor(exam.status)}`}>
                        {exam.status}
                      </span>
                    </td>
                    <td className="p-4">
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleEdit(exam)}
                          className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition"
                        >
                          <Edit size={16} className="text-gray-600 dark:text-gray-300" />
                        </button>
                        <button
                          onClick={() => handleDelete(exam.id)}
                          className="p-2 hover:bg-red-50 rounded-lg transition"
                        >
                          <Trash2 size={16} className="text-red-600 dark:text-red-400" />
                        </button>
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>
      </motion.div>

      {/* Add/Edit Modal */}
      {(showAddModal || showEditModal) && (
        <Modal
          isOpen={showAddModal || showEditModal}
          onClose={() => {
            setShowAddModal(false)
            setShowEditModal(false)
          }}
          title={showAddModal ? 'Schedule New Exam' : 'Edit Examination'}
        >
          <div className="space-y-4">
            <Input
              label="Exam Name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g., Mid-Term Exam"
            />
            <Input
              label="Subject"
              value={formData.subject}
              onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
              placeholder="e.g., Mathematics"
            />
            <Input
              label="Class"
              value={formData.class}
              onChange={(e) => setFormData({ ...formData, class: e.target.value })}
              placeholder="e.g., Class 1-A"
            />
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Date"
                type="date"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
              />
              <Input
                label="Time"
                type="time"
                value={formData.time}
                onChange={(e) => setFormData({ ...formData, time: e.target.value })}
              />
            </div>
            <Input
              label="Duration"
              value={formData.duration}
              onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
              placeholder="e.g., 2 hours"
            />
            
            {/* Mark Breakdown Section */}
            <div className="border-t pt-4 mt-4">
              <h3 className="text-base font-semibold text-gray-800 dark:text-gray-100 mb-3">Mark Breakdown</h3>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
                    Quiz Marks
                  </label>
                  <Input
                    type="number"
                    value={formData.quiz}
                    onChange={(e) => setFormData({ ...formData, quiz: e.target.value })}
                    placeholder="10"
                    min="0"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
                    Mid Exam
                  </label>
                  <Input
                    type="number"
                    value={formData.midExam}
                    onChange={(e) => setFormData({ ...formData, midExam: e.target.value })}
                    placeholder="30"
                    min="0"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
                    Final Exam
                  </label>
                  <Input
                    type="number"
                    value={formData.finalExam}
                    onChange={(e) => setFormData({ ...formData, finalExam: e.target.value })}
                    placeholder="60"
                    min="0"
                  />
                </div>
              </div>
              
              {/* Total Marks Display */}
              <div className="mt-4 p-3 bg-gradient-to-r from-blue-50 dark:from-blue-900/40 to-purple-50 dark:to-purple-900/40 rounded-lg border-2 border-blue-200 dark:border-blue-900/50">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-semibold text-gray-700 dark:text-gray-200">Total Marks:</span>
                  <span className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">
                    {calculateTotalMarks(formData.quiz, formData.midExam, formData.finalExam)}
                  </span>
                </div>
                <div className="text-xs text-gray-600 dark:text-gray-300 mt-1">
                  Quiz ({formData.quiz || 0}) + Mid ({formData.midExam || 0}) + Final ({formData.finalExam || 0})
                </div>
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">Status</label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-800"
              >
                <option value="Scheduled">Scheduled</option>
                <option value="In Progress">In Progress</option>
                <option value="Completed">Completed</option>
                <option value="Cancelled">Cancelled</option>
              </select>
            </div>
            <div className="flex gap-3 pt-4">
              <Button onClick={handleSave} className="flex-1">
                {showAddModal ? 'Schedule Exam' : 'Save Changes'}
              </Button>
              <Button
                onClick={() => {
                  setShowAddModal(false)
                  setShowEditModal(false)
                }}
                variant="secondary"
                className="flex-1"
              >
                Cancel
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  )
}
