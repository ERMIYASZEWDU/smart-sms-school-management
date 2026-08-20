import apiClient, { buildQuery } from '../utils/api'

// Dashboard
export const getAdminDashboard = async () => {
  const response = await apiClient.get('/api/admin/dashboard')
  return response.data
}

// Students
export const getStudents = async (params = {}) => {
  const query = buildQuery(params)
  const response = await apiClient.get(`/api/admin/students${query ? `?${query}` : ''}`)
  return response.data
}

export const createStudent = async (studentData) => {
  console.log('🔍 Creating student with data:', studentData)
  console.log('🌐 API URL:', '/api/admin/student')
  const response = await apiClient.post('/api/admin/student', studentData)
  console.log('✅ Student created:', response.data)
  return response.data
}

export const updateStudent = async (id, studentData) => {
  const response = await apiClient.put(`/api/admin/student/${id}`, studentData)
  return response.data
}

export const deleteStudent = async (id) => {
  const response = await apiClient.delete(`/api/admin/student/${id}`)
  return response.data
}

// Teachers
export const getTeachers = async () => {
  const response = await apiClient.get('/api/admin/teachers')
  return response.data
}

export const createTeacher = async (teacherData) => {
  const response = await apiClient.post('/api/admin/teacher', teacherData)
  return response.data
}

export const updateTeacher = async (id, teacherData) => {
  const response = await apiClient.put(`/api/admin/teacher/${id}`, teacherData)
  return response.data
}

export const deleteTeacher = async (id) => {
  const response = await apiClient.delete(`/api/admin/teacher/${id}`)
  return response.data
}

// Teacher Assignments
export const assignTeacherToClasses = async (teacherId, classIds) => {
  const response = await apiClient.post(`/api/admin/teacher/${teacherId}/assign-classes`, { classIds })
  return response.data
}

export const assignTeacherToSubjects = async (teacherId, subjectIds) => {
  const response = await apiClient.post(`/api/admin/teacher/${teacherId}/assign-subjects`, { subjectIds })
  return response.data
}

// Parents
export const getParents = async () => {
  const response = await apiClient.get('/api/admin/parents')
  return response.data
}

export const createParent = async (parentData) => {
  const response = await apiClient.post('/api/admin/parent', parentData)
  return response.data
}

export const updateParent = async (id, parentData) => {
  const response = await apiClient.put(`/api/admin/parent/${id}`, parentData)
  return response.data
}

export const deleteParent = async (id) => {
  const response = await apiClient.delete(`/api/admin/parent/${id}`)
  return response.data
}

// Classes
export const getClasses = async () => {
  const response = await apiClient.get('/api/admin/classes')
  return response.data
}

export const createClass = async (classData) => {
  console.log('📝 [API] Creating class with data:', classData)
  try {
    const response = await apiClient.post('/api/admin/class', classData)
    console.log('✅ [API] Class created successfully:', response.data)
    return response.data
  } catch (error) {
    console.error('❌ [API] Error creating class:', {
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data,
      message: error.message
    })
    throw error
  }
}

export const getClassesWithTeachers = async () => {
  const response = await apiClient.get('/api/admin/classes-with-teachers')
  return response.data
}

export const assignTeacherToClass = async (classId, teacherId) => {
  const response = await apiClient.put(`/api/admin/class/${classId}/assign-teacher`, { teacherId })
  return response.data
}

export const getTeacherClasses = async (teacherId) => {
  const response = await apiClient.get(`/api/admin/teacher/${teacherId}/classes`)
  return response.data
}

// Attendance
export const getAttendance = async (params = {}) => {
  const query = buildQuery(params)
  const response = await apiClient.get(`/api/admin/attendance${query ? `?${query}` : ''}`)
  return response.data
}

// Grades/Results
export const getGrades = async (params = {}) => {
  const query = buildQuery(params)
  const response = await apiClient.get(`/api/admin/grades${query ? `?${query}` : ''}`)
  return response.data
}

export const createGrade = async (gradeData) => {
  const response = await apiClient.post('/api/admin/grade', gradeData)
  return response.data
}

export const updateGrade = async (id, gradeData) => {
  const response = await apiClient.put(`/api/admin/grade/${id}`, gradeData)
  return response.data
}

// Announcements
export const getAnnouncements = async () => {
  const response = await apiClient.get('/api/admin/announcements')
  return response.data
}

export const createAnnouncement = async (announcementData) => {
  const response = await apiClient.post('/api/admin/announcement', announcementData)
  return response.data
}

// Subjects
export const getSubjects = async (params = {}) => {
  const query = buildQuery(params)
  const response = await apiClient.get(`/api/admin/subjects${query ? `?${query}` : ''}`)
  return response.data
}

export const createSubject = async (subjectData) => {
  const response = await apiClient.post('/api/admin/subject', subjectData)
  return response.data
}

export const updateSubject = async (id, subjectData) => {
  const response = await apiClient.put(`/api/admin/subject/${id}`, subjectData)
  return response.data
}

export const deleteSubject = async (id) => {
  const response = await apiClient.delete(`/api/admin/subject/${id}`)
  return response.data
}

// Users
export const getUsers = async () => {
  const response = await apiClient.get('/api/admin/users')
  return response.data
}

export const createUser = async (userData) => {
  const response = await apiClient.post('/api/admin/user', userData)
  return response.data
}

export const updateUser = async (id, userData) => {
  const response = await apiClient.put(`/api/admin/user/${id}`, userData)
  return response.data
}

export const toggleUserStatus = async (id) => {
  const response = await apiClient.patch(`/api/admin/user/${id}/status`)
  return response.data
}

export const deleteUser = async (id) => {
  const response = await apiClient.delete(`/api/admin/user/${id}`)
  return response.data
}
