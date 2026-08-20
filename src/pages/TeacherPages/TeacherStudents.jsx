import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Users, Search, Filter, Eye } from 'lucide-react'
import { getMyStudents } from '../../services/teacherApi'

export const TeacherStudents = () => {
  const [searchTerm, setSearchTerm] = useState('')
  const [filterClass, setFilterClass] = useState('all')
  const [students, setStudents] = useState([])
  const [loading, setLoading] = useState(true)
  const [classes, setClasses] = useState([])

  useEffect(() => {
    fetchStudents()
  }, [filterClass])

  const fetchStudents = async () => {
    try {
      setLoading(true)
      const data = await getMyStudents({ 
        search: searchTerm,
        classId: filterClass !== 'all' ? filterClass : undefined
      })
      setStudents(data)
      
      // Extract unique classes from classId object or grade-section
      const uniqueClassMap = new Map()
      data.forEach(s => {
        const classKey = s.classId?._id || `${s.grade}-${s.section}`
        const className = s.classId?.name || `${s.grade}-${s.section}`
        uniqueClassMap.set(classKey, className)
      })
      setClasses(Array.from(uniqueClassMap.entries()).map(([id, name]) => ({ id, name })))
    } catch (error) {
      console.error('Error fetching students:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = (e) => {
    e.preventDefault()
    fetchStudents()
  }

  const filteredStudents = students.filter(student => {
    const searchLower = searchTerm.toLowerCase()
    const matchesSearch = student.name?.toLowerCase().includes(searchLower) ||
                         student.enrollmentNumber?.toLowerCase().includes(searchLower) ||
                         student.rollNumber?.toString().includes(searchTerm) ||
                         student.grade?.toLowerCase().includes(searchLower) ||
                         student.section?.toLowerCase().includes(searchLower)
    return matchesSearch
  })

  const getPerformanceLabel = (student) => {
    if (student.performance) return student.performance
    // Calculate from attendance if available
    const attendance = parseFloat(student.attendance) || 0
    if (attendance >= 95) return 'Excellent'
    if (attendance >= 85) return 'Good'
    return 'Average'
  }

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
              <Users size={36} className="text-blue-600 dark:text-blue-400" />
              <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                My Students
              </h1>
            </div>
            <p className="text-gray-600 dark:text-gray-300 mt-2">View and manage your students</p>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700 mb-6">
          <form onSubmit={handleSearch} className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-3 text-gray-400 dark:text-gray-500" size={18} />
              <input
                type="text"
                placeholder="Search by name, enrollment number, or class..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="flex items-center gap-2">
              <Filter size={18} className="text-gray-600 dark:text-gray-300" />
              <select
                value={filterClass}
                onChange={(e) => setFilterClass(e.target.value)}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-800"
              >
                <option value="all">All Classes</option>
                {classes.map(cls => (
                  <option key={cls.id} value={cls.id}>{cls.name}</option>
                ))}
              </select>
            </div>
            <button
              type="submit"
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-semibold"
            >
              Search
            </button>
          </form>
        </div>

        {/* Loading State */}
        {loading ? (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-12 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600 dark:text-gray-300">Loading students...</p>
          </div>
        ) : filteredStudents.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-12 text-center">
            <Users size={48} className="mx-auto text-gray-300 dark:text-gray-400 mb-4" />
            <p className="text-gray-600 dark:text-gray-300">No students found</p>
          </div>
        ) : (
          /* Students Table */
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-200">Name</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-200">Enrollment No</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-200">Class</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-200">Attendance</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-200">Performance</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-200">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredStudents.map((student) => {
                    const performance = getPerformanceLabel(student)
                    return (
                      <tr key={student._id || student.id} className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800 transition">
                        <td className="px-6 py-4 font-medium text-gray-800 dark:text-gray-100">{student.name}</td>
                        <td className="px-6 py-4 text-gray-600 dark:text-gray-300 font-mono">{student.enrollmentNumber}</td>
                        <td className="px-6 py-4 text-gray-600 dark:text-gray-300">{student.classId?.name || `${student.grade} ${student.section}`}</td>
                        <td className="px-6 py-4 text-gray-600 dark:text-gray-300">{student.attendance || 'N/A'}</td>
                        <td className="px-6 py-4">
                          <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                            performance === 'Excellent' ? 'bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300' :
                            performance === 'Good' ? 'bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300' :
                            'bg-yellow-100 dark:bg-yellow-900/40 text-yellow-700 dark:text-yellow-300'
                          }`}>
                            {performance}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <button 
                            className="p-2 hover:bg-blue-100 text-blue-600 dark:text-blue-400 rounded-lg transition"
                            title="View Details"
                          >
                            <Eye size={16} />
                          </button>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  )
}
