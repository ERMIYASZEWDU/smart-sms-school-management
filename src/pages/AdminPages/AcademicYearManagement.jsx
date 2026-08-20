import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Calendar, 
  Plus, 
  Edit2, 
  Trash2, 
  CheckCircle,
  XCircle,
  Archive,
  AlertCircle,
  Power
} from 'lucide-react'
import { useTranslation } from 'react-i18next'
import api from '../../utils/api'

export const AcademicYearManagement = () => {
  const { t } = useTranslation()
  const [academicYears, setAcademicYears] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(null)
  const [showModal, setShowModal] = useState(false)
  const [editingYear, setEditingYear] = useState(null)
  const [formData, setFormData] = useState({
    name: '',
    startDate: '',
    endDate: '',
    isActive: false
  })

  useEffect(() => {
    fetchAcademicYears()
  }, [])

  const fetchAcademicYears = async () => {
    try {
      setLoading(true)
      const response = await api.get('/api/admin/academic-years')
      setAcademicYears(response.data)
      setError(null)
    } catch (err) {
      console.error('Error fetching academic years:', err)
      setError('Failed to load academic years')
    } finally {
      setLoading(false)
    }
  }

  const handleOpenModal = (year = null) => {
    if (year) {
      setEditingYear(year)
      setFormData({
        name: year.name,
        startDate: new Date(year.startDate).toISOString().split('T')[0],
        endDate: new Date(year.endDate).toISOString().split('T')[0],
        isActive: year.isActive
      })
    } else {
      setEditingYear(null)
      setFormData({
        name: '',
        startDate: '',
        endDate: '',
        isActive: false
      })
    }
    setShowModal(true)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(null)
    setSuccess(null)

    try {
      if (editingYear) {
        // Update existing academic year
        await api.put(`/api/academic-years/${editingYear._id}`, formData)
        setSuccess('Academic year updated successfully!')
      } else {
        // Create new academic year
        await api.post('/api/academic-years', formData)
        setSuccess('Academic year created successfully!')
      }
      
      setShowModal(false)
      setEditingYear(null)
      setFormData({
        name: '',
        startDate: '',
        endDate: '',
        isActive: false
      })
      
      await fetchAcademicYears()
    } catch (err) {
      console.error('Error saving academic year:', err)
      setError(err.response?.data?.message || 'Failed to save academic year')
    }
  }

  const handleSetActive = async (yearId) => {
    if (!confirm('Are you sure you want to set this as the active academic year? This will deactivate all other academic years.')) {
      return
    }

    try {
      setError(null)
      setSuccess(null)
      await api.patch(`/api/academic-years/${yearId}/toggle-active`)
      setSuccess('Active academic year updated successfully!')
      await fetchAcademicYears()
    } catch (err) {
      console.error('Error setting active year:', err)
      setError(err.response?.data?.message || 'Failed to set active year')
    }
  }

  const handleArchive = async (yearId) => {
    if (!confirm('Are you sure you want to archive this academic year? Archived years cannot be set as active.')) {
      return
    }

    try {
      setError(null)
      setSuccess(null)
      await api.patch(`/api/academic-years/${yearId}/archive`)
      setSuccess('Academic year archived successfully!')
      await fetchAcademicYears()
    } catch (err) {
      console.error('Error archiving year:', err)
      setError(err.response?.data?.message || 'Failed to archive year')
    }
  }

  const handleUnarchive = async (yearId) => {
    try {
      setError(null)
      setSuccess(null)
      await api.patch(`/api/academic-years/${yearId}/unarchive`)
      setSuccess('Academic year unarchived successfully!')
      await fetchAcademicYears()
    } catch (err) {
      console.error('Error unarchiving year:', err)
      setError(err.response?.data?.message || 'Failed to unarchive year')
    }
  }

  const handleDelete = async (yearId) => {
    if (!confirm('Are you sure you want to delete this academic year? This action cannot be undone. All associated enrollments will be affected.')) {
      return
    }

    try {
      setError(null)
      setSuccess(null)
      await api.delete(`/api/academic-years/${yearId}`)
      setSuccess('Academic year deleted successfully!')
      await fetchAcademicYears()
    } catch (err) {
      console.error('Error deleting year:', err)
      setError(err.response?.data?.message || 'Failed to delete year')
    }
  }

  const activeYears = academicYears.filter(y => !y.isArchived)
  const archivedYears = academicYears.filter(y => y.isArchived)

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">{t('common.loading') || 'Loading...'}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2 flex items-center gap-3">
              <Calendar className="w-8 h-8" />
              {t('academicYears.academicYearManagement') || 'Academic Year Management'}
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              {t('academicYears.academicYearManagementDesc') || 'Manage academic years, set active year, and archive past years'}
            </p>
          </div>
          <button
            onClick={() => handleOpenModal()}
            className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-semibold"
          >
            <Plus className="w-5 h-5" />
            {t('academicYears.addAcademicYear') || 'Add Academic Year'}
          </button>
        </div>
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

      {/* Statistics */}
      <div className="grid md:grid-cols-4 gap-4 mb-8">
        <div className="bg-white dark:bg-gray-800 rounded-lg p-5 shadow-sm border border-gray-200 dark:border-gray-700">
          <p className="text-sm text-gray-600 dark:text-gray-400 font-medium">{t('academicYears.totalYears') || 'Total Years'}</p>
          <p className="text-3xl font-bold text-blue-600 dark:text-blue-400 mt-1">{academicYears.length}</p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg p-5 shadow-sm border border-gray-200 dark:border-gray-700">
          <p className="text-sm text-gray-600 dark:text-gray-400 font-medium">{t('academicYears.activeYear') || 'Active Year'}</p>
          <p className="text-3xl font-bold text-green-600 dark:text-green-400 mt-1">
            {academicYears.filter(y => y.isActive).length}
          </p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg p-5 shadow-sm border border-gray-200 dark:border-gray-700">
          <p className="text-sm text-gray-600 dark:text-gray-400 font-medium">{t('academicYears.activeYears') || 'Active Years'}</p>
          <p className="text-3xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">{activeYears.length}</p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg p-5 shadow-sm border border-gray-200 dark:border-gray-700">
          <p className="text-sm text-gray-600 dark:text-gray-400 font-medium">{t('academicYears.archivedYears') || 'Archived Years'}</p>
          <p className="text-3xl font-bold text-gray-600 dark:text-gray-400 mt-1">{archivedYears.length}</p>
        </div>
      </div>

      {/* Active Academic Years */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white flex items-center gap-2">
          <Calendar className="w-6 h-6" />
          {t('academicYears.activeAcademicYears') || 'Active Academic Years'}
        </h2>
        
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
          {activeYears.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-gray-900">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      {t('table.name') || 'Name'}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      {t('academicYears.startDate') || 'Start Date'}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      {t('academicYears.endDate') || 'End Date'}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      {t('common.status') || 'Status'}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      {t('common.actions') || 'Actions'}
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {activeYears.map((year, idx) => (
                    <motion.tr
                      key={year._id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.05 }}
                      className="hover:bg-gray-50 dark:hover:bg-gray-700"
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-gray-900 dark:text-white">{year.name}</span>
                          {year.isActive && (
                            <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 rounded-full">
                              {t('common.active') || 'Active'}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400">
                        {new Date(year.startDate).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400">
                        {new Date(year.endDate).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          year.isActive 
                            ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' 
                            : 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400'
                        }`}>
                          {year.isActive ? (t('academicYears.current') || 'Current') : (t('common.inactive') || 'Inactive')}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex items-center gap-2">
                          {!year.isActive && (
                            <button
                              onClick={() => handleSetActive(year._id)}
                              className="text-green-600 hover:text-green-900 dark:text-green-400 dark:hover:text-green-300"
                              title={t('academicYears.setActive') || 'Set Active'}
                            >
                              <Power className="w-5 h-5" />
                            </button>
                          )}
                          <button
                            onClick={() => handleOpenModal(year)}
                            className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300"
                            title={t('common.edit') || 'Edit'}
                          >
                            <Edit2 className="w-5 h-5" />
                          </button>
                          <button
                            onClick={() => handleArchive(year._id)}
                            className="text-orange-600 hover:text-orange-900 dark:text-orange-400 dark:hover:text-orange-300"
                            title={t('academicYears.archive') || 'Archive'}
                          >
                            <Archive className="w-5 h-5" />
                          </button>
                          {!year.isActive && (
                            <button
                              onClick={() => handleDelete(year._id)}
                              className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                              title={t('common.delete') || 'Delete'}
                            >
                              <Trash2 className="w-5 h-5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-12 text-center text-gray-500 dark:text-gray-400">
              <AlertCircle className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p className="text-lg">{t('academicYears.noActiveYears') || 'No active academic years'}</p>
              <p className="text-sm mt-1">{t('academicYears.addFirstYear') || 'Add your first academic year to get started'}</p>
            </div>
          )}
        </div>
      </motion.div>

      {/* Archived Academic Years */}
      {archivedYears.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white flex items-center gap-2">
            <Archive className="w-6 h-6" />
            {t('academicYears.archivedAcademicYears') || 'Archived Academic Years'}
          </h2>
          
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-gray-900">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      {t('table.name') || 'Name'}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      {t('academicYears.startDate') || 'Start Date'}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      {t('academicYears.endDate') || 'End Date'}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      {t('common.actions') || 'Actions'}
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {archivedYears.map((year, idx) => (
                    <motion.tr
                      key={year._id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.05 }}
                      className="hover:bg-gray-50 dark:hover:bg-gray-700 opacity-75"
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm font-medium text-gray-900 dark:text-white">{year.name}</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400">
                        {new Date(year.startDate).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400">
                        {new Date(year.endDate).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleUnarchive(year._id)}
                            className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300"
                            title={t('academicYears.unarchive') || 'Unarchive'}
                          >
                            <Archive className="w-5 h-5" />
                          </button>
                          <button
                            onClick={() => handleDelete(year._id)}
                            className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                            title={t('common.delete') || 'Delete'}
                          >
                            <Trash2 className="w-5 h-5" />
                          </button>
                        </div>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </motion.div>
      )}

      {/* Create/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ scale: 0.95, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-md w-full p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
              {editingYear ? (t('academicYears.editAcademicYear') || 'Edit Academic Year') : (t('academicYears.addAcademicYear') || 'Add Academic Year')}
            </h2>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {t('academicYears.yearName') || 'Year Name'} *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., 2026/2027"
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {t('academicYears.startDate') || 'Start Date'} *
                </label>
                <input
                  type="date"
                  value={formData.startDate}
                  onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {t('academicYears.endDate') || 'End Date'} *
                </label>
                <input
                  type="date"
                  value={formData.endDate}
                  onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="isActive"
                  checked={formData.isActive}
                  onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <label htmlFor="isActive" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  {t('academicYears.setAsActive') || 'Set as active academic year'}
                </label>
              </div>

              {formData.isActive && (
                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
                  <p className="text-xs text-blue-700 dark:text-blue-300">
                    {t('academicYears.activeYearWarning') || 'Setting this as active will deactivate all other academic years.'}
                  </p>
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-semibold"
                >
                  {editingYear ? (t('common.update') || 'Update') : (t('common.create') || 'Create')}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false)
                    setEditingYear(null)
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition font-semibold"
                >
                  {t('common.cancel') || 'Cancel'}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  )
}

export default AcademicYearManagement
