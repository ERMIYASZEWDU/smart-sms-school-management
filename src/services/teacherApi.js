import apiClient, { buildQuery } from '../utils/api'

// Dashboard
export const getTeacherDashboard = async () => {
  const response = await apiClient.get('/api/teacher/dashboard')
  return response.data
}

// Assignments
export const getAssignments = async () => {
  const response = await apiClient.get('/api/teacher/assignments')
  return response.data
}

export const createAssignment = async (assignmentData) => {
  const response = await apiClient.post('/api/teacher/assignment', assignmentData)
  return response.data
}

export const updateAssignment = async (id, assignmentData) => {
  const response = await apiClient.put(`/api/teacher/assignment/${id}`, assignmentData)
  return response.data
}

export const deleteAssignment = async (id) => {
  const response = await apiClient.delete(`/api/teacher/assignment/${id}`)
  return response.data
}

// Grades
export const getGrades = async (params = {}) => {
  const query = buildQuery(params)
  const response = await apiClient.get(`/api/teacher/grades${query ? `?${query}` : ''}`)
  return response.data
}

export const createGrade = async (gradeData) => {
  const response = await apiClient.post('/api/teacher/grade', gradeData)
  return response.data
}

export const updateGrade = async (id, gradeData) => {
  const response = await apiClient.put(`/api/teacher/grade/${id}`, gradeData)
  return response.data
}

// Students
export const getMyStudents = async (params = {}) => {
  // Filter out undefined/null values so URLSearchParams doesn't serialize them as the string 'undefined'
  const query = buildQuery(params)
  const response = await apiClient.get(`/api/teacher/students${query ? `?${query}` : ''}`)
  return response.data
}

export const getStudentDetails = async (studentId) => {
  const response = await apiClient.get(`/api/teacher/student/${studentId}`)
  return response.data
}

// Attendance
export const markAttendance = async (attendanceData) => {
  const response = await apiClient.post('/api/teacher/attendance', attendanceData)
  return response.data
}

export const getAttendance = async (params = {}) => {
  const query = buildQuery(params)
  const response = await apiClient.get(`/api/teacher/attendance${query ? `?${query}` : ''}`)
  return response.data
}

// Timetable
export const getTimetable = async () => {
  const response = await apiClient.get('/api/teacher/timetable')
  return response.data
}

// Classes assigned to this teacher
export const getTeacherClasses = async () => {
  const response = await apiClient.get('/api/teacher/classes')
  return response.data
}
