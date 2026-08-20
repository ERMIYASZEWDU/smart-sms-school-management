import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { FileText, Plus, Edit, Trash2, X } from 'lucide-react'
import { getAssignments, createAssignment, updateAssignment, deleteAssignment } from '../../services/teacherApi'
import apiClient from '../../utils/api'

export const TeacherAssignments = () => {
  const [assignments, setAssignments] = useState([])
  const [classes, setClasses] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingAssignment, setEditingAssignment] = useState(null)
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    subject: '',
    grade: '',
    classId: '',
    dueDate: ''
  })

  useEffect(() => {
    fetchAll()
  }, [])

  const fetchAll = async () => {
    try {
      setLoading(true)
      const [assignData, classRes] = await Promise.all([
        getAssignments(),
        apiClient.get('/api/teacher/classes')
      ])
      setAssignments(assignData)
      setClasses(classRes.data)

      // Pre-select first class in form
      if (classRes.data.length > 0) {
        const first = classRes.data[0]
        setFormData(prev => ({ ...prev, grade: first.name, classId: first._id }))
      }
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setLoading(false)
    }
  }

  const openCreateModal = () => {
    setEditingAssignment(null)
    const first = classes[0]
    setFormData({
      title: '',
      description: '',
      subject: '',
      grade: first?.name || '',
      classId: first?._id || '',
      dueDate: ''
    })
    setShowModal(true)
  }

  const handleClassChange = (classId) => {
    const cls = classes.find(c => c._id === classId)
    setFormData(prev => ({ ...prev, classId, grade: cls?.name || '' }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      if (editingAssignment) {
        await updateAssignment(editingAssignment._id, formData)
      } else {
        await createAssignment(formData)
      }
      setShowModal(false)
      setEditingAssignment(null)
      await fetchAll()
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to save assignment')
    }
  }

  const handleEdit = (assignment) => {
    setEditingAssignment(assignment)
    setFormData({
      title: assignment.title,
      description: assignment.description || '',
      subject: assignment.subject,
      grade: assignment.grade,
      classId: assignment.classId || '',
      dueDate: assignment.dueDate ? assignment.dueDate.split('T')[0] : ''
    })
    setShowModal(true)
  }

  const handleDelete = async (id) => {
    if (!confirm('Delete this assignment?')) return
    try {
      await deleteAssignment(id)
      await fetchAll()
    } catch (error) {
      alert('Failed to delete assignment')
    }
  }

  const formatDate = (d) => d ? new Date(d).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }) : '—'

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6 pt-8">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-7xl mx-auto">

        <div className="flex justify-between items-center mb-8">
          <div>
            <div className="flex items-center gap-3">
              <FileText size={36} className="text-purple-600 dark:text-purple-400" />
              <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100">Assignments</h1>
            </div>
            <p className="text-gray-600 dark:text-gray-300 mt-1">Create and manage assignments for your classes</p>
          </div>
          <button
            onClick={openCreateModal}
            className="flex items-center gap-2 px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition font-semibold"
          >
            <Plus size={20} /> Create Assignment
          </button>
        </div>

        {/* No classes warning */}
        {!loading && classes.length === 0 && (
          <div className="bg-yellow-50 dark:bg-yellow-900/30 border border-yellow-200 rounded-lg p-5 mb-6 text-yellow-800 text-sm">
            You have no assigned classes. Ask your admin to assign you to a class before creating assignments.
          </div>
        )}

        {loading ? (
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-12 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
            <p className="mt-4 text-gray-600 dark:text-gray-300">Loading assignments...</p>
          </div>
        ) : assignments.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-12 text-center">
            <FileText size={48} className="mx-auto text-gray-300 dark:text-gray-400 mb-4" />
            <p className="text-gray-600 dark:text-gray-300">No assignments yet. Create your first assignment.</p>
          </div>
        ) : (
          <div className="grid gap-4">
            {assignments.map(a => (
              <motion.div
                key={a._id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 hover:shadow-md transition"
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100 mb-1">{a.title}</h3>
                    {a.description && <p className="text-gray-600 dark:text-gray-300 text-sm mb-3">{a.description}</p>}
                    <div className="flex flex-wrap gap-2 text-sm">
                      <span className="px-2.5 py-1 bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300 rounded-full font-medium">{a.subject}</span>
                      <span className="px-2.5 py-1 bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 rounded-full font-medium">{a.grade}</span>
                      <span className="text-gray-500 dark:text-gray-400">Due: {formatDate(a.dueDate)}</span>
                    </div>
                  </div>
                  <div className="flex gap-2 ml-4">
                    <button onClick={() => handleEdit(a)} className="p-2 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/40 rounded-lg transition"><Edit size={16} /></button>
                    <button onClick={() => handleDelete(a._id)} className="p-2 text-red-600 dark:text-red-400 hover:bg-red-50 rounded-lg transition"><Trash2 size={16} /></button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </motion.div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white dark:bg-gray-800 rounded-xl p-6 max-w-lg w-full max-h-[90vh] overflow-y-auto"
          >
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-gray-800 dark:text-gray-100">{editingAssignment ? 'Edit Assignment' : 'Create Assignment'}</h3>
              <button onClick={() => setShowModal(false)} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"><X size={20} /></button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">Title *</label>
                <input type="text" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} required placeholder="Assignment title" className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">Description</label>
                <textarea value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} rows={3} placeholder="Instructions for students..." className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">Subject *</label>
                <input type="text" value={formData.subject} onChange={e => setFormData({...formData, subject: e.target.value})} required placeholder="e.g., Mathematics" className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">Class *</label>
                {classes.length > 0 ? (
                  <select
                    value={formData.classId}
                    onChange={e => handleClassChange(e.target.value)}
                    required
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 bg-white dark:bg-gray-800 text-sm"
                  >
                    <option value="">Select a class</option>
                    {classes.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
                  </select>
                ) : (
                  <p className="text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-900/50 rounded-lg px-3 py-2">
                    No classes assigned. Ask admin to assign you to a class first.
                  </p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">Due Date *</label>
                <input type="date" value={formData.dueDate} onChange={e => setFormData({...formData, dueDate: e.target.value})} required className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 text-sm" />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="submit" disabled={classes.length === 0} className="flex-1 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition font-semibold text-sm disabled:opacity-50">
                  {editingAssignment ? 'Update' : 'Create'} Assignment
                </button>
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition font-semibold text-sm">
                  Cancel
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  )
}
