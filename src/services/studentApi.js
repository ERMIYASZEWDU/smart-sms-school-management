import apiClient, { buildQuery } from '../utils/api'

// Dashboard
export const getStudentDashboard = async () => {
  const response = await apiClient.get('/api/student/dashboard')
  return response.data
}

// Profile
export const getStudentProfile = async () => {
  const response = await apiClient.get('/api/student/profile')
  return response.data
}

// Grades
export const getStudentGrades = async (params = {}) => {
  const query = buildQuery(params)
  const response = await apiClient.get(`/api/student/grades${query ? `?${query}` : ''}`)
  return response.data
}

// Attendance
export const getStudentAttendance = async (params = {}) => {
  const query = buildQuery(params)
  const response = await apiClient.get(`/api/student/attendance${query ? `?${query}` : ''}`)
  return response.data
}

// Assignments
export const getStudentAssignments = async (params = {}) => {
  const query = buildQuery(params)
  const response = await apiClient.get(`/api/student/assignments${query ? `?${query}` : ''}`)
  return response.data
}

export const submitAssignment = async (assignmentId, data) => {
  const response = await apiClient.post(`/api/student/assignment/${assignmentId}/submit`, data)
  return response.data
}

// Announcements
export const getStudentAnnouncements = async () => {
  const response = await apiClient.get('/api/student/announcements')
  return response.data
}

// Timetable
export const getStudentTimetable = async () => {
  const response = await apiClient.get('/api/student/timetable')
  return response.data
}
