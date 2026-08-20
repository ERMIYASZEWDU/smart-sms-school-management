import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Award, Edit, Save, X, Plus } from 'lucide-react'
import { getGrades, updateGrade, createGrade, getMyStudents } from '../../services/teacherApi'

// Grade types teachers are allowed to enter (midterm/final are entered by the admin)
const TEACHER_GRADE_TYPES = [
  { value: 'quiz', label: 'Quiz', defaultMax: 10 },
  { value: 'assignment', label: 'Assignment', defaultMax: 20 },
  { value: 'classwork', label: 'Classwork', defaultMax: 10 }
]

const typeColor = (type) => {
  switch (type) {
    case 'quiz': return 'bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300'
    case 'assignment': return 'bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300'
    case 'classwork': return 'bg-teal-100 dark:bg-teal-900/40 text-teal-700 dark:text-teal-300'
    default: return 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-200'
  }
}

export const TeacherGrades = () => {
  const [grades, setGrades] = useState([])
  const [loading, setLoading] = useState(true)
  const [students, setStudents] = useState([])
  const [showAddModal, setShowAddModal] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [editForm, setEditForm] = useState({ score: '', maxScore: '100' })
  const [newGrade, setNewGrade] = useState({
    studentId: '',
    subject: 'Mathematics',
    gradeType: 'quiz',
    score: '',
    maxScore: '10'
  })

  useEffect(() => {
    fetchGrades()
    fetchStudents()
  }, [])

  const fetchGrades = async () => {
    try {
      setLoading(true)
      const data = await getGrades()
      setGrades(Array.isArray(data) ? data : (data?.grades || []))
    } catch (error) {
      console.error('Error fetching grades:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchStudents = async () => {
    try {
      const data = await getMyStudents()
      setStudents(Array.isArray(data) ? data : (data?.students || []))
    } catch (error) {
      console.error('Error fetching students:', error)
    }
  }

  const handleEdit = (grade) => {
    setEditingId(grade._id)
    setEditForm({ score: String(grade.score ?? ''), maxScore: String(grade.maxScore ?? '100') })
  }

  const handleCancelEdit = () => {
    setEditingId(null)
    setEditForm({ score: '', maxScore: '100' })
  }

  const handleSaveEdit = async (gradeId) => {
    try {
      await updateGrade(gradeId, {
        score: parseFloat(editForm.score),
        maxScore: parseFloat(editForm.maxScore) || 100
      })
      await fetchGrades()
      setEditingId(null)
      setEditForm({ score: '', maxScore: '100' })
    } catch (error) {
      console.error('Error updating grade:', error)
      alert(error.response?.data?.message || 'Failed to update grade')
    }
  }

  const handleTypeChange = (type) => {
    const t = TEACHER_GRADE_TYPES.find(x => x.value === type)
    setNewGrade(prev => ({ ...prev, gradeType: type, maxScore: String(t?.defaultMax ?? '100') }))
  }

  const handleAddGrade = async (e) => {
    e.preventDefault()
    try {
      await createGrade({
        studentId: newGrade.studentId,
        subject: newGrade.subject,
        score: parseFloat(newGrade.score),
        gradeType: newGrade.gradeType,
        maxScore: parseFloat(newGrade.maxScore) || 100
      })
      setShowAddModal(false)
      setNewGrade({ studentId: '', subject: 'Mathematics', gradeType: 'quiz', score: '', maxScore: '10' })
      await fetchGrades()
    } catch (error) {
      console.error('Error creating grade:', error)
      alert(error.response?.data?.message || 'Failed to create grade')
    }
  }

  const calculateGrade = (percentage) => {
    if (percentage >= 90) return 'A+'
    if (percentage >= 85) return 'A'
    if (percentage >= 80) return 'B+'
    if (percentage >= 75) return 'B'
    if (percentage >= 70) return 'C+'
    if (percentage >= 60) return 'C'
    if (percentage >= 50) return 'D'
    return 'F'
  }

  // Display shape: each grade row shows its own type, score and percentage
  const displayGrades = grades.map(g => {
    const pct = g.maxScore ? (g.score / g.maxScore) * 100 : (g.score || 0)
    return {
      ...g,
      studentName: g.studentId?.name || 'Unknown',
      enrollmentNumber: g.studentId?.enrollmentNumber || 'N/A',
      className: `${g.studentId?.grade || 'N/A'} ${g.studentId?.section || ''}`.trim(),
      percentage: Math.round(pct),
      grade: calculateGrade(pct)
    }
  })

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6 pt-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-7xl mx-auto"
      >
        <div className="flex justify-between items-center mb-8">
          <div>
            <div className="flex items-center gap-3">
              <Award size={36} className="text-green-600 dark:text-green-400" />
              <h1 className="text-4xl font-bold bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent">
                Grades
              </h1>
            </div>
            <p className="text-gray-600 dark:text-gray-300 mt-2">
              Add quiz, assignment, and classwork grades — midterm and final exams are entered by the admin
            </p>
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition font-semibold"
          >
            <Plus size={20} />
            Add Grade
          </button>
        </div>

        {loading ? (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-12 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
            <p className="mt-4 text-gray-600 dark:text-gray-300">Loading grades...</p>
          </div>
        ) : displayGrades.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-12 text-center">
            <Award size={48} className="mx-auto text-gray-300 dark:text-gray-400 mb-4" />
            <p className="text-gray-600 dark:text-gray-300">No grades found. Add grades to get started.</p>
          </div>
        ) : (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-200">Student</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-200">Roll No</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-200">Class</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-200">Subject</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-200">Type</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-200">Score</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-200">%</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-200">Grade</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-200">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {displayGrades.map((student) => (
                    <tr key={student._id} className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800 transition">
                      <td className="px-6 py-4 font-medium text-gray-800 dark:text-gray-100">{student.studentName}</td>
                      <td className="px-6 py-4 text-gray-600 dark:text-gray-300 font-mono">{student.enrollmentNumber}</td>
                      <td className="px-6 py-4 text-gray-600 dark:text-gray-300">{student.className}</td>
                      <td className="px-6 py-4 text-gray-700 dark:text-gray-200">{student.subject}</td>
                      <td className="px-6 py-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${typeColor(student.gradeType)}`}>
                          {student.gradeType ? student.gradeType.charAt(0).toUpperCase() + student.gradeType.slice(1) : 'Quiz'}
                        </span>
                      </td>
                      {editingId === student._id ? (
                        <>
                          <td className="px-6 py-4">
                            <input
                              type="number"
                              min="0"
                              value={editForm.score}
                              onChange={(e) => setEditForm({...editForm, score: e.target.value})}
                              className="w-20 px-2 py-1 border rounded focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-100"
                            />
                            <span className="text-gray-500 dark:text-gray-400"> / </span>
                            <input
                              type="number"
                              min="1"
                              value={editForm.maxScore}
                              onChange={(e) => setEditForm({...editForm, maxScore: e.target.value})}
                              className="w-16 px-2 py-1 border rounded focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-100"
                            />
                          </td>
                          <td className="px-6 py-4 text-gray-600 dark:text-gray-300">
                            {editForm.maxScore ? Math.round((parseFloat(editForm.score) / parseFloat(editForm.maxScore)) * 100) : 0}%
                          </td>
                          <td className="px-6 py-4">
                            <span className="px-3 py-1 rounded-full text-xs font-semibold bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-200">
                              {calculateGrade(editForm.maxScore ? (parseFloat(editForm.score) / parseFloat(editForm.maxScore)) * 100 : 0)}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex gap-2">
                              <button
                                onClick={() => handleSaveEdit(student._id)}
                                className="p-2 hover:bg-green-100 text-green-600 dark:text-green-400 rounded-lg transition"
                                title="Save"
                              >
                                <Save size={16} />
                              </button>
                              <button
                                onClick={handleCancelEdit}
                                className="p-2 hover:bg-red-100 text-red-600 dark:text-red-400 rounded-lg transition"
                                title="Cancel"
                              >
                                <X size={16} />
                              </button>
                            </div>
                          </td>
                        </>
                      ) : (
                        <>
                          <td className="px-6 py-4 font-semibold text-gray-800 dark:text-gray-100">
                            {student.score}/{student.maxScore || 100}
                          </td>
                          <td className="px-6 py-4 text-indigo-600 dark:text-indigo-400 font-semibold">{student.percentage}%</td>
                          <td className="px-6 py-4">
                            <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                              student.grade === 'A+' || student.grade === 'A' ? 'bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300' :
                              student.grade === 'B+' || student.grade === 'B' ? 'bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300' :
                              'bg-yellow-100 dark:bg-yellow-900/40 text-yellow-700 dark:text-yellow-300'
                            }`}>
                              {student.grade}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <button
                              onClick={() => handleEdit(student)}
                              className="p-2 hover:bg-blue-100 text-blue-600 dark:text-blue-400 rounded-lg transition"
                              title="Edit"
                            >
                              <Edit size={16} />
                            </button>
                          </td>
                        </>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Add Grade Modal */}
        {showAddModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full"
            >
              <h3 className="text-xl font-bold text-gray-800 dark:text-gray-100 mb-1">Add New Grade</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                Quiz, assignment, and classwork only — midterm and final exams are entered by the admin.
              </p>
              <form onSubmit={handleAddGrade} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">Student</label>
                  <select
                    value={newGrade.studentId}
                    onChange={(e) => setNewGrade({...newGrade, studentId: e.target.value})}
                    required
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-100"
                  >
                    <option value="">Select Student</option>
                    {students.map(s => (
                      <option key={s._id} value={s._id}>{s.name} - {s.rollNumber}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">Subject</label>
                  <input
                    type="text"
                    value={newGrade.subject}
                    onChange={(e) => setNewGrade({...newGrade, subject: e.target.value})}
                    required
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-100"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">Grade Type</label>
                  <select
                    value={newGrade.gradeType}
                    onChange={(e) => handleTypeChange(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-100"
                  >
                    {TEACHER_GRADE_TYPES.map(t => (
                      <option key={t.value} value={t.value}>{t.label}</option>
                    ))}
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">Score</label>
                    <input
                      type="number"
                      min="0"
                      required
                      value={newGrade.score}
                      onChange={(e) => setNewGrade({...newGrade, score: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-100"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">Max Score</label>
                    <input
                      type="number"
                      min="1"
                      required
                      value={newGrade.maxScore}
                      onChange={(e) => setNewGrade({...newGrade, maxScore: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-100"
                    />
                  </div>
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-300">
                  Total: {newGrade.score || 0}/{newGrade.maxScore || 0} —{' '}
                  {calculateGrade(newGrade.maxScore ? (parseFloat(newGrade.score || '0') / parseFloat(newGrade.maxScore)) * 100 : 0)}
                </div>
                <div className="flex gap-3 justify-end">
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="px-4 py-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
                  >
                    Add Grade
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </motion.div>
    </div>
  )
}
