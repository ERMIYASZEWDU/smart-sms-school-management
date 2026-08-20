import React, { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { motion } from 'framer-motion'
import { 
  Plus, 
  Search, 
  Filter,
  Megaphone,
  Calendar,
  Users,
  AlertCircle,
  Edit,
  Trash2,
  X,
  Eye
} from 'lucide-react'
import { useAuthStore } from '../store/authStore'
import { 
  getAnnouncements, 
  createAnnouncement, 
  updateAnnouncement, 
  deleteAnnouncement,
  getAllAnnouncements 
} from '../services/notificationApi'

export const Announcements = () => {
  const { t } = useTranslation()
  const { user } = useAuthStore()
  const isAdmin = user?.role === 'admin'

  const [announcements, setAnnouncements] = useState(/** @type {Array<Record<string, any>>} */ ([]))
  const [loading, setLoading] = useState(true)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [editingAnnouncement, setEditingAnnouncement] = useState(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterPriority, setFilterPriority] = useState('all')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)

  // Form state
  const [formData, setFormData] = useState({
    title: '',
    message: '',
    content: '',
    targetRole: ['all'],
    targetGrade: '',
    targetSection: '',
    targetStream: '',
    priority: 'medium',
    expiryDate: ''
  })
  const [formErrors, setFormErrors] = useState(/** @type {Record<string, string>} */ ({}))

  useEffect(() => {
    fetchAnnouncements()
  }, [page, isAdmin])

  const fetchAnnouncements = async () => {
    setLoading(true)
    try {
      const data = isAdmin 
        ? await getAllAnnouncements(page, 20)
        : await getAnnouncements(page, 20)
      
      setAnnouncements(data.announcements || [])
      setTotalPages(data.pagination?.pages || 1)
    } catch (error) {
      console.error('Error fetching announcements:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCreateOrUpdate = async (e) => {
    e.preventDefault()
    setFormErrors({})

    // Validation
    const errors = {}
    if (!formData.title.trim()) errors.title = t('announcements.titleRequired', 'Title is required')
    if (!formData.message.trim()) errors.message = t('announcements.messageRequired', 'Message is required')
    if (!formData.content.trim()) errors.content = t('announcements.contentRequired', 'Content is required')

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors)
      return
    }

    try {
      const announcementData = {
        ...formData,
        targetRole: formData.targetRole.length > 0 ? formData.targetRole : ['all'],
        targetGrade: formData.targetGrade || null,
        targetSection: formData.targetSection || null,
        targetStream: formData.targetStream || null,
        expiryDate: formData.expiryDate || null
      }

      if (editingAnnouncement) {
        await updateAnnouncement(editingAnnouncement._id, announcementData)
      } else {
        await createAnnouncement(announcementData)
      }

      setShowCreateModal(false)
      setEditingAnnouncement(null)
      resetForm()
      fetchAnnouncements()
    } catch (error) {
      console.error('Error creating/updating announcement:', error)
      setFormErrors({ submit: error.response?.data?.error || 'Failed to save announcement' })
    }
  }

  const handleEdit = (announcement) => {
    setEditingAnnouncement(announcement)
    setFormData({
      title: announcement.title,
      message: announcement.message,
      content: announcement.content,
      targetRole: announcement.targetRole || ['all'],
      targetGrade: announcement.targetGrade || '',
      targetSection: announcement.targetSection || '',
      targetStream: announcement.targetStream || '',
      priority: announcement.priority || 'medium',
      expiryDate: announcement.expiryDate ? new Date(announcement.expiryDate).toISOString().split('T')[0] : ''
    })
    setShowCreateModal(true)
  }

  const handleDelete = async (announcementId) => {
    if (!window.confirm(t('announcements.deleteConfirm', 'Are you sure you want to delete this announcement?'))) {
      return
    }

    try {
      await deleteAnnouncement(announcementId)
      fetchAnnouncements()
    } catch (error) {
      console.error('Error deleting announcement:', error)
    }
  }

  const resetForm = () => {
    setFormData({
      title: '',
      message: '',
      content: '',
      targetRole: ['all'],
      targetGrade: '',
      targetSection: '',
      targetStream: '',
      priority: 'medium',
      expiryDate: ''
    })
    setFormErrors({})
  }

  const handleRoleChange = (role) => {
    if (role === 'all') {
      setFormData(prev => ({ ...prev, targetRole: ['all'] }))
    } else {
      const currentRoles = formData.targetRole.filter(r => r !== 'all')
      if (currentRoles.includes(role)) {
        const newRoles = currentRoles.filter(r => r !== role)
        setFormData(prev => ({ 
          ...prev, 
          targetRole: newRoles.length > 0 ? newRoles : ['all']
        }))
      } else {
        setFormData(prev => ({ ...prev, targetRole: [...currentRoles, role] }))
      }
    }
  }

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'urgent': return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
      case 'high': return 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400'
      case 'medium': return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
      case 'low': return 'bg-gray-100 text-gray-700 dark:bg-gray-700/30 dark:text-gray-400'
      default: return 'bg-gray-100 text-gray-700 dark:bg-gray-700/30 dark:text-gray-400'
    }
  }

  const filteredAnnouncements = announcements.filter(announcement => {
    const matchesSearch = announcement.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         announcement.message.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesPriority = filterPriority === 'all' || announcement.priority === filterPriority
    return matchesSearch && matchesPriority
  })

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Megaphone size={28} />
            {t('announcements.title', 'Announcements')}
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            {isAdmin 
              ? t('announcements.adminSubtitle', 'Create and manage school announcements')
              : t('announcements.subtitle', 'View important announcements and updates')
            }
          </p>
        </div>

        {isAdmin && (
          <button
            onClick={() => {
              setEditingAnnouncement(null)
              resetForm()
              setShowCreateModal(true)
            }}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus size={20} />
            {t('announcements.createAnnouncement', 'Create Announcement')}
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        {/* Search */}
        <div className="relative flex-1">
          <Search size={20} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder={t('announcements.searchPlaceholder', 'Search announcements...')}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        {/* Priority Filter */}
        <div className="flex items-center gap-2">
          <Filter size={20} className="text-gray-400" />
          <select
            value={filterPriority}
            onChange={(e) => setFilterPriority(e.target.value)}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">{t('announcements.allPriorities', 'All Priorities')}</option>
            <option value="urgent">{t('announcements.urgent', 'Urgent')}</option>
            <option value="high">{t('announcements.high', 'High')}</option>
            <option value="medium">{t('announcements.medium', 'Medium')}</option>
            <option value="low">{t('announcements.low', 'Low')}</option>
          </select>
        </div>
      </div>

      {/* Announcements List */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      ) : filteredAnnouncements.length === 0 ? (
        <div className="text-center py-12">
          <Megaphone size={64} className="mx-auto text-gray-300 dark:text-gray-600 mb-4" />
          <p className="text-gray-500 dark:text-gray-400">
            {t('announcements.noAnnouncements', 'No announcements found')}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredAnnouncements.map((announcement) => (
            <motion.div
              key={announcement._id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 hover:shadow-md transition-shadow"
            >
              <div className="flex justify-between items-start gap-4">
                <div className="flex-1 min-w-0">
                  {/* Title and Priority */}
                  <div className="flex items-start gap-3 mb-2">
                    <h3 className="text-xl font-semibold text-gray-900 dark:text-white flex-1">
                      {announcement.title}
                    </h3>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap ${getPriorityColor(announcement.priority)}`}>
                      {t(`announcements.${announcement.priority}`, String(announcement.priority))}
                    </span>
                  </div>

                  {/* Message */}
                  <p className="text-gray-700 dark:text-gray-300 mb-3">
                    {announcement.message}
                  </p>

                  {/* Metadata */}
                  <div className="flex flex-wrap gap-4 text-sm text-gray-600 dark:text-gray-400">
                    <div className="flex items-center gap-1">
                      <Calendar size={16} />
                      {new Date(announcement.publishDate).toLocaleDateString()}
                    </div>
                    <div className="flex items-center gap-1">
                      <Users size={16} />
                      {announcement.targetRole?.includes('all') 
                        ? t('announcements.everyone', 'Everyone')
                        : announcement.targetRole?.map(r => t(`announcements.${r}`, r)).join(', ')
                      }
                    </div>
                    {announcement.targetGrade && (
                      <span className="px-2 py-0.5 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 rounded">
                        {announcement.targetGrade}
                      </span>
                    )}
                    {announcement.targetSection && (
                      <span className="px-2 py-0.5 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded">
                        {t('announcements.section', 'Section')} {announcement.targetSection}
                      </span>
                    )}
                    {announcement.targetStream && (
                      <span className="px-2 py-0.5 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400 rounded">
                        {announcement.targetStream}
                      </span>
                    )}
                  </div>

                  {isAdmin && announcement.recipientCount > 0 && (
                    <div className="mt-2 text-sm text-gray-500">
                      {t('announcements.recipients', 'Recipients')}: {announcement.recipientCount}
                    </div>
                  )}
                </div>

                {/* Actions */}
                {isAdmin && (
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleEdit(announcement)}
                      className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition-colors"
                      title={t('common.edit', 'Edit')}
                    >
                      <Edit size={18} />
                    </button>
                    <button
                      onClick={() => handleDelete(announcement._id)}
                      className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors"
                      title={t('common.delete', 'Delete')}
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center gap-2 mt-6">
          <button
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            {t('common.previous', 'Previous')}
          </button>
          <span className="px-4 py-2 text-gray-700 dark:text-gray-300">
            {page} / {totalPages}
          </span>
          <button
            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            {t('common.next', 'Next')}
          </button>
        </div>
      )}

      {/* Create/Edit Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
          >
            <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-6 flex justify-between items-center">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                {editingAnnouncement 
                  ? t('announcements.editAnnouncement', 'Edit Announcement')
                  : t('announcements.createAnnouncement', 'Create Announcement')
                }
              </h2>
              <button
                onClick={() => {
                  setShowCreateModal(false)
                  setEditingAnnouncement(null)
                  resetForm()
                }}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
              >
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleCreateOrUpdate} className="p-6 space-y-4">
              {/* Title */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {t('announcements.title', 'Title')} *
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  className={`w-full px-4 py-2 border ${formErrors.title ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'} rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                  placeholder={t('announcements.titlePlaceholder', 'Enter announcement title')}
                />
                {formErrors.title && <p className="text-red-500 text-sm mt-1">{formErrors.title}</p>}
              </div>

              {/* Message (Short) */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {t('announcements.message', 'Short Message')} *
                </label>
                <input
                  type="text"
                  value={formData.message}
                  onChange={(e) => setFormData(prev => ({ ...prev, message: e.target.value }))}
                  className={`w-full px-4 py-2 border ${formErrors.message ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'} rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                  placeholder={t('announcements.messagePlaceholder', 'Brief summary for notifications')}
                />
                {formErrors.message && <p className="text-red-500 text-sm mt-1">{formErrors.message}</p>}
              </div>

              {/* Content (Full) */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {t('announcements.content', 'Full Content')} *
                </label>
                <textarea
                  value={formData.content}
                  onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
                  rows={5}
                  className={`w-full px-4 py-2 border ${formErrors.content ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'} rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                  placeholder={t('announcements.contentPlaceholder', 'Detailed announcement content')}
                />
                {formErrors.content && <p className="text-red-500 text-sm mt-1">{formErrors.content}</p>}
              </div>

              {/* Target Roles */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {t('announcements.targetAudience', 'Target Audience')}
                </label>
                <div className="flex flex-wrap gap-2">
                  {['all', 'student', 'teacher', 'parent', 'admin'].map(role => (
                    <button
                      key={role}
                      type="button"
                      onClick={() => handleRoleChange(role)}
                      className={`px-4 py-2 rounded-lg border transition-colors ${
                        formData.targetRole.includes(role)
                          ? 'bg-blue-600 text-white border-blue-600'
                          : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600 hover:border-blue-500'
                      }`}
                    >
                      {t(`announcements.${role}`, role)}
                    </button>
                  ))}
                </div>
              </div>

              {/* Targeting Options */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Grade */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    {t('announcements.targetGrade', 'Target Grade')}
                  </label>
                  <select
                    value={formData.targetGrade}
                    onChange={(e) => setFormData(prev => ({ ...prev, targetGrade: e.target.value }))}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">{t('announcements.allGrades', 'All Grades')}</option>
                    {Array.from({ length: 12 }, (_, i) => (
                      <option key={i + 1} value={`Grade ${i + 1}`}>Grade {i + 1}</option>
                    ))}
                  </select>
                </div>

                {/* Section */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    {t('announcements.targetSection', 'Target Section')}
                  </label>
                  <select
                    value={formData.targetSection}
                    onChange={(e) => setFormData(prev => ({ ...prev, targetSection: e.target.value }))}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">{t('announcements.allSections', 'All Sections')}</option>
                    {['A', 'B', 'C', 'D', 'E'].map(section => (
                      <option key={section} value={section}>Section {section}</option>
                    ))}
                  </select>
                </div>

                {/* Stream (for Grade 11-12) */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    {t('announcements.targetStream', 'Target Stream')}
                  </label>
                  <select
                    value={formData.targetStream}
                    onChange={(e) => setFormData(prev => ({ ...prev, targetStream: e.target.value }))}
                    disabled={!['Grade 11', 'Grade 12'].includes(formData.targetGrade)}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <option value="">{t('announcements.allStreams', 'All Streams')}</option>
                    <option value="Natural Science">{t('announcements.naturalScience', 'Natural Science')}</option>
                    <option value="Social Science">{t('announcements.socialScience', 'Social Science')}</option>
                  </select>
                </div>
              </div>

              {/* Priority */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {t('announcements.priority', 'Priority')}
                </label>
                <select
                  value={formData.priority}
                  onChange={(e) => setFormData(prev => ({ ...prev, priority: e.target.value }))}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="low">{t('announcements.low', 'Low')}</option>
                  <option value="medium">{t('announcements.medium', 'Medium')}</option>
                  <option value="high">{t('announcements.high', 'High')}</option>
                  <option value="urgent">{t('announcements.urgent', 'Urgent')}</option>
                </select>
              </div>

              {/* Expiry Date */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {t('announcements.expiryDate', 'Expiry Date')} ({t('announcements.optional', 'Optional')})
                </label>
                <input
                  type="date"
                  value={formData.expiryDate}
                  onChange={(e) => setFormData(prev => ({ ...prev, expiryDate: e.target.value }))}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {formErrors.submit && (
                <div className="p-3 bg-red-100 dark:bg-red-900/30 border border-red-300 dark:border-red-700 rounded-lg flex items-start gap-2">
                  <AlertCircle size={20} className="text-red-600 dark:text-red-400 shrink-0 mt-0.5" />
                  <p className="text-red-700 dark:text-red-400 text-sm">{formErrors.submit}</p>
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateModal(false)
                    setEditingAnnouncement(null)
                    resetForm()
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  {t('common.cancel', 'Cancel')}
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  {editingAnnouncement 
                    ? t('common.update', 'Update')
                    : t('common.create', 'Create')
                  }
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  )
}

export default Announcements
