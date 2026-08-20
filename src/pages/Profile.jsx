import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { User, Camera, Lock, Save, X, Upload, Trash2 } from 'lucide-react'
import { getProfile, updateProfile, uploadProfilePhoto, deleteProfilePhoto, changePassword } from '../services/profileApi'
import { resolvePhotoUrl } from '../utils/api'
import { useAuthStore } from '../store/authStore'
import { processPhoto } from '../utils/image'

export const Profile = () => {
  const { user, setUser } = useAuthStore()
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  
  // Profile form
  const [formData, setFormData] = useState({
    name: '',
    phone: ''
  })
  
  // Photo upload
  const [photoFile, setPhotoFile] = useState(null)
  const [photoPreview, setPhotoPreview] = useState(null)
  const [uploadingPhoto, setUploadingPhoto] = useState(false)
  
  // Password change
  const [showPasswordModal, setShowPasswordModal] = useState(false)
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  })
  const [passwordError, setPasswordError] = useState('')

  useEffect(() => {
    fetchProfile()
  }, [])

  const fetchProfile = async () => {
    try {
      setLoading(true)
      const data = await getProfile()
      setProfile(data)
      setFormData({
        name: data.name || '',
        phone: data.phone || ''
      })
      setError('')
    } catch (err) {
      setError('Failed to load profile')
      console.error('Error fetching profile:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess('')
    
    try {
      setSaving(true)
      const updated = await updateProfile(formData)
      setProfile({ ...profile, ...updated })
      
      // Update auth store with new name
      if (user) {
        setUser({ ...user, name: updated.name })
      }
      
      setSuccess('Profile updated successfully!')
      setTimeout(() => setSuccess(''), 3000)
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update profile')
    } finally {
      setSaving(false)
    }
  }

  const handlePhotoSelect = async (e) => {
    const file = e.target.files[0]
    if (!file) return

    // Clear any previously staged photo so a rejected file can't be uploaded later
    setPhotoFile(null)
    setPhotoPreview(null)

    try {
      // Validate type and downscale large photos in the browser before upload
      const resized = await processPhoto(file)
      setPhotoFile(resized)
      setPhotoPreview(URL.createObjectURL(resized))
      setError('')
    } catch (err) {
      setError(err.message || 'Could not read this image. Please choose another photo (JPG, PNG, or WEBP).')
    }
  }

  const handlePhotoUpload = async () => {
    if (!photoFile) return

    try {
      setUploadingPhoto(true)
      setError('')
      const result = await uploadProfilePhoto(photoFile)
      
      // Update profile with new photo
      setProfile({ ...profile, profilePhoto: result.profilePhoto })
      
      // Update auth store
      if (user) {
        setUser({ ...user, profilePhoto: result.profilePhoto })
      }
      
      setSuccess('Profile photo updated!')
      setPhotoFile(null)
      setPhotoPreview(null)
      setTimeout(() => setSuccess(''), 3000)
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to upload photo')
    } finally {
      setUploadingPhoto(false)
    }
  }

  const handlePhotoDelete = async () => {
    if (!confirm('Are you sure you want to remove your profile photo?')) return

    try {
      setUploadingPhoto(true)
      await deleteProfilePhoto()
      
      setProfile({ ...profile, profilePhoto: null })
      
      // Update auth store
      if (user) {
        setUser({ ...user, profilePhoto: null })
      }
      
      setSuccess('Profile photo removed')
      setTimeout(() => setSuccess(''), 3000)
    } catch (err) {
      setError('Failed to remove photo')
    } finally {
      setUploadingPhoto(false)
    }
  }

  const handlePasswordChange = async (e) => {
    e.preventDefault()
    setPasswordError('')

    // Validate
    if (passwordData.newPassword.length < 6) {
      setPasswordError('New password must be at least 6 characters')
      return
    }

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setPasswordError('New passwords do not match')
      return
    }

    try {
      setSaving(true)
      await changePassword({
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword
      })
      
      setSuccess('Password changed successfully!')
      setShowPasswordModal(false)
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' })
      setTimeout(() => setSuccess(''), 3000)
    } catch (err) {
      setPasswordError(err.response?.data?.message || 'Failed to change password')
    } finally {
      setSaving(false)
    }
  }

  const getInitials = (name) => {
    if (!name) return '?'
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  const getRoleBadgeColor = (role) => {
    const colors = {
      admin: 'bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300',
      teacher: 'bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300',
      student: 'bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300',
      parent: 'bg-orange-100 dark:bg-orange-900/40 text-orange-700 dark:text-orange-300'
    }
    return colors[role] || 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-200'
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6 pt-8 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-300">Loading profile...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6 pt-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-4xl mx-auto"
      >
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3">
            <User size={36} className="text-blue-600 dark:text-blue-400" />
            <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100">My Profile</h1>
          </div>
          <p className="text-gray-600 dark:text-gray-300 mt-1">Manage your personal information and settings</p>
        </div>

        {/* Error/Success Messages */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-900/50 rounded-lg">
            <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
          </div>
        )}

        {success && (
          <div className="mb-6 p-4 bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-900/50 rounded-lg">
            <p className="text-sm text-green-700 dark:text-green-300">{success}</p>
          </div>
        )}

        <div className="grid md:grid-cols-3 gap-6">
          {/* Left Column - Photo & Role */}
          <div className="space-y-6">
            {/* Profile Photo Card */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-4">Profile Photo</h3>
              
              <div className="flex flex-col items-center">
                {/* Avatar */}
                <div className="relative mb-4">
                  {photoPreview || profile?.profilePhoto ? (
                    <img
                      src={photoPreview || resolvePhotoUrl(profile.profilePhoto)}
                      alt="Profile"
                      className="w-32 h-32 rounded-full object-cover border-4 border-gray-200 dark:border-gray-700"
                    />
                  ) : (
                    <div className="w-32 h-32 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center border-4 border-gray-200 dark:border-gray-700">
                      <span className="text-white text-3xl font-bold">
                        {getInitials(profile?.name)}
                      </span>
                    </div>
                  )}
                  
                  <label
                    htmlFor="photo-upload"
                    className="absolute bottom-0 right-0 bg-blue-600 text-white p-2 rounded-full cursor-pointer hover:bg-blue-700 transition shadow-lg"
                  >
                    <Camera size={20} />
                  </label>
                  <input
                    id="photo-upload"
                    type="file"
                    accept="image/jpeg,image/jpg,image/png,image/webp"
                    onChange={handlePhotoSelect}
                    className="hidden dark:bg-gray-800"
                  />
                </div>

                {/* Photo Actions */}
                {photoPreview && (
                  <div className="flex gap-2 mb-4">
                    <button
                      onClick={handlePhotoUpload}
                      disabled={uploadingPhoto}
                      className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition text-sm font-medium disabled:opacity-50"
                    >
                      <Upload size={16} />
                      {uploadingPhoto ? 'Uploading...' : 'Upload'}
                    </button>
                    <button
                      onClick={() => {
                        setPhotoFile(null)
                        setPhotoPreview(null)
                      }}
                      className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition text-sm font-medium"
                    >
                      Cancel
                    </button>
                  </div>
                )}

                {profile?.profilePhoto && !photoPreview && (
                  <button
                    onClick={handlePhotoDelete}
                    disabled={uploadingPhoto}
                    className="flex items-center gap-2 px-4 py-2 border border-red-300 text-red-700 dark:text-red-300 rounded-lg hover:bg-red-50 transition text-sm font-medium disabled:opacity-50"
                  >
                    <Trash2 size={16} />
                    Remove Photo
                  </button>
                )}

                <p className="text-xs text-gray-500 dark:text-gray-400 mt-4 text-center">
                  JPG, PNG or WEBP. Max 5MB.
                </p>
              </div>
            </div>

            {/* Role Card */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-3">Account Type</h3>
              <div className="flex items-center justify-center">
                <span className={`inline-flex px-4 py-2 rounded-full text-sm font-semibold ${getRoleBadgeColor(profile?.role)}`}>
                  {profile?.role?.toUpperCase()}
                </span>
              </div>
            </div>
          </div>

          {/* Right Column - Profile Info */}
          <div className="md:col-span-2 space-y-6">
            {/* Personal Information */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-4">Personal Information</h3>
              
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
                    Email
                  </label>
                  <input
                    type="email"
                    value={profile?.email || ''}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-900 text-gray-600 dark:text-gray-300"
                    disabled
                  />
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Email cannot be changed</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="+251-91-234-5678"
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                {/* Role-specific read-only info */}
                {profile?.roleProfile && (
                  <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                    <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-200 mb-3">Additional Information</h4>
                    
                    {profile.role === 'student' && profile.roleProfile && (
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600 dark:text-gray-300">Enrollment Number:</span>
                          <span className="font-medium">{profile.roleProfile.enrollmentNumber}</span>
                        </div>
                        {profile.roleProfile.classId && (
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-600 dark:text-gray-300">Class:</span>
                            <span className="font-medium">{profile.roleProfile.classId.name}</span>
                          </div>
                        )}
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600 dark:text-gray-300">Grade:</span>
                          <span className="font-medium">{profile.roleProfile.grade}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600 dark:text-gray-300">Section:</span>
                          <span className="font-medium">{profile.roleProfile.section}</span>
                        </div>
                        {profile.roleProfile.stream && (
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-600 dark:text-gray-300">Stream:</span>
                            <span className="font-medium capitalize">{profile.roleProfile.stream}</span>
                          </div>
                        )}
                        <p className="text-xs text-gray-500 dark:text-gray-400 italic mt-2">
                          Academic information is managed by the school administration
                        </p>
                      </div>
                    )}

                    {profile.role === 'teacher' && profile.roleProfile && (
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600 dark:text-gray-300">Employee ID:</span>
                          <span className="font-medium">{profile.roleProfile.employeeId}</span>
                        </div>
                        {profile.roleProfile.assignedClassIds?.length > 0 && (
                          <div className="text-sm">
                            <span className="text-gray-600 dark:text-gray-300">Assigned Classes:</span>
                            <div className="mt-1 flex flex-wrap gap-1">
                              {profile.roleProfile.assignedClassIds.map(cls => (
                                <span key={cls._id} className="inline-flex px-2 py-1 bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 rounded text-xs">
                                  {cls.name}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {profile.role === 'parent' && profile.roleProfile?.studentIds?.length > 0 && (
                      <div className="text-sm">
                        <span className="text-gray-600 dark:text-gray-300">Children:</span>
                        <div className="mt-1 space-y-1">
                          {profile.roleProfile.studentIds.map(student => (
                            <div key={student._id} className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-900 rounded">
                              <span className="font-medium">{student.name}</span>
                              <span className="text-xs text-gray-600 dark:text-gray-300">{student.grade} - {student.section}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={saving}
                  className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-semibold disabled:opacity-50"
                >
                  <Save size={20} />
                  {saving ? 'Saving...' : 'Save Changes'}
                </button>
              </form>
            </div>

            {/* Security Section */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-4">Security</h3>
              
              <button
                onClick={() => setShowPasswordModal(true)}
                className="flex items-center gap-2 px-6 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition font-semibold"
              >
                <Lock size={20} />
                Change Password
              </button>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Password Change Modal */}
      {showPasswordModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-md w-full p-6"
          >
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-gray-800 dark:text-gray-100">Change Password</h3>
              <button
                onClick={() => {
                  setShowPasswordModal(false)
                  setPasswordError('')
                  setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' })
                }}
                className="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <X size={24} />
              </button>
            </div>

            {passwordError && (
              <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-900/50 rounded-lg">
                <p className="text-sm text-red-700 dark:text-red-300">{passwordError}</p>
              </div>
            )}

            <form onSubmit={handlePasswordChange} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
                  Current Password *
                </label>
                <input
                  type="password"
                  value={passwordData.currentPassword}
                  onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
                  New Password *
                </label>
                <input
                  type="password"
                  value={passwordData.newPassword}
                  onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500"
                  required
                  minLength={6}
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">At least 6 characters</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
                  Confirm New Password *
                </label>
                <input
                  type="password"
                  value={passwordData.confirmPassword}
                  onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-semibold disabled:opacity-50"
                >
                  {saving ? 'Changing...' : 'Change Password'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowPasswordModal(false)
                    setPasswordError('')
                    setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' })
                  }}
                  className="px-6 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition font-semibold"
                >
                  Cancel
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  )
}
