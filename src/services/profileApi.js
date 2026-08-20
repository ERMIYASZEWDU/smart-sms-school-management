import apiClient from '../utils/api'

// Get current user's profile
export const getProfile = async () => {
  const response = await apiClient.get('/api/profile')
  return response.data
}

// Update profile (name, phone)
export const updateProfile = async (data) => {
  const response = await apiClient.put('/api/profile', data)
  return response.data
}

// Upload profile photo
export const uploadProfilePhoto = async (file) => {
  const formData = new FormData()
  formData.append('photo', file)
  
  const response = await apiClient.post('/api/profile/photo', formData, {
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  })
  return response.data
}

// Delete profile photo
export const deleteProfilePhoto = async () => {
  const response = await apiClient.delete('/api/profile/photo')
  return response.data
}

// Change password
export const changePassword = async (data) => {
  const response = await apiClient.put('/api/profile/password', data)
  return response.data
}
