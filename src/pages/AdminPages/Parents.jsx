import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Users, Plus, Edit, Trash2, Phone, Mail, MapPin, User } from 'lucide-react'
import { Modal } from '../../components/Modal'
import { Button } from '../../components/Button'
import { Input } from '../../components/Input'
import { getParents, createParent, updateParent, deleteParent, getStudents } from '../../services/adminApi'

export const Parents = () => {
  const [parents, setParents] = useState([])
  const [students, setStudents] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showAddModal, setShowAddModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [selectedParent, setSelectedParent] = useState(null)
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    phone: '',
    studentIds: [],
    address: '',
    occupation: '',
    relationship: 'guardian'
  })

  useEffect(() => {
    fetchParents()
    fetchStudents()
  }, [])

  const fetchParents = async () => {
    try {
      console.log('🔍 Fetching parents...')
      setLoading(true)
      const data = await getParents()
      console.log('✅ Parents fetched:', data)
      setParents(data)
      setError('')
    } catch (err) {
      console.error('❌ Error fetching parents:', err)
      setError('Failed to load parents')
    } finally {
      setLoading(false)
    }
  }

  const fetchStudents = async () => {
    try {
      const data = await getStudents()
      setStudents(data)
    } catch (err) {
      console.error('Error fetching students:', err)
    }
  }

  const handleAdd = () => {
    setFormData({
      name: '',
      email: '',
      password: '',
      phone: '',
      studentIds: [],
      address: '',
      occupation: '',
      relationship: 'guardian'
    })
    setSelectedParent(null)
    setShowAddModal(true)
  }

  const handleEdit = (parent) => {
    setSelectedParent(parent)
    setFormData({
      name: parent.name,
      email: parent.email,
      password: '',
      phone: parent.phone,
      studentIds: parent.studentIds?.map(s => typeof s === 'object' ? s._id : s) || [],
      address: parent.address || '',
      occupation: parent.occupation || '',
      relationship: parent.relationship || 'guardian'
    })
    setShowEditModal(true)
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this parent record?')) {
      return
    }

    try {
      await deleteParent(id)
      alert('✅ Parent deleted successfully!')
      await fetchParents()
    } catch (err) {
      console.error('❌ Error deleting parent:', err)
      alert('Failed to delete parent')
    }
  }

  const handleSave = async () => {
    try {
      console.log('💾 Saving parent...', formData)
      
      if (showEditModal && selectedParent) {
        // For update, only send password if it's not empty
        const updateData = { ...formData }
        if (!updateData.password) {
          delete updateData.password
        }
        await updateParent(selectedParent._id, updateData)
        alert('✅ Parent updated successfully!')
      } else {
        // For create, password is required
        if (!formData.password) {
          alert('Password is required for new parents')
          return
        }
        await createParent(formData)
        alert('✅ Parent added successfully!')
      }

      await fetchParents()
      setShowAddModal(false)
      setShowEditModal(false)
    } catch (err) {
      console.error('❌ Error saving parent:', err)
      const errorMsg = err.response?.data?.message || err.message || 'Unknown error'
      alert(`Failed to save parent: ${errorMsg}`)
    }
  }

  const getStudentNames = (studentIds) => {
    if (!studentIds || studentIds.length === 0) return 'No children linked'
    
    const names = studentIds.map(sid => {
      // Handle populated student objects
      if (typeof sid === 'object' && sid.name) {
        return sid.name
      }
      // Handle student IDs
      const student = students.find(s => s._id === sid)
      return student ? student.name : 'Unknown'
    })
    
    return names.join(', ')
  }

  const handleStudentSelection = (studentId) => {
    const currentIds = formData.studentIds || []
    const isSelected = currentIds.includes(studentId)
    
    const newIds = isSelected
      ? currentIds.filter(id => id !== studentId)
      : [...currentIds, studentId]
    
    setFormData({ ...formData, studentIds: newIds })
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6 pt-8 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-300">Loading parents...</p>
        </div>
      </div>
    )
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
              <Users size={36} className="text-green-600 dark:text-green-400" />
              <h1 className="text-4xl font-bold bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent">
                Parents
              </h1>
            </div>
            <p className="text-gray-600 dark:text-gray-300 mt-2">Manage parent and guardian information</p>
          </div>
          <Button onClick={handleAdd} className="flex items-center gap-2">
            <Plus size={20} />
            Add New Parent
          </Button>
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

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg border border-gray-100 dark:border-gray-800"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 dark:text-gray-300 text-sm font-medium mb-1">Total Parents</p>
                <p className="text-3xl font-bold text-green-600 dark:text-green-400">{parents.length}</p>
              </div>
              <div className="p-4 bg-green-50 dark:bg-green-900/30 rounded-xl">
                <Users size={28} className="text-green-600 dark:text-green-400" />
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
                <p className="text-gray-600 dark:text-gray-300 text-sm font-medium mb-1">Linked Children</p>
                <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                  {parents.reduce((sum, p) => sum + (p.studentIds?.length || 0), 0)}
                </p>
              </div>
              <div className="p-4 bg-blue-50 dark:bg-blue-900/30 rounded-xl">
                <User size={28} className="text-blue-600 dark:text-blue-400" />
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
                <p className="text-gray-600 dark:text-gray-300 text-sm font-medium mb-1">Active Accounts</p>
                <p className="text-3xl font-bold text-purple-600 dark:text-purple-400">{parents.length}</p>
              </div>
              <div className="p-4 bg-purple-50 dark:bg-purple-900/30 rounded-xl">
                <Mail size={28} className="text-purple-600 dark:text-purple-400" />
              </div>
            </div>
          </motion.div>
        </div>

        {/* Parents Grid */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          {parents.length > 0 ? (
            parents.map((parent, index) => (
              <motion.div
                key={parent._id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.5 + index * 0.05 }}
                whileHover={{ y: -5, boxShadow: '0 10px 25px rgba(0,0,0,0.1)' }}
                className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg border border-gray-100 dark:border-gray-800 transition-all duration-300"
              >
                <div className="flex justify-between items-start mb-4">
                  <div className="p-3 bg-green-50 dark:bg-green-900/30 rounded-xl">
                    <Users size={24} className="text-green-600 dark:text-green-400" />
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleEdit(parent)}
                      className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition"
                    >
                      <Edit size={16} className="text-gray-600 dark:text-gray-300" />
                    </button>
                    <button
                      onClick={() => handleDelete(parent._id)}
                      className="p-2 hover:bg-red-50 rounded-lg transition"
                    >
                      <Trash2 size={16} className="text-red-600 dark:text-red-400" />
                    </button>
                  </div>
                </div>

                <h3 className="text-xl font-bold text-gray-800 dark:text-gray-100 mb-2">{parent.name}</h3>
                
                <div className="space-y-3 mb-4">
                  <div className="flex items-start gap-2 text-sm text-gray-600 dark:text-gray-300">
                    <User size={16} className="text-blue-500 mt-0.5 flex-shrink-0" />
                    <div>
                      <span className="font-medium block">Children:</span>
                      <span className="text-xs">{getStudentNames(parent.studentIds)}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
                    <MapPin size={16} className="text-purple-500" />
                    <span className="capitalize">{parent.relationship || 'Guardian'}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
                    <Phone size={16} className="text-green-500" />
                    <span>{parent.phone || 'N/A'}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
                    <Mail size={16} className="text-orange-500" />
                    <span className="truncate">{parent.email || 'N/A'}</span>
                  </div>
                </div>

                <button
                  onClick={() => handleEdit(parent)}
                  className="w-full py-2 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg font-medium hover:shadow-lg transition"
                >
                  View Details
                </button>
              </motion.div>
            ))
          ) : (
            <div className="col-span-full text-center py-12">
              <Users size={48} className="text-gray-300 dark:text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500 dark:text-gray-400 text-lg">No parents found</p>
              <p className="text-gray-400 dark:text-gray-500 text-sm mt-1">Add a new parent to get started</p>
            </div>
          )}
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
          title={showAddModal ? 'Add New Parent' : 'Edit Parent'}
        >
          <div className="space-y-4">
            <Input
              label="Parent Name *"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g., Mr. John Smith"
              required
            />
            <Input
              label="Email *"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder="e.g., john.smith@email.com"
              required
            />
            <Input
              label={showEditModal ? "Password (leave blank to keep current)" : "Password *"}
              type="password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              placeholder={showEditModal ? "Leave blank to keep current" : "Enter password"}
              required={!showEditModal}
            />
            <Input
              label="Phone *"
              type="tel"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              placeholder="e.g., +251-91-234-5678"
              required
            />
            
            {/* Student Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
                Link Children (Students)
              </label>
              <div className="border border-gray-300 dark:border-gray-600 rounded-lg p-3 max-h-48 overflow-y-auto bg-gray-50 dark:bg-gray-900">
                {students.length > 0 ? (
                  students.map(student => (
                    <label key={student._id} className="flex items-center gap-2 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 px-2 rounded cursor-pointer">
                      <input
                        type="checkbox"
                        checked={(formData.studentIds || []).includes(student._id)}
                        onChange={() => handleStudentSelection(student._id)}
                        className="w-4 h-4 text-blue-600 dark:text-blue-400 rounded focus:ring-2 focus:ring-blue-500"
                      />
                      <span className="text-sm text-gray-700 dark:text-gray-200">
                        {student.name} - {student.grade} {student.section}
                      </span>
                    </label>
                  ))
                ) : (
                  <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-2">No students available</p>
                )}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">Relationship</label>
              <select
                value={formData.relationship}
                onChange={(e) => setFormData({ ...formData, relationship: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-800"
              >
                <option value="father">Father</option>
                <option value="mother">Mother</option>
                <option value="guardian">Guardian</option>
              </select>
            </div>

            <Input
              label="Occupation"
              value={formData.occupation}
              onChange={(e) => setFormData({ ...formData, occupation: e.target.value })}
              placeholder="e.g., Engineer"
            />
            <Input
              label="Address"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              placeholder="e.g., 123 Oak Street, City"
            />
            
            <div className="flex gap-3 pt-4">
              <Button onClick={handleSave} className="flex-1">
                {showAddModal ? 'Add Parent' : 'Save Changes'}
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
