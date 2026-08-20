import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Plus, Trash2, Edit2, Search, Filter, Power, Calendar } from 'lucide-react'
import { getStudents, createStudent, updateStudent, deleteStudent } from '../../services/adminApi'
import { getClasses } from '../../services/adminApi'
import api, { resolvePhotoUrl } from '../../utils/api'
import { processPhoto, fileToDataUrl } from '../../utils/image'

export const Students = () => {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterClass, setFilterClass] = useState('all')
  const [filterAcademicYear, setFilterAcademicYear] = useState('all')
  const [filterEnrollmentStatus, setFilterEnrollmentStatus] = useState('all')
  const [students, setStudents] = useState([])
  const [classes, setClasses] = useState([])
  const [academicYears, setAcademicYears] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    enrollmentNumber: '',
    grade: '',
    section: '',
    stream: '', // For Grade 11-12 only
    rollNumber: '',
    dateOfBirth: '',
    guardianName: '',
    guardianPhone: '',
    address: '',
    photo: null,
    classId: '',
    parentIds: []
  })
  const [editingId, setEditingId] = useState(null)
  const [photoPreview, setPhotoPreview] = useState(null)
  const [photoError, setPhotoError] = useState('')

  // Fetch students and classes on mount
  useEffect(() => {
    fetchStudents()
    fetchClasses()
    fetchAcademicYears()
  }, [])

  const fetchAcademicYears = async () => {
    try {
      const response = await api.get('/api/admin/academic-years')
      setAcademicYears(response.data)
      // Set default filter to active year
      const activeYear = response.data.find(y => y.isActive)
      if (activeYear) {
        setFilterAcademicYear(activeYear._id)
      }
    } catch (err) {
      console.error('Error fetching academic years:', err)
    }
  }

  const fetchStudents = async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await getStudents()
      // Handle both array and object with students property
      let studentsData = []
      if (Array.isArray(data)) {
        studentsData = data
      } else if (data && data.students && Array.isArray(data.students)) {
        studentsData = data.students
      } else {
        console.error('Unexpected data format:', data)
        setStudents([])
        setError('Received invalid data format from server')
        return
      }

      // Fetch enrollment data for each student
      const studentsWithEnrollment = await Promise.all(
        studentsData.map(async (student) => {
          try {
            // Get current enrollment — always try regardless of currentEnrollmentId
            let enrollment = null
            try {
              const enrollmentResponse = await api.get(`/api/enrollment/student/${student._id}/current`)
              enrollment = enrollmentResponse.data?.enrollment || enrollmentResponse.data
            } catch (_e) {
              // No active enrollment found
            }
            
            // Get enrollment history count
            const historyResponse = await api.get(`/api/enrollment/student/${student._id}/history`)
            const enrollmentHistory = historyResponse.data.enrollmentHistory || []
            
            return {
              ...student,
              currentEnrollment: enrollment,
              enrollmentHistory: enrollmentHistory,
              enrollmentCount: enrollmentHistory.length
            }
          } catch (err) {
            console.error(`Error fetching enrollment for student ${student._id}:`, err)
            return {
              ...student,
              currentEnrollment: null,
              enrollmentHistory: [],
              enrollmentCount: 0
            }
          }
        })
      )

      setStudents(studentsWithEnrollment)
    } catch (err) {
      console.error('Error fetching students:', err)
      setError('Failed to load students. Please try again.')
      setStudents([]) // Set empty array on error
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
      // Set default classes if API fails
      setClasses([
        { _id: '1', name: 'Grade 10-A', grade: 'Grade 10', section: 'A' },
        { _id: '2', name: 'Grade 10-B', grade: 'Grade 10', section: 'B' },
        { _id: '3', name: 'Grade 11-A', grade: 'Grade 11', section: 'A' },
        { _id: '4', name: 'Grade 11-B', grade: 'Grade 11', section: 'B' }
      ])
    }
  }

  const handleOpenModal = (student = null) => {
    if (student) {
      setFormData({
        name: student.name || '',
        email: student.userId?.email || '',
        password: '',
        enrollmentNumber: student.enrollmentNumber || '',
        grade: student.grade || '',
        section: student.section || '',
        stream: student.stream || '', // Include stream for Grade 11-12
        rollNumber: student.rollNumber || '',
        dateOfBirth: student.dateOfBirth ? new Date(student.dateOfBirth).toISOString().split('T')[0] : '',
        guardianName: student.guardianName || '',
        guardianPhone: student.guardianPhone || '',
        address: student.address || '',
        photo: student.photo || null,
        classId: student.classId?._id || '',
        parentIds: student.parentIds || []
      })
      setPhotoPreview(student.photo ? resolvePhotoUrl(student.photo) : null)
      setPhotoError('')
      setEditingId(student._id)
    } else {
      const firstClass = classes[0]
      setFormData({ 
        name: '', 
        email: '', 
        password: '',
        enrollmentNumber: '',
        grade: firstClass?.grade || 'Grade 10',
        section: firstClass?.section || 'A',
        stream: '', // Include stream field
        rollNumber: '',
        dateOfBirth: '',
        guardianName: '',
        guardianPhone: '',
        address: '',
        photo: null,
        classId: firstClass?._id || '',
        parentIds: []
      })
      setPhotoPreview(null)
      setPhotoError('')
      setEditingId(null)
    }
    setIsModalOpen(true)
  }

  const handlePhotoChange = async (e) => {
    const file = e.target.files?.[0]
    setPhotoError('')
    if (!file) return

    try {
      const processed = await processPhoto(file)
      // Store as a base64 data URL string so it survives JSON serialization
      const photoDataUrl = await fileToDataUrl(processed)
      setFormData(prev => ({ ...prev, photo: photoDataUrl }))
      setPhotoPreview(URL.createObjectURL(processed))
    } catch (err) {
      setPhotoError(err.message || 'Invalid photo. Please choose a JPG, PNG, or WEBP image.')
      setPhotoPreview(null)
      setFormData(prev => ({ ...prev, photo: null }))
    }
    // Allow selecting the same file again after an error
    e.target.value = ''
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    try {
      console.log('📝 Submitting student data:', formData)
      
      if (editingId) {
        await updateStudent(editingId, formData)
        alert('Student updated successfully!')
      } else {
        const result = await createStudent(formData)
        console.log('✅ Student created:', result)
        alert('Student created successfully!')
      }
      
      // Refresh student list
      await fetchStudents()
      
      setIsModalOpen(false)
      setFormData({ 
        name: '', 
        email: '', 
        password: '',
        enrollmentNumber: '',
        grade: '',
        section: '',
        stream: '', // Include stream field
        rollNumber: '',
        dateOfBirth: '',
        guardianName: '',
        guardianPhone: '',
        address: '',
        photo: null,
        classId: '',
        parentIds: []
      })
      setPhotoPreview(null)
      setPhotoError('')
      setEditingId(null)
    } catch (err) {
      console.error('❌ Error saving student:', err)
      console.error('Error details:', {
        message: err.message,
        response: err.response?.data,
        status: err.response?.status,
        url: err.config?.url
      })
      
      const errorMessage = err.response?.data?.message || err.message || 'Unknown error'
      alert(`Failed to ${editingId ? 'update' : 'create'} student: ${errorMessage}`)
    }
  }

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this student? This action cannot be undone.')) {
      return
    }

    try {
      await deleteStudent(id)
      alert('Student deleted successfully!')
      await fetchStudents()
    } catch (err) {
      console.error('Error deleting student:', err)
      alert('Failed to delete student: ' + err.message)
    }
  }

  const handleToggleStatus = async (student) => {
    try {
      const newStatus = student.status === 'active' ? 'inactive' : 'active'
      await updateStudent(student._id, { ...student, status: newStatus })
      alert(`Student ${newStatus === 'active' ? 'activated' : 'deactivated'} successfully!`)
      await fetchStudents()
    } catch (err) {
      console.error('Error toggling status:', err)
      alert('Failed to update student status: ' + err.message)
    }
  }

  const filteredStudents = Array.isArray(students) ? students.filter(student => {
    const searchLower = searchTerm.toLowerCase()
    const matchesSearch = student.name?.toLowerCase().includes(searchLower) ||
                         student.userId?.email?.toLowerCase().includes(searchLower) ||
                         student.enrollmentNumber?.toLowerCase().includes(searchLower)
    
    const matchesClass = filterClass === 'all' || 
                        `${student.grade} ${student.section}` === filterClass ||
                        student.grade === filterClass
    
    // Filter by academic year
    const matchesAcademicYear = filterAcademicYear === 'all' || 
                               student.currentEnrollment?.academicYear?._id === filterAcademicYear ||
                               student.currentEnrollment?.academicYearId?._id === filterAcademicYear ||
                               String(student.currentEnrollment?.academicYearId) === filterAcademicYear
    
    // Filter by enrollment status
    const matchesEnrollmentStatus = filterEnrollmentStatus === 'all' || 
                                   student.currentEnrollment?.status === filterEnrollmentStatus ||
                                   (filterEnrollmentStatus === 'not-enrolled' && !student.currentEnrollment)
    
    return matchesSearch && matchesClass && matchesAcademicYear && matchesEnrollmentStatus
  }) : []

  // Get unique class filters
  const classFilters = ['all', ...new Set(Array.isArray(students) ? students.map(s => `${s.grade} ${s.section}`).filter(Boolean) : [])]

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6 pt-8 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-300">Loading students...</p>
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
            <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100">Students Management</h1>
            <p className="text-gray-600 dark:text-gray-300 mt-1">Manage all students in the school</p>
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
            Add New Student
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
          <div className="flex flex-col gap-4">
            {/* Search Bar */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-3 text-gray-400 dark:text-gray-500" size={18} />
              <input
                type="text"
                placeholder="Search by name, email, or enrollment number..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
            {/* Filter Row */}
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex items-center gap-2 flex-1">
                <Filter size={18} className="text-gray-600 dark:text-gray-300" />
                <select
                  value={filterClass}
                  onChange={(e) => setFilterClass(e.target.value)}
                  className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-800"
                >
                  <option value="all">All Classes</option>
                  {classFilters.slice(1).map(cls => (
                    <option key={cls} value={cls}>{cls}</option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-2 flex-1">
                <Calendar size={18} className="text-gray-600 dark:text-gray-300" />
                <select
                  value={filterAcademicYear}
                  onChange={(e) => setFilterAcademicYear(e.target.value)}
                  className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-800"
                >
                  <option value="all">All Academic Years</option>
                  {academicYears.map(year => (
                    <option key={year._id} value={year._id}>
                      {year.name} {year.isActive ? '(Active)' : ''}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-2 flex-1">
                <Filter size={18} className="text-gray-600 dark:text-gray-300" />
                <select
                  value={filterEnrollmentStatus}
                  onChange={(e) => setFilterEnrollmentStatus(e.target.value)}
                  className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-800"
                >
                  <option value="all">All Enrollment Status</option>
                  <option value="active">Active</option>
                  <option value="promoted">Promoted</option>
                  <option value="transferred">Transferred</option>
                  <option value="graduated">Graduated</option>
                  <option value="withdrawn">Withdrawn</option>
                  <option value="suspended">Suspended</option>
                  <option value="not-enrolled">Not Enrolled</option>
                </select>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Students Table */}
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
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-200">Enrollment No</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-200">Grade</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-200">Section</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-200">Academic Year</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-200">Enrollment Status</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-200">Student Status</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-200">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredStudents.length > 0 ? (
                  filteredStudents.map((student, idx) => (
                    <motion.tr
                      key={student._id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.05 }}
                      className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800 transition"
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          {student.photo ? (
                            <img
                              src={resolvePhotoUrl(student.photo)}
                              alt={student.name || 'Student'}
                              className="w-9 h-9 rounded-full object-cover border border-gray-200 dark:border-gray-700"
                            />
                          ) : (
                            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-sm font-bold">
                              {(student.name || '?').charAt(0).toUpperCase()}
                            </div>
                          )}
                          <p className="font-medium text-gray-800 dark:text-gray-100">{student.name || 'N/A'}</p>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-gray-600 dark:text-gray-300 font-mono">{student.enrollmentNumber || 'N/A'}</td>
                      <td className="px-6 py-4 text-gray-600 dark:text-gray-300">
                        {student.currentEnrollment?.grade || student.grade || 'N/A'}
                      </td>
                      <td className="px-6 py-4 text-gray-600 dark:text-gray-300">
                        {student.currentEnrollment?.section || student.section || 'N/A'}
                        {(student.currentEnrollment?.stream || student.stream) && (
                          <span className="ml-1 text-xs text-gray-500 dark:text-gray-400">
                            ({student.currentEnrollment?.stream || student.stream})
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-gray-600 dark:text-gray-300 text-sm">
                        {student.currentEnrollment?.academicYear?.name || 
                         student.currentEnrollment?.academicYearId?.name || 
                         'N/A'}
                      </td>
                      <td className="px-6 py-4">
                        {student.currentEnrollment ? (
                          <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                            student.currentEnrollment.status === 'active' 
                              ? 'bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300' 
                              : student.currentEnrollment.status === 'promoted'
                              ? 'bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300'
                              : student.currentEnrollment.status === 'transferred'
                              ? 'bg-yellow-100 dark:bg-yellow-900/40 text-yellow-700 dark:text-yellow-300'
                              : student.currentEnrollment.status === 'graduated'
                              ? 'bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300'
                              : student.currentEnrollment.status === 'withdrawn'
                              ? 'bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300'
                              : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-200'
                          }`}>
                            {student.currentEnrollment.status.charAt(0).toUpperCase() + student.currentEnrollment.status.slice(1)}
                          </span>
                        ) : (
                          <span className="px-3 py-1 rounded-full text-xs font-medium bg-orange-100 dark:bg-orange-900/40 text-orange-700 dark:text-orange-300">
                            Not Enrolled
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                          student.status === 'active' 
                            ? 'bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300' 
                            : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-200'
                        }`}>
                          {student.status ? student.status.charAt(0).toUpperCase() + student.status.slice(1) : 'Active'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex gap-2">
                          <motion.button
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => handleOpenModal(student)}
                            className="p-2 hover:bg-blue-100 text-blue-600 dark:text-blue-400 rounded-lg transition"
                            title="Edit student"
                          >
                            <Edit2 size={16} />
                          </motion.button>
                          <motion.button
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => handleToggleStatus(student)}
                            className={`p-2 rounded-lg transition ${
                              student.status === 'active' 
                                ? 'hover:bg-yellow-100 text-yellow-600 dark:text-yellow-400' 
                                : 'hover:bg-green-100 text-green-600 dark:text-green-400'
                            }`}
                            title={student.status === 'active' ? 'Deactivate' : 'Activate'}
                          >
                            <Power size={16} />
                          </motion.button>
                          <motion.button
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => handleDelete(student._id)}
                            className="p-2 hover:bg-red-100 text-red-600 dark:text-red-400 rounded-lg transition"
                            title="Delete student"
                          >
                            <Trash2 size={16} />
                          </motion.button>
                        </div>
                      </td>
                    </motion.tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={8} className="px-6 py-12 text-center text-gray-500 dark:text-gray-400">
                      <p className="text-lg">No students found</p>
                      <p className="text-sm mt-1">Try adjusting your search or filter criteria, or add a new student</p>
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
          className="mt-6 grid md:grid-cols-5 gap-4"
        >
          <div className="bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-900/50 rounded-lg p-4">
            <p className="text-sm text-blue-600 dark:text-blue-400 font-medium">Total Students</p>
            <p className="text-2xl font-bold text-blue-700 dark:text-blue-300 mt-1">{Array.isArray(students) ? students.length : 0}</p>
          </div>
          <div className="bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-900/50 rounded-lg p-4">
            <p className="text-sm text-green-600 dark:text-green-400 font-medium">Active Students</p>
            <p className="text-2xl font-bold text-green-700 dark:text-green-300 mt-1">{Array.isArray(students) ? students.filter(s => s.status === 'active').length : 0}</p>
          </div>
          <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4">
            <p className="text-sm text-emerald-600 font-medium">Enrolled (Active)</p>
            <p className="text-2xl font-bold text-emerald-700 mt-1">{Array.isArray(students) ? students.filter(s => s.currentEnrollment?.status === 'active').length : 0}</p>
          </div>
          <div className="bg-orange-50 dark:bg-orange-900/30 border border-orange-200 dark:border-orange-900/50 rounded-lg p-4">
            <p className="text-sm text-orange-600 dark:text-orange-400 font-medium">Not Enrolled</p>
            <p className="text-2xl font-bold text-orange-700 dark:text-orange-300 mt-1">{Array.isArray(students) ? students.filter(s => !s.currentEnrollment).length : 0}</p>
          </div>
          <div className="bg-purple-50 dark:bg-purple-900/30 border border-purple-200 dark:border-purple-900/50 rounded-lg p-4">
            <p className="text-sm text-purple-600 dark:text-purple-400 font-medium">Filtered Results</p>
            <p className="text-2xl font-bold text-purple-700 dark:text-purple-300 mt-1">{filteredStudents.length}</p>
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
            className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-md w-full flex flex-col"
            style={{
              maxHeight: 'calc(100vh - 100px)'
            }}
          >
            {/* Header */}
            <div className="px-5 py-3 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
              <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100">
                {editingId ? 'Edit Student' : 'Add New Student'}
              </h2>
            </div>

            {/* Scrollable Body */}
            <div className="flex-1 overflow-y-auto px-5 py-4">
              <form id="student-form" onSubmit={handleSubmit} className="space-y-3">
                {/* Student Photo */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">Student Photo</label>
                  <div className="flex items-center gap-4">
                    {photoPreview ? (
                      <img
                        src={photoPreview}
                        alt="Student preview"
                        className="w-16 h-16 rounded-full object-cover border border-gray-200 dark:border-gray-700"
                      />
                    ) : (
                      <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-xl font-bold">
                        {(formData.name || '?').charAt(0).toUpperCase()}
                      </div>
                    )}
                    <div className="flex-1">
                      <label className="cursor-pointer inline-block px-4 py-2 text-sm font-medium text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-900/40 border border-blue-200 dark:border-blue-900/60 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/60 transition">
                        {photoPreview ? 'Change Photo' : 'Upload Photo'}
                        <input
                          type="file"
                          accept="image/jpeg,image/png,image/webp"
                          onChange={handlePhotoChange}
                          className="hidden"
                        />
                      </label>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        JPG, PNG or WEBP — large photos are resized automatically
                      </p>
                      {photoError && (
                        <p className="text-xs text-red-600 dark:text-red-400 mt-1">{photoError}</p>
                      )}
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">Student Name *</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Enter student name"
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
                    placeholder="student@example.com"
                    className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">Password {!editingId && '*'}</label>
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
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">Enrollment Number *</label>
                  <input
                    type="text"
                    value={formData.enrollmentNumber}
                    onChange={(e) => setFormData({ ...formData, enrollmentNumber: e.target.value })}
                    placeholder="e.g., STU-2026-001"
                    className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">Grade *</label>
                    <select
                      value={formData.grade}
                      onChange={(e) => {
                        const newGrade = e.target.value
                        setFormData({ 
                          ...formData, 
                          grade: newGrade,
                          // Reset stream if not Grade 11 or 12
                          stream: (newGrade === 'Grade 11' || newGrade === 'Grade 12') ? formData.stream : ''
                        })
                      }}
                      className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-800"
                      required
                    >
                      <option value="">Select Grade</option>
                      <option value="Grade 1">Grade 1</option>
                      <option value="Grade 2">Grade 2</option>
                      <option value="Grade 3">Grade 3</option>
                      <option value="Grade 4">Grade 4</option>
                      <option value="Grade 5">Grade 5</option>
                      <option value="Grade 6">Grade 6</option>
                      <option value="Grade 7">Grade 7</option>
                      <option value="Grade 8">Grade 8</option>
                      <option value="Grade 9">Grade 9</option>
                      <option value="Grade 10">Grade 10</option>
                      <option value="Grade 11">Grade 11</option>
                      <option value="Grade 12">Grade 12</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">Section *</label>
                    <select
                      value={formData.section}
                      onChange={(e) => setFormData({ ...formData, section: e.target.value })}
                      className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-800"
                      required
                    >
                      <option value="">Select Section</option>
                      {['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z'].map(section => (
                        <option key={section} value={section}>{section}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Stream field - Only for Grade 11 and 12 */}
                {(formData.grade === 'Grade 11' || formData.grade === 'Grade 12') && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">Stream *</label>
                    <select
                      value={formData.stream}
                      onChange={(e) => setFormData({ ...formData, stream: e.target.value })}
                      className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-800"
                      required
                    >
                      <option value="">Select Stream</option>
                      <option value="Natural Science">Natural Science</option>
                      <option value="Social Science">Social Science</option>
                    </select>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">Roll Number *</label>
                  <input
                    type="number"
                    min="1"
                    value={formData.rollNumber}
                    onChange={(e) => setFormData({ ...formData, rollNumber: e.target.value })}
                    placeholder="e.g., 1"
                    className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">Date of Birth *</label>
                  <input
                    type="date"
                    value={formData.dateOfBirth}
                    onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>

                {/* Guardian Information Section */}
                <div className="pt-4 mt-4 border-t border-gray-200 dark:border-gray-700">
                  <h3 className="text-base font-semibold text-gray-800 dark:text-gray-100 mb-3">Guardian Information</h3>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">Guardian Name *</label>
                  <input
                    type="text"
                    value={formData.guardianName}
                    onChange={(e) => setFormData({ ...formData, guardianName: e.target.value })}
                    placeholder="e.g., Ato Kebede Worku"
                    className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">Guardian Phone *</label>
                  <input
                    type="tel"
                    value={formData.guardianPhone}
                    onChange={(e) => setFormData({ ...formData, guardianPhone: e.target.value })}
                    placeholder="e.g., +251-91-234-5678"
                    className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">Address *</label>
                  <input
                    type="text"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    placeholder="e.g., Bole, Addis Ababa"
                    className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
              </form>
            </div>

            {/* Fixed Footer */}
            <div className="px-5 py-3 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 flex-shrink-0">
              <div className="flex gap-3">
                <button
                  type="submit"
                  form="student-form"
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-semibold text-sm"
                >
                  {editingId ? 'Update Student' : 'Add Student'}
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
