import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Users, Award, Calendar, FileText, TrendingUp, User } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { getParentChildren } from '../../services/parentApi'
import { resolvePhotoUrl } from '../../utils/api'

export const ParentChildren = () => {
  const [children, setChildren] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const navigate = useNavigate()

  useEffect(() => {
    fetchChildren()
  }, [])

  const fetchChildren = async () => {
    try {
      setLoading(true)
      const data = await getParentChildren()
      setChildren(data)
      setError('')
    } catch (err) {
      console.error('Error fetching children:', err)
      setError('Failed to load children')
    } finally {
      setLoading(false)
    }
  }

  const viewGrades = (childId) => {
    navigate(`/parent/child/${childId}/grades`)
  }

  const viewAttendance = (childId) => {
    navigate(`/parent/child/${childId}/attendance`)
  }

  const viewAssignments = (childId) => {
    navigate(`/parent/child/${childId}/assignments`)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6 pt-8 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-300">Loading children...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 dark:from-gray-900 via-green-50 dark:via-green-900/40 to-blue-50 dark:to-blue-900/40 p-6 pt-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-7xl mx-auto"
      >
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <Users size={36} className="text-green-600 dark:text-green-400" />
            <h1 className="text-4xl font-bold bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent">
              My Children
            </h1>
          </div>
          <p className="text-gray-600 dark:text-gray-300">Monitor your children's academic progress</p>
        </div>

        {error && (
          <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-900/50 text-red-700 dark:text-red-300 px-4 py-3 rounded-lg mb-6">
            {error}
          </div>
        )}

        {/* Children Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {children.length > 0 ? (
            children.map((child, index) => (
              <motion.div
                key={child._id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.1 }}
                className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg border border-gray-100 dark:border-gray-800 hover:shadow-xl transition-all"
              >
                {/* Child Header */}
                <div className="flex items-center gap-4 mb-6 pb-4 border-b border-gray-200 dark:border-gray-700">
                  {child.photo ? (
                    <img
                      src={resolvePhotoUrl(child.photo)}
                      alt={child.name || 'Child'}
                      className="w-16 h-16 rounded-full object-cover border border-gray-200 dark:border-gray-700"
                    />
                  ) : (
                    <div className="w-16 h-16 bg-gradient-to-br from-green-400 to-blue-500 rounded-full flex items-center justify-center text-white text-2xl font-bold">
                      {child.name?.charAt(0).toUpperCase() || '?'}
                    </div>
                  )}
                  <div>
                    <h3 className="text-xl font-bold text-gray-800 dark:text-gray-100">{child.name}</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-300">{child.enrollmentNumber}</p>
                    <span className={`inline-block px-2 py-1 rounded-full text-xs font-semibold mt-1 ${
                      child.status === 'active' 
                        ? 'bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300' 
                        : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-200'
                    }`}>
                      {child.status || 'Active'}
                    </span>
                  </div>
                </div>

                {/* Child Info */}
                <div className="space-y-3 mb-6">
                  <div className="flex items-center gap-2 text-sm">
                    <User size={16} className="text-blue-500" />
                    <span className="text-gray-600 dark:text-gray-300">Grade:</span>
                    <span className="font-semibold text-gray-800 dark:text-gray-100">{child.grade} {child.section}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <TrendingUp size={16} className="text-purple-500" />
                    <span className="text-gray-600 dark:text-gray-300">Score:</span>
                    <span className="font-semibold text-gray-800 dark:text-gray-100">{child.gpa ? `${Math.round(child.gpa * 25)}%` : 'N/A'}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Calendar size={16} className="text-green-500" />
                    <span className="text-gray-600 dark:text-gray-300">Attendance:</span>
                    <span className="font-semibold text-gray-800 dark:text-gray-100">
                      {child.attendance ? `${child.attendance}%` : 'N/A'}
                    </span>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="space-y-2">
                  <button
                    onClick={() => viewGrades(child._id)}
                    className="w-full py-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg font-medium hover:shadow-lg transition flex items-center justify-center gap-2"
                  >
                    <Award size={18} />
                    View Grades
                  </button>
                  <button
                    onClick={() => viewAttendance(child._id)}
                    className="w-full py-2 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg font-medium hover:shadow-lg transition flex items-center justify-center gap-2"
                  >
                    <Calendar size={18} />
                    View Attendance
                  </button>
                  <button
                    onClick={() => viewAssignments(child._id)}
                    className="w-full py-2 bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-lg font-medium hover:shadow-lg transition flex items-center justify-center gap-2"
                  >
                    <FileText size={18} />
                    View Assignments
                  </button>
                </div>
              </motion.div>
            ))
          ) : (
            <div className="col-span-full text-center py-12">
              <Users size={48} className="text-gray-300 dark:text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500 dark:text-gray-400 text-lg">No children found</p>
              <p className="text-gray-400 dark:text-gray-500 text-sm mt-1">Please contact the admin to link your children</p>
            </div>
          )}
        </div>

        {/* Quick Stats */}
        {children.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6"
          >
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg border border-gray-100 dark:border-gray-800">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 dark:text-gray-300 text-sm font-medium mb-1">Total Children</p>
                  <p className="text-3xl font-bold text-green-600 dark:text-green-400">{children.length}</p>
                </div>
                <Users size={28} className="text-green-600 dark:text-green-400" />
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg border border-gray-100 dark:border-gray-800">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 dark:text-gray-300 text-sm font-medium mb-1">Active Students</p>
                  <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                    {children.filter(c => c.status === 'active').length}
                  </p>
                </div>
                <User size={28} className="text-blue-600 dark:text-blue-400" />
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg border border-gray-100 dark:border-gray-800">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 dark:text-gray-300 text-sm font-medium mb-1">Average Score</p>
                  <p className="text-3xl font-bold text-purple-600 dark:text-purple-400">
                    {children.length > 0 && children.some(c => c.gpa)
                      ? `${(children.reduce((sum, c) => sum + (c.gpa || 0), 0) / children.filter(c => c.gpa).length * 25).toFixed(1)}%`
                      : 'N/A'}
                  </p>
                </div>
                <TrendingUp size={28} className="text-purple-600 dark:text-purple-400" />
              </div>
            </div>
          </motion.div>
        )}
      </motion.div>
    </div>
  )
}
