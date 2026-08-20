import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Plus, Trash2, Edit2, Search, Filter, Power } from 'lucide-react'
import { getTeachers, createTeacher, updateTeacher, deleteTeacher } from '../../services/adminApi'
import { getClasses } from '../../services/adminApi'

export const Teachers = () => {
  const [teachers, setTeachers] = useState([])
  const [classes, setClasses] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterSubject, setFilterSubject] = useState('all')
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    phone: '',
    subject: '',
    qualification: '',
    assignedClasses: []
  })
  const [editingId, setEditingId] = useState(null)

  const subjects = ['Mathematics', 'English', 'Amharic', 'Physics', 'Chemistry', 'Biology', 'History', 'Geography', 'Computer Science', 'Physical Education', 'Arts']
  const qualifications = ['B.A.', 'B.Sc.', 'B.Ed.', 'M.A.', 'M.Sc.', 'M.Ed.', 'Ph.D.', 'Diploma']

  useEffect(() => {
    fetchTeachers()
    fetchClasses()
  }, [])

  const fetchTeachers = async () => {
    try {
      console.log('🔍 Fetching teachers...')
      setLoading(true)
      const data = await getTeachers()
      console.log('✅ Teachers fetched:', data)
      setTeachers(data)
      setError('')
    } catch (err) {
      console.error('❌ Error fetching teachers:', err)
      setError('Failed to load teachers')
    } finally {
      setLoading(false)
    }
  }

  const fetchClasses = async () => {
    try {
      const data = await getClasses()
      setClasses(data)
    } catch (err) {
      console.error('Error fetching classes:', err)
    }
  }

  const handleOpenModal = (teacher = null) => {
    if (teacher) {
      setFormData({
        name: teacher.name,
        email: teacher.email,
        password: '', // Don't populate password for edit
        phone: teacher.phone || '',
        subject: teacher.subject || '',
        qualification: teacher.qualification || '',
        assignedClasses: teacher.assignedClasses || []
      })
      setEditingId(teacher._id)
    } else {
      setFormData({
        name: '',
        email: '',
        password: '',
        phone: '',
        subject: '',
        qualification: '',
        assignedClasses: []
      })
      setEditingId(null)
    }
    setIsModalOpen(true)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    try {
      console.log('💾 Saving teacher...', formData)
      
      if (editingId) {
        // For update, only send password if it's not empty
        const updateData = { ...formData }
        if (!updateData.password) {
          delete updateData.password
        }
        await updateTeacher(editingId, updateData)
        alert('✅ Teacher updated successfully!')
      } else {
        // For create, password is required
        if (!formData.password) {
          alert('Password is required for new teachers')
          return
        }
        await createTeacher(formData)
        alert('✅ Teacher created successfully!')
      }

      await fetchTeachers()
      setIsModalOpen(false)
      setFormData({
        name: '',
        email: '',
        password: '',
        phone: '',
        subject: '',
        qualification: '',
        assignedClasses: []
      })
      setEditingId(null)
    } catch (err) {
      console.error('❌ Error saving teacher:', err)
      const errorMsg = err.response?.data?.message || err.message || 'Unknown error'
      alert(`Failed to save teacher: ${errorMsg}`)
    }
  }

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this teacher? This action cannot be undone.')) {
      return
    }

    try {
      await deleteTeacher(id)
      alert('✅ Teacher deleted successfully!')
      await fetchTeachers()
    } catch (err) {
      console.error('❌ Error deleting teacher:', err)
      alert('Failed to delete teacher')
    }
  }

  const handleToggleStatus = async (teacher) => {
    try {
      const newStatus = teacher.status === 'active' ? 'inactive' : 'active'
      await updateTeacher(teacher._id, { ...teacher, status: newStatus })
      await fetchTeachers()
    } catch (err) {
      console.error('Error toggling status:', err)
      alert('Failed to update status')
    }
  }

  const filteredTeachers = teachers.filter(teacher => {
    const matchesSearch = 
      teacher.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      teacher.email?.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesSubject = filterSubject === 'all' || teacher.subject === filterSubject
    
    return matchesSearch && matchesSubject
  })

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6 pt-8 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-300">Loading teachers...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6 pt-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-7xl mx-auto"
      >
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100">Teachers Management</h1>
            <p className="text-gray-600 dark:text-gray-300 mt-1">Manage all teachers in the school</p>
          </div>
          <motion.button
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => handleOpenModal()}
            className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-semibold"
          >
            <Plus size={20} />
            Add New Teacher
          </motion.button>
        </div>

        {/* Error Message */}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-900/50 text-red-700 dark:text-red-300 px-4 py-3 rounded-lg mb-6"
          >
            {error}
          </motion.div>
        )}

        {/* Filters */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700 mb-6"
        >
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-3 text-gray-400 dark:text-gray-500" size={18} />
              <input
                type="text"
                placeholder="Search by name or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="flex items-center gap-2">
              <Filter size={18} className="text-gray-600 dark:text-gray-300" />
              <select
                value={filterSubject}
                onChange={(e) => setFilterSubject(e.target.value)}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-800"
              >
                <option value="all">All Subjects</option>
                {subjects.map(subject => (
                  <option key={subject} value={subject}>{subject}</option>
                ))}
              </select>
            </div>
          </div>
        </motion.div>

        {/* Teachers Table */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
          className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden"
        >
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-200">Name</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-200">Email</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-200">Phone</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-200">Subject</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-200">Qualification</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-200">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredTeachers.length > 0 ? (
                  filteredTeachers.map((teacher, idx) => (
                    <motion.tr
                      key={teacher._id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.05 }}
                      className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800 transition"
                    >
                      <td className="px-6 py-4">
                        <p className="font-medium text-gray-800 dark:text-gray-100">{teacher.name || 'N/A'}</p>
                      </td>
                      <td className="px-6 py-4 text-gray-600 dark:text-gray-300">{teacher.email || 'N/A'}</td>
                      <td className="px-6 py-4 text-gray-600 dark:text-gray-300">{teacher.phone || 'N/A'}</td>
                      <td className="px-6 py-4 text-gray-600 dark:text-gray-300">{teacher.subject || 'N/A'}</td>
                      <td className="px-6 py-4 text-gray-600 dark:text-gray-300">{teacher.qualification || 'N/A'}</td>
                      <td className="px-6 py-4">
                        <div className="flex gap-2">
                          <motion.button
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => handleOpenModal(teacher)}
                            className="p-2 hover:bg-blue-100 text-blue-600 dark:text-blue-400 rounded-lg transition"
                            title="Edit teacher"
                          >
                            <Edit2 size={16} />
                          </motion.button>
                          <motion.button
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => handleDelete(teacher._id)}
                            className="p-2 hover:bg-red-100 text-red-600 dark:text-red-400 rounded-lg transition"
                            title="Delete teacher"
                          >
                            <Trash2 size={16} />
                          </motion.button>
                        </div>
                      </td>
                    </motion.tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-gray-500 dark:text-gray-400">
                      <p className="text-lg">No teachers found</p>
                      <p className="text-sm mt-1">Try adjusting your search or filter criteria, or add a new teacher</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </motion.div>

        {/* Stats */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="mt-6 grid md:grid-cols-3 gap-4"
        >
          <div className="bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-900/50 rounded-lg p-4">
            <p className="text-sm text-blue-600 dark:text-blue-400 font-medium">Total Teachers</p>
            <p className="text-2xl font-bold text-blue-700 dark:text-blue-300 mt-1">{teachers.length}</p>
          </div>
          <div className="bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-900/50 rounded-lg p-4">
            <p className="text-sm text-green-600 dark:text-green-400 font-medium">Active Teachers</p>
            <p className="text-2xl font-bold text-green-700 dark:text-green-300 mt-1">{teachers.filter(t => t.status !== 'inactive').length}</p>
          </div>
          <div className="bg-purple-50 dark:bg-purple-900/30 border border-purple-200 dark:border-purple-900/50 rounded-lg p-4">
            <p className="text-sm text-purple-600 dark:text-purple-400 font-medium">Filtered Results</p>
            <p className="text-2xl font-bold text-purple-700 dark:text-purple-300 mt-1">{filteredTeachers.length}</p>
          </div>
        </motion.div>
      </motion.div>

      {/* Modal */}
      {isModalOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[1055] p-4"
          onClick={() => setIsModalOpen(false)}
        >
          <motion.div
            initial={{ scale: 0.95, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            onClick={(e) => e.stopPropagation()}
            className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-md w-full max-h-[90vh] flex flex-col"
          >
            {/* Header */}
            <div className="px-5 py-3 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
              <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100">
                {editingId ? 'Edit Teacher' : 'Add New Teacher'}
              </h2>
            </div>

            {/* Scrollable Body */}
            <div className="flex-1 overflow-y-auto px-5 py-4">
              <form id="teacher-form" onSubmit={handleSubmit} className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">Teacher Name *</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Enter teacher name"
                    className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">Email *</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="teacher@example.com"
                    className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
                    Password {editingId ? '(leave blank to keep current)' : '*'}
                  </label>
                  <input
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    placeholder={editingId ? "Leave blank to keep current" : "Enter password"}
                    className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required={!editingId}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">Phone</label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="+251-91-234-5678"
                    className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">Subject</label>
                  <select
                    value={formData.subject}
                    onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-800"
                  >
                    <option value="">Select Subject</option>
                    {subjects.map(subject => (
                      <option key={subject} value={subject}>{subject}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">Qualification</label>
                  <select
                    value={formData.qualification}
                    onChange={(e) => setFormData({ ...formData, qualification: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-800"
                  >
                    <option value="">Select Qualification</option>
                    {qualifications.map(qual => (
                      <option key={qual} value={qual}>{qual}</option>
                    ))}
                  </select>
                </div>
              </form>
            </div>

            {/* Fixed Footer */}
            <div className="px-5 py-3 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 flex-shrink-0">
              <div className="flex gap-3">
                <button
                  type="submit"
                  form="teacher-form"
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-semibold text-sm"
                >
                  {editingId ? 'Update Teacher' : 'Add Teacher'}
                </button>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition font-semibold text-sm"
                >
                  Cancel
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </div>
  )
}
