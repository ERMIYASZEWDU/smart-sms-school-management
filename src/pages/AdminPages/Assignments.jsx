import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { FileText, Plus, Edit, Trash2, Calendar, Clock, CheckCircle, AlertCircle } from 'lucide-react'
import { Modal } from '../../components/Modal'
import { Button } from '../../components/Button'
import { Input } from '../../components/Input'

export const Assignments = () => {
  const [assignments, setAssignments] = useState([
    { id: 1, title: 'Math Homework - Chapter 5', subject: 'Mathematics', class: 'Class 1-A', assignedDate: '2026-01-08', dueDate: '2026-01-15', totalMarks: 20, submitted: 18, pending: 10, status: 'Active' },
    { id: 2, title: 'English Essay - My Favorite Book', subject: 'English', class: 'Class 2-A', assignedDate: '2026-01-07', dueDate: '2026-01-14', totalMarks: 25, submitted: 25, pending: 5, status: 'Active' },
    { id: 3, title: 'Science Project - Solar System', subject: 'Science', class: 'Class 3-A', assignedDate: '2026-01-05', dueDate: '2026-01-20', totalMarks: 50, submitted: 15, pending: 14, status: 'Active' },
    { id: 4, title: 'History Timeline Assignment', subject: 'Social Studies', class: 'Class 4-A', assignedDate: '2026-01-01', dueDate: '2026-01-10', totalMarks: 30, submitted: 26, pending: 0, status: 'Completed' },
    { id: 5, title: 'Programming Exercise - Python Basics', subject: 'Computer Science', class: 'Class 5-A', assignedDate: '2026-01-06', dueDate: '2026-01-13', totalMarks: 40, submitted: 20, pending: 8, status: 'Active' },
    { id: 6, title: 'Art Project - Landscape Painting', subject: 'Art', class: 'Class 1-B', assignedDate: '2026-01-04', dueDate: '2026-01-18', totalMarks: 30, submitted: 12, pending: 18, status: 'Active' },
    { id: 7, title: 'Reading Comprehension - Chapter 3', subject: 'English', class: 'Class 1-A', assignedDate: '2025-12-20', dueDate: '2026-01-05', totalMarks: 15, submitted: 28, pending: 0, status: 'Overdue' },
    { id: 8, title: 'Math Problem Set - Algebra', subject: 'Mathematics', class: 'Class 3-A', assignedDate: '2026-01-08', dueDate: '2026-01-22', totalMarks: 35, submitted: 10, pending: 19, status: 'Active' }
  ])

  const [showAddModal, setShowAddModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [selectedAssignment, setSelectedAssignment] = useState(null)
  const [formData, setFormData] = useState({
    title: '',
    subject: '',
    class: '',
    assignedDate: '',
    dueDate: '',
    totalMarks: '',
    submitted: 0,
    pending: 0,
    status: 'Active'
  })

  const handleAdd = () => {
    setFormData({ title: '', subject: '', class: '', assignedDate: '', dueDate: '', totalMarks: '', submitted: 0, pending: 0, status: 'Active' })
    setShowAddModal(true)
  }

  const handleEdit = (assignment) => {
    setSelectedAssignment(assignment)
    setFormData(assignment)
    setShowEditModal(true)
  }

  const handleDelete = (id) => {
    if (window.confirm('Are you sure you want to delete this assignment?')) {
      setAssignments(assignments.filter(a => a.id !== id))
      alert('Assignment deleted successfully!')
    }
  }

  const handleSave = () => {
    if (showAddModal) {
      const newAssignment = {
        ...formData,
        totalMarks: Number(formData.totalMarks),
        id: Math.max(...assignments.map(a => a.id)) + 1
      }
      setAssignments([...assignments, newAssignment])
      alert('Assignment created successfully!')
    } else {
      setAssignments(assignments.map(a => a.id === selectedAssignment.id ? { ...formData, totalMarks: Number(formData.totalMarks), id: selectedAssignment.id } : a))
      alert('Assignment updated successfully!')
    }
    setShowAddModal(false)
    setShowEditModal(false)
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'Active': return 'bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 border-blue-300'
      case 'Completed': return 'bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300 border-green-300'
      case 'Overdue': return 'bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300 border-red-300'
      default: return 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-200 border-gray-300 dark:border-gray-600'
    }
  }

  const stats = {
    total: assignments.length,
    active: assignments.filter(a => a.status === 'Active').length,
    completed: assignments.filter(a => a.status === 'Completed').length,
    overdue: assignments.filter(a => a.status === 'Overdue').length,
    totalSubmitted: assignments.reduce((sum, a) => sum + a.submitted, 0),
    totalPending: assignments.reduce((sum, a) => sum + a.pending, 0)
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
              <FileText size={36} className="text-purple-600 dark:text-purple-400" />
              <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                Assignments
              </h1>
            </div>
            <p className="text-gray-600 dark:text-gray-300 mt-2">Manage homework and assignments</p>
          </div>
          <Button onClick={handleAdd} className="flex items-center gap-2">
            <Plus size={20} />
            Create Assignment
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
                <p className="text-gray-600 dark:text-gray-300 text-sm font-medium mb-1">Total Assignments</p>
                <p className="text-3xl font-bold text-purple-600 dark:text-purple-400">{stats.total}</p>
              </div>
              <div className="p-4 bg-purple-50 dark:bg-purple-900/30 rounded-xl">
                <FileText size={28} className="text-purple-600 dark:text-purple-400" />
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
                <p className="text-gray-600 dark:text-gray-300 text-sm font-medium mb-1">Active</p>
                <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">{stats.active}</p>
              </div>
              <div className="p-4 bg-blue-50 dark:bg-blue-900/30 rounded-xl">
                <Clock size={28} className="text-blue-600 dark:text-blue-400" />
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
                <p className="text-gray-600 dark:text-gray-300 text-sm font-medium mb-1">Submissions</p>
                <p className="text-3xl font-bold text-green-600 dark:text-green-400">{stats.totalSubmitted}</p>
              </div>
              <div className="p-4 bg-green-50 dark:bg-green-900/30 rounded-xl">
                <CheckCircle size={28} className="text-green-600 dark:text-green-400" />
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
                <p className="text-gray-600 dark:text-gray-300 text-sm font-medium mb-1">Overdue</p>
                <p className="text-3xl font-bold text-red-600 dark:text-red-400">{stats.overdue}</p>
              </div>
              <div className="p-4 bg-red-50 dark:bg-red-900/30 rounded-xl">
                <AlertCircle size={28} className="text-red-600 dark:text-red-400" />
              </div>
            </div>
          </motion.div>
        </div>

        {/* Assignments Table */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-800 overflow-hidden"
        >
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gradient-to-r from-purple-50 dark:from-purple-900/40 to-pink-50 dark:to-pink-900/40">
                <tr>
                  <th className="text-left p-4 font-bold text-gray-700 dark:text-gray-200">Assignment Title</th>
                  <th className="text-left p-4 font-bold text-gray-700 dark:text-gray-200">Subject</th>
                  <th className="text-left p-4 font-bold text-gray-700 dark:text-gray-200">Class</th>
                  <th className="text-left p-4 font-bold text-gray-700 dark:text-gray-200">Assigned Date</th>
                  <th className="text-left p-4 font-bold text-gray-700 dark:text-gray-200">Due Date</th>
                  <th className="text-left p-4 font-bold text-gray-700 dark:text-gray-200">Submitted</th>
                  <th className="text-left p-4 font-bold text-gray-700 dark:text-gray-200">Pending</th>
                  <th className="text-left p-4 font-bold text-gray-700 dark:text-gray-200">Status</th>
                  <th className="text-left p-4 font-bold text-gray-700 dark:text-gray-200">Actions</th>
                </tr>
              </thead>
              <tbody>
                {assignments.map((assignment, index) => (
                  <motion.tr
                    key={assignment.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.6 + index * 0.05 }}
                    className="border-b border-gray-100 dark:border-gray-800 hover:bg-purple-50 transition-colors"
                  >
                    <td className="p-4 font-semibold text-gray-800 dark:text-gray-100">{assignment.title}</td>
                    <td className="p-4 text-purple-600 dark:text-purple-400 font-medium">{assignment.subject}</td>
                    <td className="p-4 text-gray-700 dark:text-gray-200">{assignment.class}</td>
                    <td className="p-4 text-gray-700 dark:text-gray-200">{new Date(assignment.assignedDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</td>
                    <td className="p-4 text-gray-700 dark:text-gray-200">{new Date(assignment.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</td>
                    <td className="p-4 text-green-600 dark:text-green-400 font-semibold">{assignment.submitted}</td>
                    <td className="p-4 text-orange-600 dark:text-orange-400 font-semibold">{assignment.pending}</td>
                    <td className="p-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold border-2 ${getStatusColor(assignment.status)}`}>
                        {assignment.status}
                      </span>
                    </td>
                    <td className="p-4">
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleEdit(assignment)}
                          className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition"
                        >
                          <Edit size={16} className="text-gray-600 dark:text-gray-300" />
                        </button>
                        <button
                          onClick={() => handleDelete(assignment.id)}
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
          title={showAddModal ? 'Create New Assignment' : 'Edit Assignment'}
        >
          <div className="space-y-4">
            <Input
              label="Assignment Title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="e.g., Math Homework - Chapter 5"
            />
            <div className="grid grid-cols-2 gap-4">
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
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Assigned Date"
                type="date"
                value={formData.assignedDate}
                onChange={(e) => setFormData({ ...formData, assignedDate: e.target.value })}
              />
              <Input
                label="Due Date"
                type="date"
                value={formData.dueDate}
                onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-3 gap-4">
              <Input
                label="Total Marks"
                type="number"
                value={formData.totalMarks}
                onChange={(e) => setFormData({ ...formData, totalMarks: e.target.value })}
                placeholder="e.g., 20"
              />
              <Input
                label="Submitted"
                type="number"
                value={formData.submitted}
                onChange={(e) => setFormData({ ...formData, submitted: parseInt(e.target.value) || 0 })}
                placeholder="0"
              />
              <Input
                label="Pending"
                type="number"
                value={formData.pending}
                onChange={(e) => setFormData({ ...formData, pending: parseInt(e.target.value) || 0 })}
                placeholder="0"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">Status</label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="Active">Active</option>
                <option value="Completed">Completed</option>
                <option value="Overdue">Overdue</option>
              </select>
            </div>
            <div className="flex gap-3 pt-4">
              <Button onClick={handleSave} className="flex-1">
                {showAddModal ? 'Create Assignment' : 'Save Changes'}
              </Button>
              <Button
                onClick={() => {
                  setShowAddModal(false)
                  setShowEditModal(false)
                }}
                className="flex-1 bg-gray-500 hover:bg-gray-600"
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
