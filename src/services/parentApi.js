import apiClient, { buildQuery } from '../utils/api'

// Dashboard
export const getParentDashboard = async () => {
  const response = await apiClient.get('/api/parent/dashboard')
  return response.data
}

// Children
export const getParentChildren = async () => {
  const response = await apiClient.get('/api/parent/children')
  return response.data
}

// Child Details
export const getChildDetails = async (studentId) => {
  const response = await apiClient.get(`/api/parent/child/${studentId}`)
  return response.data
}

// Child Grades
export const getChildGrades = async (studentId) => {
  const response = await apiClient.get(`/api/parent/child/${studentId}/grades`)
  return response.data
}

// Child Attendance
export const getChildAttendance = async (studentId, params = {}) => {
  const query = buildQuery(params)
  const response = await apiClient.get(`/api/parent/child/${studentId}/attendance${query ? `?${query}` : ''}`)
  return response.data
}

// Child Assignments
export const getChildAssignments = async (studentId) => {
  const response = await apiClient.get(`/api/parent/child/${studentId}/assignments`)
  return response.data
}

// Announcements
export const getParentAnnouncements = async () => {
  const response = await apiClient.get('/api/parent/announcements')
  return response.data
}
