import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { FileText, Clock, CheckCircle, AlertTriangle, Calendar, User } from 'lucide-react'
import { getStudentAssignments, submitAssignment } from '../../services/studentApi'
import { Modal } from '../../components/Modal'
import { Button } from '../../components/Button'

export const StudentAssignments = () => {
  const [assignments, setAssignments] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')
  const [showSubmitModal, setShowSubmitModal] = useState(false)
  const [selectedAssignment, setSelectedAssignment] = useState(null)
  const [submissionContent, setSubmissionContent] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    fetchAssignments()
  }, [filterStatus])

  const fetchAssignments = async () => {
    try {
      setLoading(true)
      const params = {}
      if (filterStatus !== 'all') params.status = filterStatus

      const data = await getStudentAssignments(params)
      setAssignments(data)
      setError('')
    } catch (err) {
      console.error('Error fetching assignments:', err)
      setError('Failed to load assignments')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async () => {
    if (!submissionContent.trim()) {
      alert('Please enter your submission content')
      return
    }

    try {
      setSubmitting(true)
      await submitAssignment(selectedAssignment._id, {
        content: submissionContent,
        attachments: []
      })
      alert('✅ Assignment submitted successfully!')
      setShowSubmitModal(false)
      setSubmissionContent('')
      await fetchAssignments()
    } catch (err) {
      console.error('Error submitting assignment:', err)
      alert('Failed to submit assignment')
    } finally {
      setSubmitting(false)
    }
  }

  const openSubmitModal = (assignment) => {
    setSelectedAssignment(assignment)
    setSubmissionContent(assignment.submission?.content || '')
    setShowSubmitModal(true)
  }

  const getStatusBadge = (assignment) => {
    if (assignment.isSubmitted) {
      if (assignment.submission?.grade) {
        return (
          <span className="px-3 py-1 bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300 rounded-full text-xs font-semibold border-2 border-green-300 flex items-center gap-1">
            <CheckCircle size={14} />
            Graded: {assignment.submission.grade}
          </span>
        )
      }
      return (
        <span className="px-3 py-1 bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 rounded-full text-xs font-semibold border-2 border-blue-300 flex items-center gap-1">
          <CheckCircle size={14} />
          Submitted
        </span>
      )
    }
    if (assignment.isOverdue) {
      return (
        <span className="px-3 py-1 bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300 rounded-full text-xs font-semibold border-2 border-red-300 flex items-center gap-1">
          <AlertTriangle size={14} />
          Overdue
        </span>
      )
    }
    return (
      <span className="px-3 py-1 bg-yellow-100 dark:bg-yellow-900/40 text-yellow-700 dark:text-yellow-300 rounded-full text-xs font-semibold border-2 border-yellow-300 flex items-center gap-1">
        <Clock size={14} />
        Pending
      </span>
    )
  }

  const getDaysRemaining = (dueDate) => {
    const now = new Date()
    const due = new Date(dueDate)
    const diffTime = due.getTime() - now.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    
    if (diffDays < 0) return `${Math.abs(diffDays)} days overdue`
    if (diffDays === 0) return 'Due today'
    if (diffDays === 1) return 'Due tomorrow'
    return `${diffDays} days remaining`
  }

  const pendingCount = assignments.filter(a => !a.isSubmitted && !a.isOverdue).length
  const submittedCount = assignments.filter(a => a.isSubmitted).length
  const overdueCount = assignments.filter(a => a.isOverdue).length

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6 pt-8 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-300">Loading assignments...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 dark:from-gray-900 via-purple-50 dark:via-purple-900/40 to-blue-50 dark:to-blue-900/40 p-6 pt-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-7xl mx-auto"
      >
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <FileText size={36} className="text-purple-600 dark:text-purple-400" />
            <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
              My Assignments
            </h1>
          </div>
          <p className="text-gray-600 dark:text-gray-300">View and submit your assignments</p>
        </div>

        {error && (
          <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-900/50 text-red-700 dark:text-red-300 px-4 py-3 rounded-lg mb-6">
            {error}
          </div>
        )}

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg border border-gray-100 dark:border-gray-800">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 dark:text-gray-300 text-sm font-medium mb-1">Total</p>
                <p className="text-3xl font-bold text-purple-600 dark:text-purple-400">{assignments.length}</p>
              </div>
              <FileText size={28} className="text-purple-600 dark:text-purple-400" />
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg border border-gray-100 dark:border-gray-800">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 dark:text-gray-300 text-sm font-medium mb-1">Pending</p>
                <p className="text-3xl font-bold text-yellow-600 dark:text-yellow-400">{pendingCount}</p>
              </div>
              <Clock size={28} className="text-yellow-600 dark:text-yellow-400" />
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg border border-gray-100 dark:border-gray-800">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 dark:text-gray-300 text-sm font-medium mb-1">Submitted</p>
                <p className="text-3xl font-bold text-green-600 dark:text-green-400">{submittedCount}</p>
              </div>
              <CheckCircle size={28} className="text-green-600 dark:text-green-400" />
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg border border-gray-100 dark:border-gray-800">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 dark:text-gray-300 text-sm font-medium mb-1">Overdue</p>
                <p className="text-3xl font-bold text-red-600 dark:text-red-400">{overdueCount}</p>
              </div>
              <AlertTriangle size={28} className="text-red-600 dark:text-red-400" />
            </div>
          </div>
        </div>

        {/* Filter */}
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700 mb-6">
          <div className="flex items-center gap-4">
            <FileText size={20} className="text-gray-600 dark:text-gray-300" />
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 bg-white dark:bg-gray-800"
            >
              <option value="all">All Assignments</option>
              <option value="pending">Pending Only</option>
              <option value="overdue">Overdue Only</option>
            </select>
          </div>
        </div>

        {/* Assignments Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {assignments.length > 0 ? (
            assignments.map((assignment, index) => (
              <motion.div
                key={assignment._id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.05 }}
                className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg border border-gray-100 dark:border-gray-800 hover:shadow-xl transition-all"
              >
                <div className="flex justify-between items-start mb-4">
                  <div className="p-3 bg-purple-50 dark:bg-purple-900/30 rounded-xl">
                    <FileText size={24} className="text-purple-600 dark:text-purple-400" />
                  </div>
                  {getStatusBadge(assignment)}
                </div>

                <h3 className="text-xl font-bold text-gray-800 dark:text-gray-100 mb-2 line-clamp-2">
                  {assignment.title}
                </h3>
                <p className="text-gray-600 dark:text-gray-300 text-sm mb-4 line-clamp-3">
                  {assignment.description}
                </p>

                <div className="space-y-2 mb-4">
                  <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
                    <User size={16} className="text-blue-500" />
                    <span>{assignment.teacherId?.name || 'Unknown'}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
                    <Calendar size={16} className="text-purple-500" />
                    <span>{new Date(assignment.dueDate).toLocaleDateString()}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm font-medium">
                    <Clock size={16} className={assignment.isOverdue ? 'text-red-500' : 'text-green-500'} />
                    <span className={assignment.isOverdue ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'}>
                      {getDaysRemaining(assignment.dueDate)}
                    </span>
                  </div>
                </div>

                {assignment.submission ? (
                  <button
                    onClick={() => openSubmitModal(assignment)}
                    className="w-full py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition"
                  >
                    View Submission
                  </button>
                ) : (
                  <button
                    onClick={() => openSubmitModal(assignment)}
                    disabled={assignment.isOverdue}
                    className={`w-full py-2 rounded-lg font-medium transition ${
                      assignment.isOverdue
                        ? 'bg-gray-300 dark:bg-gray-600 text-gray-500 dark:text-gray-400 cursor-not-allowed'
                        : 'bg-gradient-to-r from-purple-500 to-purple-600 text-white hover:shadow-lg'
                    }`}
                  >
                    {assignment.isOverdue ? 'Overdue' : 'Submit Assignment'}
                  </button>
                )}
              </motion.div>
            ))
          ) : (
            <div className="col-span-full text-center py-12">
              <FileText size={48} className="text-gray-300 dark:text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500 dark:text-gray-400 text-lg">No assignments found</p>
            </div>
          )}
        </div>
      </motion.div>

      {/* Submit Modal */}
      {showSubmitModal && selectedAssignment && (
        <Modal
          isOpen={showSubmitModal}
          onClose={() => setShowSubmitModal(false)}
          title={selectedAssignment.isSubmitted ? 'View Submission' : 'Submit Assignment'}
        >
          <div className="space-y-4">
            <div>
              <h3 className="font-bold text-lg text-gray-800 dark:text-gray-100 mb-2">{selectedAssignment.title}</h3>
              <p className="text-gray-600 dark:text-gray-300 text-sm">{selectedAssignment.description}</p>
            </div>

            <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4">
              <p className="text-sm text-gray-600 dark:text-gray-300">
                <strong>Due Date:</strong> {new Date(selectedAssignment.dueDate).toLocaleDateString()}
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                <strong>Status:</strong> {getDaysRemaining(selectedAssignment.dueDate)}
              </p>
            </div>

            {selectedAssignment.submission?.grade && (
              <div className="bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-900/50 rounded-lg p-4">
                <p className="text-green-700 dark:text-green-300 font-semibold">
                  Grade: {selectedAssignment.submission.grade}
                </p>
                {selectedAssignment.submission.feedback && (
                  <p className="text-sm text-gray-600 dark:text-gray-300 mt-2">
                    <strong>Feedback:</strong> {selectedAssignment.submission.feedback}
                  </p>
                )}
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
                {selectedAssignment.isSubmitted ? 'Your Submission' : 'Your Answer'}
              </label>
              <textarea
                value={submissionContent}
                onChange={(e) => setSubmissionContent(e.target.value)}
                disabled={selectedAssignment.isSubmitted}
                placeholder="Enter your submission here..."
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 resize-none disabled:bg-gray-100"
                rows={8}
              />
            </div>

            {!selectedAssignment.isSubmitted && (
              <div className="flex gap-3 pt-4">
                <Button onClick={handleSubmit} disabled={submitting} className="flex-1">
                  {submitting ? 'Submitting...' : 'Submit Assignment'}
                </Button>
                <Button
                  onClick={() => setShowSubmitModal(false)}
                  className="flex-1 bg-gray-500 hover:bg-gray-600"
                >
                  Cancel
                </Button>
              </div>
            )}
          </div>
        </Modal>
      )}
    </div>
  )
}
