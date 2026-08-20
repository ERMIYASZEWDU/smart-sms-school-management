import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Award, Plus, Edit, Trash2, Search, FileSpreadsheet, TrendingUp } from 'lucide-react'
import { Modal } from '../../components/Modal'
import { Button } from '../../components/Button'
import { Input } from '../../components/Input'
import { getGrades, getStudents, getSubjects, createGrade, updateGrade } from '../../services/adminApi'

export const Results = () => {
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(true)
  const [students, setStudents] = useState([])
  const [subjects, setSubjects] = useState([])
  const [searchQuery, setSearchQuery] = useState('')
  const [filterSubject, setFilterSubject] = useState('all')
  const [filterGrade, setFilterGrade] = useState('all')

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      setLoading(true)
      const [gradesData, studentsData, subjectsData] = await Promise.all([
        getGrades(),
        getStudents(),
        getSubjects()
      ])
      // API responses are sometimes wrapped ({ students: [...] }) instead of plain arrays
      setResults(Array.isArray(gradesData) ? gradesData : (gradesData?.grades || []))
      setStudents(Array.isArray(studentsData) ? studentsData : (studentsData?.students || []))
      setSubjects(Array.isArray(subjectsData) ? subjectsData : (subjectsData?.subjects || []))
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setLoading(false)
    }
  }

  const calculateGrade = (score, maxScore = 100) => {
    const percentage = typeof score === 'number' && typeof maxScore === 'number' 
      ? (score / maxScore) * 100 
      : score // If score is already a percentage
    if (percentage >= 90) return 'A+'
    if (percentage >= 85) return 'A'
    if (percentage >= 80) return 'B+'
    if (percentage >= 75) return 'B'
    if (percentage >= 70) return 'C+'
    if (percentage >= 60) return 'C'
    if (percentage >= 50) return 'D'
    return 'F'
  }

  const filteredResults = results.filter(result => {
    const matchesSearch = result.studentId?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         result.studentId?.enrollmentNumber?.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesSubject = filterSubject === 'all' || result.subject === filterSubject
    const matchesGrade = filterGrade === 'all' || result.studentId?.grade === filterGrade
    
    return matchesSearch && matchesSubject && matchesGrade
  })

  const [showAddModal, setShowAddModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [selectedResult, setSelectedResult] = useState(null)
  const [saving, setSaving] = useState(false)
  const [formData, setFormData] = useState({
    studentId: '',
    subject: '',
    gradeType: 'midterm',
    score: '',
    maxScore: '50'
  })

  const handleAdd = () => {
    setFormData({
      studentId: '',
      subject: '',
      gradeType: 'midterm',
      score: '',
      maxScore: '50'
    })
    setShowAddModal(true)
  }

  const handleEdit = (result) => {
    setSelectedResult(result)
    setFormData({
      studentId: result.studentId?._id || '',
      subject: result.subject || '',
      gradeType: result.gradeType || 'midterm',
      score: result.score ?? '',
      maxScore: String(result.maxScore ?? 100)
    })
    setShowEditModal(true)
  }

  const handleSave = async () => {
    if (!formData.studentId || !formData.subject) {
      alert('Please select a student and enter a subject')
      return
    }
    const score = parseFloat(formData.score)
    const maxScore = parseFloat(formData.maxScore) || 100
    if (isNaN(score)) {
      alert('Please enter a valid score')
      return
    }
    if (score > maxScore) {
      alert(`Score cannot exceed the max score (${maxScore})`)
      return
    }

    setSaving(true)
    try {
      const payload = {
        studentId: formData.studentId,
        subject: formData.subject,
        gradeType: formData.gradeType,
        score,
        maxScore
      }
      if (showAddModal) {
        await createGrade(payload)
        alert('Result added successfully!')
      } else {
        await updateGrade(selectedResult._id, payload)
        alert('Result updated successfully!')
      }
      setShowAddModal(false)
      setShowEditModal(false)
      await fetchData()
    } catch (err) {
      console.error('Error saving result:', err)
      alert(err.response?.data?.message || 'Failed to save result')
    } finally {
      setSaving(false)
    }
  }

  const getGradeColor = (grade) => {
    switch (grade) {
      case 'A+': return 'bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300 border-green-300'
      case 'A': return 'bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 border-blue-300'
      case 'B+': return 'bg-cyan-100 dark:bg-cyan-900/40 text-cyan-700 dark:text-cyan-300 border-cyan-300'
      case 'B': return 'bg-yellow-100 dark:bg-yellow-900/40 text-yellow-700 dark:text-yellow-300 border-yellow-300'
      case 'C': return 'bg-orange-100 dark:bg-orange-900/40 text-orange-700 dark:text-orange-300 border-orange-300'
      case 'D': return 'bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300 border-red-300'
      case 'F': return 'bg-red-200 text-red-800 border-red-400'
      default: return 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-200 border-gray-300 dark:border-gray-600'
    }
  }

  const getStatusColor = (status) => {
    return status === 'Pass' 
      ? 'bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300 border-green-300' 
      : 'bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300 border-red-300'
  }

  const stats = {
    total: filteredResults.length,
    passed: filteredResults.filter(r => (r.score / (r.maxScore || 100)) >= 0.5).length,
    failed: filteredResults.filter(r => (r.score / (r.maxScore || 100)) < 0.5).length,
    avgPercentage: filteredResults.length > 0 
      ? (filteredResults.reduce((sum, r) => sum + ((r.score / (r.maxScore || 100)) * 100), 0) / filteredResults.length).toFixed(2)
      : 0
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
              <Award size={36} className="text-indigo-600 dark:text-indigo-400" />
              <h1 className="text-4xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                Results
              </h1>
            </div>
            <p className="text-gray-600 dark:text-gray-300 mt-2">Manage student exam results and marks</p>
          </div>
          <Button onClick={handleAdd} className="flex items-center gap-2">
            <Plus size={20} />
            Add Result
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
                <p className="text-gray-600 dark:text-gray-300 text-sm font-medium mb-1">Total Results</p>
                <p className="text-3xl font-bold text-indigo-600 dark:text-indigo-400">{stats.total}</p>
              </div>
              <div className="p-4 bg-indigo-50 dark:bg-indigo-900/30 rounded-xl">
                <FileSpreadsheet size={28} className="text-indigo-600 dark:text-indigo-400" />
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
                <p className="text-gray-600 dark:text-gray-300 text-sm font-medium mb-1">Passed</p>
                <p className="text-3xl font-bold text-green-600 dark:text-green-400">{stats.passed}</p>
              </div>
              <div className="p-4 bg-green-50 dark:bg-green-900/30 rounded-xl">
                <Award size={28} className="text-green-600 dark:text-green-400" />
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
                <p className="text-gray-600 dark:text-gray-300 text-sm font-medium mb-1">Failed</p>
                <p className="text-3xl font-bold text-red-600 dark:text-red-400">{stats.failed}</p>
              </div>
              <div className="p-4 bg-red-50 dark:bg-red-900/30 rounded-xl">
                <Award size={28} className="text-red-600 dark:text-red-400" />
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
                <p className="text-gray-600 dark:text-gray-300 text-sm font-medium mb-1">Avg Percentage</p>
                <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">{stats.avgPercentage}%</p>
              </div>
              <div className="p-4 bg-blue-50 dark:bg-blue-900/30 rounded-xl">
                <TrendingUp size={28} className="text-blue-600 dark:text-blue-400" />
              </div>
            </div>
          </motion.div>
        </div>

        {/* Search */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="mb-6"
        >
          <div className="relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500" size={20} />
            <input
              type="text"
              placeholder="Search by student name, roll number, or subject..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-800 shadow-sm"
            />
          </div>
        </motion.div>

        {/* Results Table */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-800 overflow-hidden"
        >
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gradient-to-r from-indigo-50 dark:from-indigo-900/40 to-purple-50 dark:to-purple-900/40">
                <tr>
                  <th className="text-left p-4 font-bold text-gray-700 dark:text-gray-200">Student</th>
                  <th className="text-left p-4 font-bold text-gray-700 dark:text-gray-200">Roll No</th>
                  <th className="text-left p-4 font-bold text-gray-700 dark:text-gray-200">Class</th>
                  <th className="text-left p-4 font-bold text-gray-700 dark:text-gray-200">Subject</th>
                  <th className="text-left p-4 font-bold text-gray-700 dark:text-gray-200">Exam</th>
                  <th className="text-left p-4 font-bold text-gray-700 dark:text-gray-200">Quiz</th>
                  <th className="text-left p-4 font-bold text-gray-700 dark:text-gray-200">Mid</th>
                  <th className="text-left p-4 font-bold text-gray-700 dark:text-gray-200">Final</th>
                  <th className="text-left p-4 font-bold text-gray-700 dark:text-gray-200">Total</th>
                  <th className="text-left p-4 font-bold text-gray-700 dark:text-gray-200">%</th>
                  <th className="text-left p-4 font-bold text-gray-700 dark:text-gray-200">Grade</th>
                  <th className="text-left p-4 font-bold text-gray-700 dark:text-gray-200">Status</th>
                  <th className="text-left p-4 font-bold text-gray-700 dark:text-gray-200">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={13} className="p-8 text-center text-gray-600 dark:text-gray-300">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto mb-2"></div>
                      Loading results...
                    </td>
                  </tr>
                ) : filteredResults.length === 0 ? (
                  <tr>
                    <td colSpan={13} className="p-8 text-center text-gray-600 dark:text-gray-300">
                      No results found
                    </td>
                  </tr>
                ) : (
                  filteredResults.map((result, index) => {
                    const percentage = ((result.score / (result.maxScore || 100)) * 100).toFixed(1)
                    const grade = calculateGrade(result.score, result.maxScore)
                    const status = parseFloat(percentage) >= 50 ? 'Pass' : 'Fail'
                    
                    return (
                      <motion.tr
                        key={result._id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.7 + index * 0.05 }}
                        className="border-b border-gray-100 dark:border-gray-800 hover:bg-indigo-50 transition-colors"
                      >
                        <td className="p-4 font-semibold text-gray-800 dark:text-gray-100">{result.studentId?.name || 'Unknown'}</td>
                        <td className="p-4 text-gray-700 dark:text-gray-200">{result.studentId?.enrollmentNumber || 'N/A'}</td>
                        <td className="p-4 text-gray-700 dark:text-gray-200">{result.studentId?.grade || 'N/A'} {result.studentId?.section || ''}</td>
                        <td className="p-4 text-indigo-600 dark:text-indigo-400 font-medium">{result.subject}</td>
                        <td className="p-4 text-gray-700 dark:text-gray-200">{result.gradeType}</td>
                        <td className="p-4 text-blue-600 dark:text-blue-400 font-semibold">-</td>
                        <td className="p-4 text-purple-600 dark:text-purple-400 font-semibold">-</td>
                        <td className="p-4 text-green-600 dark:text-green-400 font-semibold">-</td>
                        <td className="p-4 font-bold text-gray-800 dark:text-gray-100">{result.score}/{result.maxScore || 100}</td>
                        <td className="p-4 font-bold text-indigo-600 dark:text-indigo-400">{percentage}%</td>
                        <td className="p-4">
                          <span className={`px-3 py-1 rounded-full text-xs font-semibold border-2 ${getGradeColor(grade)}`}>
                            {grade}
                          </span>
                        </td>
                        <td className="p-4">
                          <span className={`px-3 py-1 rounded-full text-xs font-semibold border-2 ${getStatusColor(status)}`}>
                            {status}
                          </span>
                        </td>
                        <td className="p-4">
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleEdit(result)}
                              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition"
                              title="Edit"
                            >
                              <Edit size={16} className="text-gray-600 dark:text-gray-300" />
                            </button>
                          </div>
                        </td>
                      </motion.tr>
                    )
                  })
                )}
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
          title={showAddModal ? 'Add Result' : 'Edit Result'}
        >
          <div className="space-y-4">
            {/* Student Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">Student</label>
              <select
                value={formData.studentId}
                onChange={(e) => setFormData({ ...formData, studentId: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-800"
                disabled={showEditModal}
              >
                <option value="">Select Student</option>
                {students.map(student => (
                  <option key={student._id} value={student._id}>
                    {student.name} - {student.rollNumber} ({student.grade} {student.section})
                  </option>
                ))}
              </select>
            </div>

            {/* Subject */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">Subject</label>
              <Input
                type="text"
                value={formData.subject}
                onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                placeholder="e.g., Mathematics"
              />
            </div>

            {/* Exam Type (midterm/final only — teacher types are teacher-only) */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">Exam Type</label>
              <select
                value={formData.gradeType}
                onChange={(e) => setFormData({ ...formData, gradeType: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-800"
              >
                <option value="midterm">Midterm Exam</option>
                <option value="final">Final Exam</option>
              </select>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Midterm and final exams are entered by the admin — quizzes, assignments, and classwork are entered by teachers.
              </p>
            </div>

            {/* Score + Max Score */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">Score</label>
                <Input
                  type="number"
                  value={formData.score}
                  onChange={(e) => setFormData({ ...formData, score: e.target.value })}
                  placeholder="0"
                  min="0"
                  step="0.5"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">Max Score</label>
                <Input
                  type="number"
                  value={formData.maxScore}
                  onChange={(e) => setFormData({ ...formData, maxScore: e.target.value })}
                  placeholder="100"
                  min="1"
                  step="0.5"
                />
              </div>
            </div>

            {/* Preview Calculation */}
            {formData.score && formData.maxScore && (
              <div className="p-4 bg-gradient-to-r from-green-50 dark:from-green-900/40 to-blue-50 dark:to-blue-900/40 rounded-lg border-2 border-green-200 dark:border-green-900/50">
                <h4 className="text-sm font-semibold text-gray-800 dark:text-gray-100 mb-2">Result Preview</h4>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-gray-600 dark:text-gray-300">Score:</span>
                    <span className="font-bold text-indigo-600 dark:text-indigo-400 ml-1">{formData.score} / {formData.maxScore}</span>
                  </div>
                  <div>
                    <span className="text-gray-600 dark:text-gray-300">Percentage:</span>
                    <span className="font-bold text-blue-600 dark:text-blue-400 ml-1">
                      {((parseFloat(formData.score) / parseFloat(formData.maxScore)) * 100).toFixed(1)}%
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-600 dark:text-gray-300">Grade:</span>
                    <span className="font-bold text-green-600 dark:text-green-400 ml-1">
                      {calculateGrade((parseFloat(formData.score) / parseFloat(formData.maxScore)) * 100)}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-600 dark:text-gray-300">Status:</span>
                    <span className="font-bold text-green-600 dark:text-green-400 ml-1">
                      {(parseFloat(formData.score) / parseFloat(formData.maxScore)) * 100 >= 50 ? 'Pass' : 'Fail'}
                    </span>
                  </div>
                </div>
              </div>
            )}

            <div className="flex gap-3 pt-4">
              <Button onClick={handleSave} disabled={saving} className="flex-1">
                {saving ? 'Saving...' : (showAddModal ? 'Add Result' : 'Save Changes')}
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
