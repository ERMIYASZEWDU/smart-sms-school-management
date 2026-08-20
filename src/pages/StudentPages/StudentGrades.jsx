import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Award, TrendingUp, BookOpen, Filter, BarChart3 } from 'lucide-react'
import { getStudentGrades } from '../../services/studentApi'

export const StudentGrades = () => {
  const [grades, setGrades] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [filterSubject, setFilterSubject] = useState('all')
  const [filterType, setFilterType] = useState('all')

  useEffect(() => {
    fetchGrades()
  }, [filterSubject, filterType])

  const fetchGrades = async () => {
    try {
      setLoading(true)
      const params = {}
      if (filterSubject !== 'all') params.subject = filterSubject
      if (filterType !== 'all') params.gradeType = filterType

      const data = await getStudentGrades(params)
      setGrades(data)
      setError('')
    } catch (err) {
      console.error('Error fetching grades:', err)
      setError('Failed to load grades')
    } finally {
      setLoading(false)
    }
  }

  // Grade model uses score/maxScore
  const getScore = (g) => g.score ?? g.marksObtained ?? 0
  const getMax   = (g) => g.maxScore ?? g.totalMarks ?? 100

  const calculateGPA = () => {
    if (grades.length === 0) return 0
    const total = grades.reduce((sum, g) => sum + getScore(g), 0)
    const max   = grades.reduce((sum, g) => sum + getMax(g), 0)
    return max > 0 ? ((total / max) * 4).toFixed(2) : 0
  }

  const calculateAverage = () => {
    if (grades.length === 0) return 0
    const total = grades.reduce((sum, g) => sum + (getScore(g) / getMax(g)) * 100, 0)
    return (total / grades.length).toFixed(1)
  }

  const getGradeColor = (percentage) => {
    if (percentage >= 90) return 'bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300 border-green-300'
    if (percentage >= 80) return 'bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 border-blue-300'
    if (percentage >= 70) return 'bg-yellow-100 dark:bg-yellow-900/40 text-yellow-700 dark:text-yellow-300 border-yellow-300'
    if (percentage >= 60) return 'bg-orange-100 dark:bg-orange-900/40 text-orange-700 dark:text-orange-300 border-orange-300'
    return 'bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300 border-red-300'
  }

  const getGradeLetter = (percentage) => {
    if (percentage >= 90) return 'A+'
    if (percentage >= 85) return 'A'
    if (percentage >= 80) return 'A-'
    if (percentage >= 75) return 'B+'
    if (percentage >= 70) return 'B'
    if (percentage >= 65) return 'B-'
    if (percentage >= 60) return 'C+'
    if (percentage >= 55) return 'C'
    if (percentage >= 50) return 'D'
    return 'F'
  }

  const subjects = [...new Set(grades.map(g => g.subject))]
  const gradeTypes = [...new Set(grades.map(g => g.gradeType))]

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6 pt-8 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-300">Loading grades...</p>
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
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <Award size={36} className="text-blue-600 dark:text-blue-400" />
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              My Grades
            </h1>
          </div>
          <p className="text-gray-600 dark:text-gray-300">Track your academic performance</p>
        </div>

        {error && (
          <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-900/50 text-red-700 dark:text-red-300 px-4 py-3 rounded-lg mb-6">
            {error}
          </div>
        )}

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg border border-gray-100 dark:border-gray-800"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 dark:text-gray-300 text-sm font-medium mb-1">GPA</p>
                <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">{calculateGPA()}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Out of 4.0</p>
              </div>
              <div className="p-4 bg-blue-50 dark:bg-blue-900/30 rounded-xl">
                <TrendingUp size={28} className="text-blue-600 dark:text-blue-400" />
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
                <p className="text-gray-600 dark:text-gray-300 text-sm font-medium mb-1">Average</p>
                <p className="text-3xl font-bold text-green-600 dark:text-green-400">{calculateAverage()}%</p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Overall performance</p>
              </div>
              <div className="p-4 bg-green-50 dark:bg-green-900/30 rounded-xl">
                <BarChart3 size={28} className="text-green-600 dark:text-green-400" />
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
                <p className="text-gray-600 dark:text-gray-300 text-sm font-medium mb-1">Total Grades</p>
                <p className="text-3xl font-bold text-purple-600 dark:text-purple-400">{grades.length}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">All assessments</p>
              </div>
              <div className="p-4 bg-purple-50 dark:bg-purple-900/30 rounded-xl">
                <BookOpen size={28} className="text-purple-600 dark:text-purple-400" />
              </div>
            </div>
          </motion.div>
        </div>

        {/* Filters */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700 mb-6"
        >
          <div className="flex flex-col md:flex-row gap-4 items-center">
            <Filter size={20} className="text-gray-600 dark:text-gray-300" />
            <select
              value={filterSubject}
              onChange={(e) => setFilterSubject(e.target.value)}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-800"
            >
              <option value="all">All Subjects</option>
              {subjects.map(subject => (
                <option key={subject} value={subject}>{subject}</option>
              ))}
            </select>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-800"
            >
              <option value="all">All Types</option>
              {gradeTypes.map(type => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
          </div>
        </motion.div>

        {/* Grades Table */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-800 overflow-hidden"
        >
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gradient-to-r from-blue-50 dark:from-blue-900/40 to-purple-50 dark:to-purple-900/40">
                <tr>
                  <th className="text-left p-4 font-bold text-gray-700 dark:text-gray-200">Subject</th>
                  <th className="text-left p-4 font-bold text-gray-700 dark:text-gray-200">Type</th>
                  <th className="text-left p-4 font-bold text-gray-700 dark:text-gray-200">Marks</th>
                  <th className="text-left p-4 font-bold text-gray-700 dark:text-gray-200">Percentage</th>
                  <th className="text-left p-4 font-bold text-gray-700 dark:text-gray-200">Grade</th>
                  <th className="text-left p-4 font-bold text-gray-700 dark:text-gray-200">Teacher</th>
                  <th className="text-left p-4 font-bold text-gray-700 dark:text-gray-200">Date</th>
                </tr>
              </thead>
              <tbody>
                {grades.length > 0 ? (
                  grades.map((grade, index) => {
                    const score = grade.score ?? grade.marksObtained ?? 0
                    const max   = grade.maxScore ?? grade.totalMarks ?? 100
                    const percentage = ((score / max) * 100).toFixed(1)
                    return (
                      <motion.tr
                        key={grade._id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.6 + index * 0.05 }}
                        className="border-b border-gray-100 dark:border-gray-800 hover:bg-blue-50 dark:hover:bg-blue-900/40 transition-colors"
                      >
                        <td className="p-4 font-semibold text-gray-800 dark:text-gray-100">{grade.subject}</td>
                        <td className="p-4 text-gray-600 dark:text-gray-300">
                          <span className="px-3 py-1 bg-gray-100 dark:bg-gray-800 rounded-full text-xs font-medium">
                            {grade.gradeType}
                          </span>
                        </td>
                        <td className="p-4 text-gray-700 dark:text-gray-200 font-medium">
                          {score} / {max}
                        </td>
                        <td className="p-4 text-gray-700 dark:text-gray-200 font-bold">{percentage}%</td>
                        <td className="p-4">
                          <span className={`px-3 py-1 rounded-full text-sm font-bold border-2 ${getGradeColor(percentage)}`}>
                            {getGradeLetter(percentage)}
                          </span>
                        </td>
                        <td className="p-4 text-blue-600 dark:text-blue-400 text-sm">
                          {grade.teacherId?.name || 'N/A'}
                        </td>
                        <td className="p-4 text-gray-600 dark:text-gray-300 text-sm">
                          {new Date(grade.createdAt).toLocaleDateString()}
                        </td>
                      </motion.tr>
                    )
                  })
                ) : (
                  <tr>
                    <td colSpan={7} className="p-12 text-center">
                      <Award size={48} className="text-gray-300 dark:text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-500 dark:text-gray-400 text-lg">No grades available yet</p>
                      <p className="text-gray-400 dark:text-gray-500 text-sm mt-1">Your grades will appear here once teachers add them</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </motion.div>
      </motion.div>
    </div>
  )
}
