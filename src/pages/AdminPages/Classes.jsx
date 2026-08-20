import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { BookOpen, Plus, Edit2, Users, GraduationCap, UserCheck } from 'lucide-react'
import { getClasses, createClass, getTeachers } from '../../services/adminApi'
import apiClient from '../../utils/api'
import api from '../../utils/api'

export const Classes = () => {
  const [classes, setClasses] = useState([])
  const [teachers, setTeachers] = useState([])
  const [academicYears, setAcademicYears] = useState([])
  const [enrollmentCounts, setEnrollmentCounts] = useState({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [modalError, setModalError] = useState('') // Error specific to modal form
  const [assignModal, setAssignModal] = useState(null) // holds the class being assigned
  const [assignTeacherId, setAssignTeacherId] = useState('')
  const [saving, setSaving] = useState(false)
  const [formData, setFormData] = useState({
    grade: 'Grade 10',
    section: 'A',
    stream: '', // For Grade 11-12
    teacherId: '',
    capacity: 40,
    room: '',
    academicYearId: '' // Changed from academicYear string to ObjectId
  })

  useEffect(() => {
    fetchAll()
  }, [])

  const fetchAll = async () => {
    try {
      setLoading(true)
      const [classData, teacherData, academicYearData] = await Promise.all([
        getClasses(), 
        getTeachers(),
        api.get('/api/admin/academic-years')
      ])
      setClasses(classData)
      setTeachers(teacherData)
      setAcademicYears(academicYearData.data)
      
      // Set default academic year to active year
      const activeYear = academicYearData.data.find(y => y.isActive)
      if (activeYear && !formData.academicYearId) {
        setFormData(prev => ({ ...prev, academicYearId: activeYear._id }))
      }
      
      // Fetch enrollment counts for each class
      await fetchEnrollmentCounts(classData)
      
      setError('')
    } catch (err) {
      setError('Failed to load data')
    } finally {
      setLoading(false)
    }
  }

  const fetchEnrollmentCounts = async (classList) => {
    try {
      const counts = {}
      await Promise.all(
        classList.map(async (cls) => {
          try {
            // Get active academic year if class has academicYearId
            // academicYearId may be a populated object or a string ID
            const academicYearId = cls.academicYearId?._id || cls.academicYearId
            if (academicYearId) {
              const response = await api.get(
                `/api/enrollment/class/${cls._id}/students?academicYearId=${academicYearId}&status=active`
              )
              // Response is { students: [...], count: N, class: {...} }
              counts[cls._id] = response.data.count ?? response.data.students?.length ?? 0
            } else {
              counts[cls._id] = 0
            }
          } catch (err) {
            console.error(`Error fetching enrollment count for class ${cls._id}:`, err)
            counts[cls._id] = 0
          }
        })
      )
      setEnrollmentCounts(counts)
    } catch (err) {
      console.error('Error fetching enrollment counts:', err)
    }
  }

  const handleAdd = async (e) => {
    e.preventDefault()
    setModalError('') // Clear previous errors
    try {
      setSaving(true)
      const streamText = formData.stream ? ` ${formData.stream}` : ''
      
      console.log('📝 Creating class with data:', {
        ...formData,
        name: `${formData.grade}${streamText}-${formData.section}`,
        stream: formData.stream || null
      })
      
      await createClass({
        ...formData,
        name: `${formData.grade}${streamText}-${formData.section}`,
        teacherId: formData.teacherId || null,
        stream: formData.stream || null,
        academicYearId: formData.academicYearId
      })
      
      console.log('✅ Class created successfully')
      setShowModal(false)
      
      // Reset form with active academic year
      const activeYear = academicYears.find(y => y.isActive)
      setFormData({ 
        grade: 'Grade 10', 
        section: 'A', 
        stream: '', 
        teacherId: '', 
        capacity: 40, 
        room: '', 
        academicYearId: activeYear?._id || '' 
      })
      await fetchAll()
    } catch (err) {
      console.error('❌ Full error object:', err)
      console.error('❌ Error response:', err.response)
      console.error('❌ Error data:', err.response?.data)
      
      // Try multiple ways to get the error message
      const errorMessage = 
        err.response?.data?.message || 
        err.response?.data?.error || 
        err.message || 
        'Failed to create class. Please check if this class already exists.'
      
      console.error('❌ Error creating class:', errorMessage)
      setModalError(errorMessage) // Show error in modal instead of alert
    } finally {
      setSaving(false)
    }
  }

  const handleAssignTeacher = async () => {
    if (!assignModal) return
    try {
      setSaving(true)
      await apiClient.put(`/api/admin/class/${assignModal._id}/assign-teacher`, {
        teacherId: assignTeacherId || null
      })
      setAssignModal(null)
      setAssignTeacherId('')
      await fetchAll()
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to assign teacher')
    } finally {
      setSaving(false)
    }
  }

  const openAssignModal = (cls) => {
    setAssignModal(cls)
    const currentTeacher = cls.teacherId
    setAssignTeacherId(
      typeof currentTeacher === 'object' ? currentTeacher?._id || '' : currentTeacher || ''
    )
  }

  const getTeacherName = (teacherId) => {
    if (!teacherId) return 'No teacher assigned'
    if (typeof teacherId === 'object' && teacherId.name) return teacherId.name
    const t = teachers.find(t => t._id === teacherId)
    return t ? t.name : 'Unknown'
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6 pt-8 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-300">Loading classes...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6 pt-8">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-7xl mx-auto">

        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <div className="flex items-center gap-3">
              <BookOpen size={36} className="text-blue-600 dark:text-blue-400" />
              <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100">Classes</h1>
            </div>
            <p className="text-gray-600 dark:text-gray-300 mt-1">Manage classes and assign teachers</p>
          </div>
          <button
            onClick={() => {
              setModalError('') // Clear any previous errors
              setShowModal(true)
            }}
            className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-semibold"
          >
            <Plus size={20} /> Add Class
          </button>
        </div>

        {error && <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-900/50 text-red-700 dark:text-red-300 px-4 py-3 rounded-lg mb-6">{error}</div>}

        {/* Stats */}
        <div className="grid md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-5 shadow-sm border border-gray-200 dark:border-gray-700">
            <p className="text-sm text-gray-600 dark:text-gray-300 font-medium">Total Classes</p>
            <p className="text-3xl font-bold text-blue-600 dark:text-blue-400 mt-1">{classes.length}</p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl p-5 shadow-sm border border-gray-200 dark:border-gray-700">
            <p className="text-sm text-gray-600 dark:text-gray-300 font-medium">Total Enrolled Students</p>
            <p className="text-3xl font-bold text-emerald-600 mt-1">
              {Object.values(enrollmentCounts).reduce((sum, count) => sum + count, 0)}
            </p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl p-5 shadow-sm border border-gray-200 dark:border-gray-700">
            <p className="text-sm text-gray-600 dark:text-gray-300 font-medium">With Teacher Assigned</p>
            <p className="text-3xl font-bold text-green-600 dark:text-green-400 mt-1">{classes.filter(c => c.teacherId).length}</p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl p-5 shadow-sm border border-gray-200 dark:border-gray-700">
            <p className="text-sm text-gray-600 dark:text-gray-300 font-medium">Without Teacher</p>
            <p className="text-3xl font-bold text-orange-600 dark:text-orange-400 mt-1">{classes.filter(c => !c.teacherId).length}</p>
          </div>
        </div>

        {/* Classes Table */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-200">Class Name</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-200">Grade</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-200">Section</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-200">Stream</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-200">Academic Year</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-200">Enrolled</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-200">Assigned Teacher</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-200">Room</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-200">Capacity</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-200">Actions</th>
                </tr>
              </thead>
              <tbody>
                {classes.length > 0 ? classes.map((cls, idx) => (
                  <motion.tr
                    key={cls._id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.04 }}
                    className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800 transition"
                  >
                    <td className="px-6 py-4 font-semibold text-gray-800 dark:text-gray-100">{cls.name}</td>
                    <td className="px-6 py-4 text-gray-600 dark:text-gray-300">{cls.grade}</td>
                    <td className="px-6 py-4 text-gray-600 dark:text-gray-300">{cls.section}</td>
                    <td className="px-6 py-4 text-gray-600 dark:text-gray-300">
                      {cls.stream ? (
                        <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${
                          cls.stream === 'natural' || cls.stream === 'Natural Science' 
                            ? 'bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300' 
                            : 'bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300'
                        }`}>
                          {cls.stream === 'natural' || cls.stream === 'Natural Science' 
                            ? 'Natural Science' 
                            : 'Social Science'}
                        </span>
                      ) : '—'}
                    </td>
                    <td className="px-6 py-4 text-gray-600 dark:text-gray-300">
                      {cls.academicYearId?.name || cls.academicYear || '—'}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                          enrollmentCounts[cls._id] > 0 
                            ? 'bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300' 
                            : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300'
                        }`}>
                          <Users size={12} />
                          {enrollmentCounts[cls._id] !== undefined ? enrollmentCounts[cls._id] : '...'}
                        </span>
                        <span className="text-xs text-gray-500 dark:text-gray-400">/ {cls.capacity}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                        cls.teacherId ? 'bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300' : 'bg-orange-100 dark:bg-orange-900/40 text-orange-700 dark:text-orange-300'
                      }`}>
                        <UserCheck size={12} />
                        {getTeacherName(cls.teacherId)}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-gray-600 dark:text-gray-300">{cls.room || '—'}</td>
                    <td className="px-6 py-4 text-gray-600 dark:text-gray-300">{cls.capacity}</td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => openAssignModal(cls)}
                        className="flex items-center gap-1 px-3 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-medium hover:bg-blue-700 transition"
                      >
                        <Edit2 size={12} />
                        Assign Teacher
                      </button>
                    </td>
                  </motion.tr>
                )) : (
                  <tr>
                    <td colSpan={10} className="px-6 py-12 text-center text-gray-500 dark:text-gray-400">
                      No classes found. Add a class to get started.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </motion.div>

      {/* Add Class Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ scale: 0.95, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-md w-full p-6"
          >
            <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100 mb-4">Add New Class</h2>
            
            {/* Error Message Display */}
            {modalError && (
              <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-900/50 rounded-lg">
                <p className="text-sm text-red-700 dark:text-red-300 font-medium">{modalError}</p>
              </div>
            )}
            
            <form onSubmit={handleAdd} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">Grade *</label>
                  <select
                    value={formData.grade}
                    onChange={e => {
                      const newGrade = e.target.value
                      setFormData({ 
                        ...formData, 
                        grade: newGrade,
                        // Reset stream if not Grade 11 or 12
                        stream: (newGrade === 'Grade 11' || newGrade === 'Grade 12') ? formData.stream : ''
                      })
                    }}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-800 text-sm"
                    required
                  >
                    {['Grade 1','Grade 2','Grade 3','Grade 4','Grade 5','Grade 6','Grade 7','Grade 8','Grade 9','Grade 10','Grade 11','Grade 12'].map(g => <option key={g}>{g}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">Section *</label>
                  <select
                    value={formData.section}
                    onChange={e => setFormData({ ...formData, section: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-800 text-sm"
                    required
                  >
                    {['A','B','C','D','E','F','G','H','I','J','K','L','M','N','O','P','Q','R','S','T','U','V','W','X','Y','Z'].map(s => <option key={s}>{s}</option>)}
                  </select>
                </div>
              </div>
              
              {/* Stream field - Only for Grade 11 and 12 */}
              {(formData.grade === 'Grade 11' || formData.grade === 'Grade 12') && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">Stream *</label>
                  <select
                    value={formData.stream}
                    onChange={e => setFormData({ ...formData, stream: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-800 text-sm"
                    required
                  >
                    <option value="">Select Stream</option>
                    <option value="Natural Science">Natural Science</option>
                    <option value="Social Science">Social Science</option>
                  </select>
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">Assign Teacher</label>
                <select
                  value={formData.teacherId}
                  onChange={e => setFormData({ ...formData, teacherId: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-800 text-sm"
                >
                  <option value="">No teacher assigned</option>
                  {teachers.map(t => <option key={t._id} value={t._id}>{t.name}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">Room</label>
                  <input type="text" value={formData.room} onChange={e => setFormData({ ...formData, room: e.target.value })} placeholder="e.g., 101" className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">Capacity *</label>
                  <input type="number" min="1" value={formData.capacity} onChange={e => setFormData({ ...formData, capacity: parseInt(e.target.value) || 40 })} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm" required />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">Academic Year *</label>
                <select
                  value={formData.academicYearId}
                  onChange={e => setFormData({ ...formData, academicYearId: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-800 text-sm"
                  required
                >
                  <option value="">Select Academic Year</option>
                  {academicYears.map(year => (
                    <option key={year._id} value={year._id}>
                      {year.name} {year.isActive ? '(Active)' : ''}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="submit" disabled={saving} className="flex-1 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-semibold text-sm disabled:opacity-60">
                  {saving ? 'Creating...' : 'Create Class'}
                </button>
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition font-semibold text-sm">
                  Cancel
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* Assign Teacher Modal */}
      {assignModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ scale: 0.95, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-sm w-full p-6"
          >
            <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100 mb-1">Assign Teacher</h2>
            <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">Class: <strong>{assignModal.name}</strong></p>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">Select Teacher</label>
              <select
                value={assignTeacherId}
                onChange={e => setAssignTeacherId(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-800"
              >
                <option value="">— Remove teacher assignment —</option>
                {teachers.map(t => (
                  <option key={t._id} value={t._id}>{t.name}</option>
                ))}
              </select>
            </div>
            <div className="bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-900/50 rounded-lg p-3 mb-4">
              <p className="text-xs text-blue-700 dark:text-blue-300">
                Assigning a teacher to this class means the teacher will see all students in this class on their dashboard and can mark attendance and add grades for them.
              </p>
            </div>
            <div className="flex gap-3">
              <button onClick={handleAssignTeacher} disabled={saving} className="flex-1 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-semibold text-sm disabled:opacity-60">
                {saving ? 'Saving...' : 'Save Assignment'}
              </button>
              <button onClick={() => { setAssignModal(null); setAssignTeacherId('') }} className="flex-1 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition font-semibold text-sm">
                Cancel
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  )
}
