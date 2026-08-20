import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Users, 
  ArrowUpCircle, 
  ArrowRightCircle, 
  Calendar,
  Search,
  Filter,
  CheckCircle,
  XCircle,
  AlertCircle,
  FileText
} from 'lucide-react'
import { useTranslation } from 'react-i18next'
import api from '../../utils/api'

export const EnrollmentManagement = () => {
  const { t } = useTranslation()
  const [activeTab, setActiveTab] = useState('enroll') // enroll, promote, transfer, history
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(null)

  // Data states
  const [academicYears, setAcademicYears] = useState([])
  const [classes, setClasses] = useState([])
  const [students, setStudents] = useState([])
  const [enrollments, setEnrollments] = useState([])

  // Form states for enrollment
  const [enrollForm, setEnrollForm] = useState({
    studentId: '',
    classId: '',
    academicYearId: '',
    rollNumber: '',
    enrollmentDate: new Date().toISOString().split('T')[0]
  })

  // Form states for promotion
  const [promoteForm, setPromoteForm] = useState({
    sourceAcademicYearId: '',
    sourceGrade: '',
    sourceSection: '',
    sourceStream: '',
    targetAcademicYearId: '',
    targetGrade: '',
    targetSection: '',
    targetStream: '',
    studentIds: []
  })

  // Form states for transfer
  const [transferForm, setTransferForm] = useState({
    studentId: '',
    sourceClassId: '',
    targetClassId: '',
    targetAcademicYearId: '',
    reason: ''
  })

  // Filter states
  const [filterAcademicYear, setFilterAcademicYear] = useState('')
  const [filterGrade, setFilterGrade] = useState('')
  const [filterSection, setFilterSection] = useState('')
  const [filterStream, setFilterStream] = useState('')
  const [filterStatus, setFilterStatus] = useState('active')
  const [searchTerm, setSearchTerm] = useState('')

  // Preview states
  const [previewStudents, setPreviewStudents] = useState([])
  const [showPreview, setShowPreview] = useState(false)

  // Fetch initial data
  useEffect(() => {
    fetchAcademicYears()
    fetchClasses()
    fetchStudents()
  }, [])

  // Fetch academic years when tab changes
  useEffect(() => {
    if (activeTab === 'history') {
      fetchEnrollments()
    }
  }, [activeTab, filterAcademicYear, filterGrade, filterSection, filterStream, filterStatus])

  const fetchAcademicYears = async () => {
    try {
      const response = await api.get('/api/admin/academic-years')
      setAcademicYears(response.data)
      // Set default to active year
      const activeYear = response.data.find(y => y.isActive)
      if (activeYear) {
        setFilterAcademicYear(activeYear._id)
        setEnrollForm(prev => ({ ...prev, academicYearId: activeYear._id }))
        setPromoteForm(prev => ({ ...prev, sourceAcademicYearId: activeYear._id }))
      }
    } catch (err) {
      console.error('Error fetching academic years:', err)
      setError('Failed to load academic years')
    }
  }

  const fetchClasses = async () => {
    try {
      const response = await api.get('/api/admin/classes')
      setClasses(response.data)
    } catch (err) {
      console.error('Error fetching classes:', err)
      setError('Failed to load classes')
    }
  }

  const fetchStudents = async () => {
    try {
      const response = await api.get('/api/admin/students')
      const studentData = Array.isArray(response.data) ? response.data : response.data.students || []
      setStudents(studentData)
    } catch (err) {
      console.error('Error fetching students:', err)
      setError('Failed to load students')
    }
  }

  const fetchEnrollments = async () => {
    try {
      if (!filterAcademicYear) return
      
      setLoading(true)
      const params = new URLSearchParams()
      if (filterGrade) params.append('grade', filterGrade)
      if (filterSection) params.append('section', filterSection)
      if (filterStream) params.append('stream', filterStream)
      if (filterStatus) params.append('status', filterStatus)

      const response = await api.get(
        `/api/enrollment/academic-year/${filterAcademicYear}/students?${params.toString()}`
      )
      setEnrollments(response.data)
    } catch (err) {
      console.error('Error fetching enrollments:', err)
      setError('Failed to load enrollments')
    } finally {
      setLoading(false)
    }
  }

  // Handle enrollment submission
  const handleEnroll = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setSuccess(null)

    try {
      await api.post('/api/enrollment/enroll', enrollForm)
      setSuccess('Student enrolled successfully!')
      setEnrollForm({
        studentId: '',
        classId: '',
        academicYearId: enrollForm.academicYearId, // Keep academic year
        rollNumber: '',
        enrollmentDate: new Date().toISOString().split('T')[0]
      })
      fetchStudents()
      fetchEnrollments()
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to enroll student')
    } finally {
      setLoading(false)
    }
  }

  // Handle promotion preview
  const handlePromotePreview = async () => {
    setError(null)
    setLoading(true)

    try {
      // Validate form
      if (!promoteForm.sourceAcademicYearId || !promoteForm.targetAcademicYearId) {
        setError('Please select both source and target academic years')
        return
      }

      if (!promoteForm.targetGrade) {
        setError('Please select target grade')
        return
      }

      // Fetch students from source class
      const sourceClass = classes.find(c => 
        c.grade === promoteForm.sourceGrade &&
        c.section === promoteForm.sourceSection &&
        (promoteForm.sourceStream ? c.stream === promoteForm.sourceStream : true) &&
        c.academicYearId === promoteForm.sourceAcademicYearId
      )

      if (!sourceClass) {
        setError('Source class not found')
        return
      }

      // Get enrollments for source class
      const response = await api.get(
        `/api/enrollment/class/${sourceClass._id}/students?academicYearId=${promoteForm.sourceAcademicYearId}&status=active`
      )
      
      setPreviewStudents(response.data)
      setPromoteForm(prev => ({ 
        ...prev, 
        studentIds: response.data.map(e => e.studentId._id) 
      }))
      setShowPreview(true)
    } catch (err) {
      console.error('Error fetching students for promotion:', err)
      setError(err.response?.data?.message || 'Failed to fetch students')
    } finally {
      setLoading(false)
    }
  }

  // Handle promotion submission
  const handlePromote = async () => {
    setLoading(true)
    setError(null)
    setSuccess(null)

    try {
      // Find target class
      const targetClass = classes.find(c => 
        c.grade === promoteForm.targetGrade &&
        c.section === promoteForm.targetSection &&
        (promoteForm.targetStream ? c.stream === promoteForm.targetStream : true) &&
        c.academicYearId === promoteForm.targetAcademicYearId
      )

      if (!targetClass) {
        setError('Target class not found. Please create the target class first.')
        return
      }

      const response = await api.post('/api/enrollment/promote', {
        studentIds: promoteForm.studentIds,
        targetClassId: targetClass._id,
        targetAcademicYearId: promoteForm.targetAcademicYearId
      })

      setSuccess(`Successfully promoted ${response.data.promoted.length} students!`)
      if (response.data.errors && response.data.errors.length > 0) {
        setError(`Failed to promote ${response.data.errors.length} students`)
      }
      
      setShowPreview(false)
      setPreviewStudents([])
      setPromoteForm({
        sourceAcademicYearId: promoteForm.sourceAcademicYearId,
        sourceGrade: '',
        sourceSection: '',
        sourceStream: '',
        targetAcademicYearId: '',
        targetGrade: '',
        targetSection: '',
        targetStream: '',
        studentIds: []
      })
      
      fetchStudents()
      fetchEnrollments()
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to promote students')
    } finally {
      setLoading(false)
    }
  }

  // Handle transfer submission
  const handleTransfer = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setSuccess(null)

    try {
      await api.post('/api/enrollment/transfer', transferForm)
      setSuccess('Student transferred successfully!')
      setTransferForm({
        studentId: '',
        sourceClassId: '',
        targetClassId: '',
        targetAcademicYearId: transferForm.targetAcademicYearId,
        reason: ''
      })
      fetchStudents()
      fetchEnrollments()
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to transfer student')
    } finally {
      setLoading(false)
    }
  }

  // Filter classes based on academic year
  const getFilteredClasses = (academicYearId, grade = null) => {
    return classes.filter(c => {
      const matchesYear = c.academicYearId === academicYearId
      const matchesGrade = grade ? c.grade === grade : true
      return matchesYear && matchesGrade
    })
  }

  // Get available students for enrollment (not enrolled in selected academic year)
  const getAvailableStudents = () => {
    if (!enrollForm.academicYearId) return students

    return students.filter(student => {
      // Check if student already has active enrollment in this academic year
      return !enrollments.some(enrollment => 
        enrollment.studentId?._id === student._id && 
        enrollment.academicYearId?._id === enrollForm.academicYearId &&
        enrollment.status === 'active'
      )
    })
  }

  const grades = ['Grade 1', 'Grade 2', 'Grade 3', 'Grade 4', 'Grade 5', 'Grade 6', 
                  'Grade 7', 'Grade 8', 'Grade 9', 'Grade 10', 'Grade 11', 'Grade 12']
  const sections = ['A', 'B', 'C', 'D', 'E']
  const streams = ['Natural Science', 'Social Science']
  const statuses = ['active', 'promoted', 'transferred', 'graduated', 'withdrawn', 'suspended', 'completed']

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          {t('enrollmentManagement') || 'Enrollment Management'}
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          {t('enrollmentManagementDesc') || 'Manage student enrollments, promotions, and transfers'}
        </p>
      </motion.div>

      {/* Notifications */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="mb-4 p-4 bg-red-100 dark:bg-red-900/30 border border-red-400 dark:border-red-700 rounded-lg flex items-center gap-2 text-red-700 dark:text-red-400"
          >
            <XCircle className="w-5 h-5" />
            <span>{error}</span>
          </motion.div>
        )}
        {success && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="mb-4 p-4 bg-green-100 dark:bg-green-900/30 border border-green-400 dark:border-green-700 rounded-lg flex items-center gap-2 text-green-700 dark:text-green-400"
          >
            <CheckCircle className="w-5 h-5" />
            <span>{success}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Tabs */}
      <div className="mb-6 border-b border-gray-200 dark:border-gray-700">
        <nav className="flex gap-4 sm:gap-8 overflow-x-auto">
          {[
            { id: 'enroll', label: t('enroll') || 'Enroll', icon: Users },
            { id: 'promote', label: t('promote') || 'Promote', icon: ArrowUpCircle },
            { id: 'transfer', label: t('transfer') || 'Transfer', icon: ArrowRightCircle },
            { id: 'history', label: t('history') || 'History', icon: FileText }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`
                flex items-center gap-2 pb-4 px-1 border-b-2 font-medium transition-colors whitespace-nowrap
                ${activeTab === tab.id
                  ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
                }
              `}
            >
              <tab.icon className="w-5 h-5" />
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <AnimatePresence mode="wait">
        {/* Enroll Tab */}
        {activeTab === 'enroll' && (
          <motion.div
            key="enroll"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6"
          >
            <h2 className="text-xl font-semibold mb-6 text-gray-900 dark:text-white flex items-center gap-2">
              <Users className="w-6 h-6" />
              {t('enrollStudent') || 'Enroll Student'}
            </h2>

            <form onSubmit={handleEnroll} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Academic Year */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    {t('academicYear') || 'Academic Year'} *
                  </label>
                  <select
                    value={enrollForm.academicYearId}
                    onChange={(e) => setEnrollForm({ ...enrollForm, academicYearId: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    required
                  >
                    <option value="">{t('selectAcademicYear') || 'Select Academic Year'}</option>
                    {academicYears.map(year => (
                      <option key={year._id} value={year._id}>
                        {year.name} {year.isActive ? '(Active)' : ''}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Student */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    {t('student') || 'Student'} *
                  </label>
                  <select
                    value={enrollForm.studentId}
                    onChange={(e) => setEnrollForm({ ...enrollForm, studentId: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    required
                  >
                    <option value="">{t('selectStudent') || 'Select Student'}</option>
                    {getAvailableStudents().map(student => (
                      <option key={student._id} value={student._id}>
                        {student.name} ({student.enrollmentNumber})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Class */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    {t('class') || 'Class'} *
                  </label>
                  <select
                    value={enrollForm.classId}
                    onChange={(e) => setEnrollForm({ ...enrollForm, classId: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    required
                    disabled={!enrollForm.academicYearId}
                  >
                    <option value="">{t('selectClass') || 'Select Class'}</option>
                    {getFilteredClasses(enrollForm.academicYearId).map(cls => (
                      <option key={cls._id} value={cls._id}>
                        {cls.grade} - {cls.section}{cls.stream ? ` (${cls.stream})` : ''}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Roll Number */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    {t('rollNumber') || 'Roll Number'}
                  </label>
                  <input
                    type="number"
                    value={enrollForm.rollNumber}
                    onChange={(e) => setEnrollForm({ ...enrollForm, rollNumber: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    placeholder="Auto-generated if left empty"
                  />
                </div>

                {/* Enrollment Date */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    {t('enrollmentDate') || 'Enrollment Date'} *
                  </label>
                  <input
                    type="date"
                    value={enrollForm.enrollmentDate}
                    onChange={(e) => setEnrollForm({ ...enrollForm, enrollmentDate: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    required
                  />
                </div>
              </div>

              <div className="flex justify-end gap-4">
                <button
                  type="button"
                  onClick={() => setEnrollForm({
                    studentId: '',
                    classId: '',
                    academicYearId: enrollForm.academicYearId,
                    rollNumber: '',
                    enrollmentDate: new Date().toISOString().split('T')[0]
                  })}
                  className="px-6 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                >
                  {t('reset') || 'Reset'}
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  <Users className="w-5 h-5" />
                  {loading ? (t('enrolling') || 'Enrolling...') : (t('enrollStudent') || 'Enroll Student')}
                </button>
              </div>
            </form>
          </motion.div>
        )}

        {/* Promote Tab */}
        {activeTab === 'promote' && (
          <motion.div
            key="promote"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6"
          >
            <h2 className="text-xl font-semibold mb-6 text-gray-900 dark:text-white flex items-center gap-2">
              <ArrowUpCircle className="w-6 h-6" />
              {t('promoteStudents') || 'Promote Students'}
            </h2>

            <div className="space-y-6">
              {/* Source Academic Year & Class */}
              <div className="border-b border-gray-200 dark:border-gray-700 pb-6">
                <h3 className="text-lg font-medium mb-4 text-gray-900 dark:text-white">
                  {t('sourceClass') || 'Source Class'}
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      {t('academicYear') || 'Academic Year'} *
                    </label>
                    <select
                      value={promoteForm.sourceAcademicYearId}
                      onChange={(e) => setPromoteForm({ ...promoteForm, sourceAcademicYearId: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    >
                      <option value="">{t('select') || 'Select'}</option>
                      {academicYears.map(year => (
                        <option key={year._id} value={year._id}>{year.name}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      {t('grade') || 'Grade'} *
                    </label>
                    <select
                      value={promoteForm.sourceGrade}
                      onChange={(e) => setPromoteForm({ ...promoteForm, sourceGrade: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    >
                      <option value="">{t('select') || 'Select'}</option>
                      {grades.slice(0, -1).map(grade => (
                        <option key={grade} value={grade}>{grade}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      {t('section') || 'Section'} *
                    </label>
                    <select
                      value={promoteForm.sourceSection}
                      onChange={(e) => setPromoteForm({ ...promoteForm, sourceSection: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    >
                      <option value="">{t('select') || 'Select'}</option>
                      {sections.map(section => (
                        <option key={section} value={section}>{section}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      {t('stream') || 'Stream'}
                    </label>
                    <select
                      value={promoteForm.sourceStream}
                      onChange={(e) => setPromoteForm({ ...promoteForm, sourceStream: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      disabled={promoteForm.sourceGrade !== 'Grade 11' && promoteForm.sourceGrade !== 'Grade 12'}
                    >
                      <option value="">{t('none') || 'None'}</option>
                      {streams.map(stream => (
                        <option key={stream} value={stream}>{stream}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Target Academic Year & Class */}
              <div className="border-b border-gray-200 dark:border-gray-700 pb-6">
                <h3 className="text-lg font-medium mb-4 text-gray-900 dark:text-white">
                  {t('targetClass') || 'Target Class'}
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      {t('academicYear') || 'Academic Year'} *
                    </label>
                    <select
                      value={promoteForm.targetAcademicYearId}
                      onChange={(e) => setPromoteForm({ ...promoteForm, targetAcademicYearId: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    >
                      <option value="">{t('select') || 'Select'}</option>
                      {academicYears.map(year => (
                        <option key={year._id} value={year._id}>{year.name}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      {t('grade') || 'Grade'} *
                    </label>
                    <select
                      value={promoteForm.targetGrade}
                      onChange={(e) => setPromoteForm({ ...promoteForm, targetGrade: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    >
                      <option value="">{t('select') || 'Select'}</option>
                      {grades.map(grade => (
                        <option key={grade} value={grade}>{grade}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      {t('section') || 'Section'} *
                    </label>
                    <select
                      value={promoteForm.targetSection}
                      onChange={(e) => setPromoteForm({ ...promoteForm, targetSection: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    >
                      <option value="">{t('select') || 'Select'}</option>
                      {sections.map(section => (
                        <option key={section} value={section}>{section}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      {t('stream') || 'Stream'} {(promoteForm.targetGrade === 'Grade 11' || promoteForm.targetGrade === 'Grade 12') && '*'}
                    </label>
                    <select
                      value={promoteForm.targetStream}
                      onChange={(e) => setPromoteForm({ ...promoteForm, targetStream: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      disabled={promoteForm.targetGrade !== 'Grade 11' && promoteForm.targetGrade !== 'Grade 12'}
                      required={promoteForm.targetGrade === 'Grade 11' || promoteForm.targetGrade === 'Grade 12'}
                    >
                      <option value="">{t('select') || 'Select'}</option>
                      {streams.map(stream => (
                        <option key={stream} value={stream}>{stream}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-4">
                <button
                  type="button"
                  onClick={handlePromotePreview}
                  disabled={loading}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  <Search className="w-5 h-5" />
                  {loading ? (t('loading') || 'Loading...') : (t('previewStudents') || 'Preview Students')}
                </button>
              </div>

              {/* Preview Modal */}
              {showPreview && (
                <div className="mt-6 border border-gray-300 dark:border-gray-600 rounded-lg p-6 bg-gray-50 dark:bg-gray-900">
                  <h3 className="text-lg font-medium mb-4 text-gray-900 dark:text-white flex items-center gap-2">
                    <AlertCircle className="w-5 h-5" />
                    {t('studentsToPromote') || 'Students to Promote'} ({previewStudents.length})
                  </h3>

                  {previewStudents.length === 0 ? (
                    <p className="text-gray-600 dark:text-gray-400">
                      {t('noStudentsFound') || 'No students found in the source class'}
                    </p>
                  ) : (
                    <>
                      <div className="max-h-96 overflow-y-auto mb-4">
                        <table className="w-full">
                          <thead className="bg-gray-100 dark:bg-gray-800 sticky top-0">
                            <tr>
                              <th className="px-4 py-2 text-left text-sm font-medium text-gray-700 dark:text-gray-300">
                                {t('rollNumber') || 'Roll #'}
                              </th>
                              <th className="px-4 py-2 text-left text-sm font-medium text-gray-700 dark:text-gray-300">
                                {t('name') || 'Name'}
                              </th>
                              <th className="px-4 py-2 text-left text-sm font-medium text-gray-700 dark:text-gray-300">
                                {t('enrollmentNumber') || 'Enrollment #'}
                              </th>
                              <th className="px-4 py-2 text-left text-sm font-medium text-gray-700 dark:text-gray-300">
                                {t('currentClass') || 'Current Class'}
                              </th>
                            </tr>
                          </thead>
                          <tbody>
                            {previewStudents.map(enrollment => (
                              <tr key={enrollment._id} className="border-t border-gray-200 dark:border-gray-700">
                                <td className="px-4 py-2 text-sm text-gray-900 dark:text-white">
                                  {enrollment.rollNumber}
                                </td>
                                <td className="px-4 py-2 text-sm text-gray-900 dark:text-white">
                                  {enrollment.studentId?.name}
                                </td>
                                <td className="px-4 py-2 text-sm text-gray-600 dark:text-gray-400">
                                  {enrollment.studentId?.enrollmentNumber}
                                </td>
                                <td className="px-4 py-2 text-sm text-gray-600 dark:text-gray-400">
                                  {enrollment.grade} - {enrollment.section}
                                  {enrollment.stream && ` (${enrollment.stream})`}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>

                      <div className="flex justify-end gap-4">
                        <button
                          type="button"
                          onClick={() => {
                            setShowPreview(false)
                            setPreviewStudents([])
                          }}
                          className="px-6 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                        >
                          {t('cancel') || 'Cancel'}
                        </button>
                        <button
                          type="button"
                          onClick={handlePromote}
                          disabled={loading}
                          className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                        >
                          <ArrowUpCircle className="w-5 h-5" />
                          {loading ? (t('promoting') || 'Promoting...') : (t('confirmPromotion') || 'Confirm Promotion')}
                        </button>
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>
          </motion.div>
        )}

        {/* Transfer Tab */}
        {activeTab === 'transfer' && (
          <motion.div
            key="transfer"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6"
          >
            <h2 className="text-xl font-semibold mb-6 text-gray-900 dark:text-white flex items-center gap-2">
              <ArrowRightCircle className="w-6 h-6" />
              {t('transferStudent') || 'Transfer Student'}
            </h2>

            <form onSubmit={handleTransfer} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Student */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    {t('student') || 'Student'} *
                  </label>
                  <select
                    value={transferForm.studentId}
                    onChange={(e) => {
                      const student = students.find(s => s._id === e.target.value)
                      setTransferForm({ 
                        ...transferForm, 
                        studentId: e.target.value,
                        sourceClassId: student?.classId?._id || student?.classId || ''
                      })
                    }}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    required
                  >
                    <option value="">{t('selectStudent') || 'Select Student'}</option>
                    {students.filter(s => s.status === 'active').map(student => (
                      <option key={student._id} value={student._id}>
                        {student.name} ({student.enrollmentNumber}) - Current: {student.grade} {student.section}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Target Academic Year */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    {t('targetAcademicYear') || 'Target Academic Year'} *
                  </label>
                  <select
                    value={transferForm.targetAcademicYearId}
                    onChange={(e) => setTransferForm({ ...transferForm, targetAcademicYearId: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    required
                  >
                    <option value="">{t('selectAcademicYear') || 'Select Academic Year'}</option>
                    {academicYears.map(year => (
                      <option key={year._id} value={year._id}>
                        {year.name} {year.isActive ? '(Active)' : ''}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Target Class */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    {t('targetClass') || 'Target Class'} *
                  </label>
                  <select
                    value={transferForm.targetClassId}
                    onChange={(e) => setTransferForm({ ...transferForm, targetClassId: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    required
                    disabled={!transferForm.targetAcademicYearId}
                  >
                    <option value="">{t('selectClass') || 'Select Class'}</option>
                    {getFilteredClasses(transferForm.targetAcademicYearId).map(cls => (
                      <option key={cls._id} value={cls._id}>
                        {cls.grade} - {cls.section}{cls.stream ? ` (${cls.stream})` : ''}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Reason */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    {t('reason') || 'Reason'}
                  </label>
                  <input
                    type="text"
                    value={transferForm.reason}
                    onChange={(e) => setTransferForm({ ...transferForm, reason: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    placeholder="Optional transfer reason"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-4">
                <button
                  type="button"
                  onClick={() => setTransferForm({
                    studentId: '',
                    sourceClassId: '',
                    targetClassId: '',
                    targetAcademicYearId: '',
                    reason: ''
                  })}
                  className="px-6 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                >
                  {t('reset') || 'Reset'}
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  <ArrowRightCircle className="w-5 h-5" />
                  {loading ? (t('transferring') || 'Transferring...') : (t('transferStudent') || 'Transfer Student')}
                </button>
              </div>
            </form>
          </motion.div>
        )}

        {/* History Tab */}
        {activeTab === 'history' && (
          <motion.div
            key="history"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
          >
            {/* Filters */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
              <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white flex items-center gap-2">
                <Filter className="w-5 h-5" />
                {t('filters') || 'Filters'}
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    {t('academicYear') || 'Academic Year'}
                  </label>
                  <select
                    value={filterAcademicYear}
                    onChange={(e) => setFilterAcademicYear(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  >
                    <option value="">{t('all') || 'All'}</option>
                    {academicYears.map(year => (
                      <option key={year._id} value={year._id}>{year.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    {t('grade') || 'Grade'}
                  </label>
                  <select
                    value={filterGrade}
                    onChange={(e) => setFilterGrade(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  >
                    <option value="">{t('all') || 'All'}</option>
                    {grades.map(grade => (
                      <option key={grade} value={grade}>{grade}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    {t('section') || 'Section'}
                  </label>
                  <select
                    value={filterSection}
                    onChange={(e) => setFilterSection(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  >
                    <option value="">{t('all') || 'All'}</option>
                    {sections.map(section => (
                      <option key={section} value={section}>{section}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    {t('stream') || 'Stream'}
                  </label>
                  <select
                    value={filterStream}
                    onChange={(e) => setFilterStream(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  >
                    <option value="">{t('all') || 'All'}</option>
                    {streams.map(stream => (
                      <option key={stream} value={stream}>{stream}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    {t('status') || 'Status'}
                  </label>
                  <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  >
                    <option value="">{t('all') || 'All'}</option>
                    {statuses.map(status => (
                      <option key={status} value={status}>
                        {status.charAt(0).toUpperCase() + status.slice(1)}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Enrollments Table */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 dark:bg-gray-900">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        {t('student') || 'Student'}
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        {t('enrollmentNumber') || 'Enrollment #'}
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        {t('class') || 'Class'}
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        {t('rollNumber') || 'Roll #'}
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        {t('status') || 'Status'}
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        {t('enrollmentDate') || 'Enrollment Date'}
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                    {loading ? (
                      <tr>
                        <td colSpan={6} className="px-6 py-4 text-center text-gray-500 dark:text-gray-400">
                          {t('loading') || 'Loading...'}
                        </td>
                      </tr>
                    ) : enrollments.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="px-6 py-4 text-center text-gray-500 dark:text-gray-400">
                          {t('noEnrollmentsFound') || 'No enrollments found'}
                        </td>
                      </tr>
                    ) : (
                      enrollments.map(enrollment => (
                        <tr key={enrollment._id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                            {enrollment.studentId?.name}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400">
                            {enrollment.studentId?.enrollmentNumber}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400">
                            {enrollment.grade} - {enrollment.section}
                            {enrollment.stream && ` (${enrollment.stream})`}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400">
                            {enrollment.rollNumber}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`
                              px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full
                              ${enrollment.status === 'active' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' : ''}
                              ${enrollment.status === 'promoted' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400' : ''}
                              ${enrollment.status === 'transferred' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400' : ''}
                              ${enrollment.status === 'graduated' ? 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400' : ''}
                              ${enrollment.status === 'withdrawn' ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400' : ''}
                              ${enrollment.status === 'suspended' ? 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400' : ''}
                              ${enrollment.status === 'completed' ? 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400' : ''}
                            `}>
                              {enrollment.status.charAt(0).toUpperCase() + enrollment.status.slice(1)}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400">
                            {new Date(enrollment.enrollmentDate).toLocaleDateString()}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default EnrollmentManagement
