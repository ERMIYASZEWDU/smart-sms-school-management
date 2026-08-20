import React, { useState, useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useAuthStore } from './store/authStore'
import { Header } from './components/Layout/Header'
import { Sidebar } from './components/Layout/Sidebar'
import { LoginPageNew } from './pages/LoginPageNew'
import { ForgotPassword } from './pages/ForgotPassword'
import { LandingPage } from './pages/LandingPage'
import { Profile } from './pages/Profile'
import { StudentDashboard } from './pages/dashboards/StudentDashboard'
import { TeacherDashboard } from './pages/dashboards/TeacherDashboard'
import { ParentDashboard } from './pages/dashboards/ParentDashboard'
import { AdminDashboard } from './pages/dashboards/AdminDashboard'
import { SuperAdminDashboard } from './pages/dashboards/SuperAdminDashboard'
import { UserManagement } from './pages/AdminPages/UserManagement'
import { Students } from './pages/AdminPages/Students'
import { Teachers } from './pages/AdminPages/Teachers'
import { Settings } from './pages/AdminPages/Settings'
import { GenericPage } from './pages/AdminPages/GenericPage'
import { Timetable } from './pages/AdminPages/Timetable'
import { Classes } from './pages/AdminPages/Classes'
import { Subjects } from './pages/AdminPages/Subjects'
import { Parents } from './pages/AdminPages/Parents'
import { Attendance } from './pages/AdminPages/Attendance'
import { Examinations } from './pages/AdminPages/Examinations'
import { Assignments } from './pages/AdminPages/Assignments'
import { Results } from './pages/AdminPages/Results'
import { Reports } from './pages/AdminPages/Reports'
import { EnrollmentManagement } from './pages/AdminPages/EnrollmentManagement'
import { AcademicYearManagement } from './pages/AdminPages/AcademicYearManagement'
import { TeacherStudents } from './pages/TeacherPages/TeacherStudents'
import { TeacherGrades } from './pages/TeacherPages/TeacherGrades'
import { TeacherAttendance } from './pages/TeacherPages/TeacherAttendance'
import { TeacherAssignments } from './pages/TeacherPages/TeacherAssignments'
import { TeacherTimetable } from './pages/TeacherPages/TeacherTimetable'
import { StudentGrades } from './pages/StudentPages/StudentGrades'
import { StudentAttendance } from './pages/StudentPages/StudentAttendance'
import { StudentAssignments } from './pages/StudentPages/StudentAssignments'
import { StudentTimetable } from './pages/StudentPages/StudentTimetable'
import { ParentChildren } from './pages/ParentPages/ParentChildren'
import { ParentChildGrades } from './pages/ParentPages/ParentChildGrades'
import { ParentChildAttendance } from './pages/ParentPages/ParentChildAttendance'
import { ParentChildAssignments } from './pages/ParentPages/ParentChildAssignments'
import { Announcements } from './pages/Announcements'


function ProtectedRoute({ children, role }) {
  const { isAuthenticated, role: userRole } = useAuthStore()

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  if (role && userRole !== role) {
    return <Navigate to={`/${userRole}`} replace />
  }

  return children
}

function DashboardLayout({ children, role, user, onLogout }) {
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [isMobile, setIsMobile] = useState(false)

  React.useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth < 1024
      setIsMobile(mobile)
      if (mobile) setSidebarOpen(false)
    }
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  return (
    <div className="flex bg-gray-50 dark:bg-gray-900 min-h-screen">
      <Sidebar
        role={role}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        isMobile={isMobile}
        user={user}
      />
      <div className={`w-full transition-all duration-300 ${sidebarOpen && !isMobile ? 'lg:ml-64' : ''}`}>
        <Header
          user={user}
          toggleSidebar={() => setSidebarOpen(!sidebarOpen)}
          onLogout={onLogout}
          sidebarOpen={sidebarOpen}
          isMobile={isMobile}
        />
        <main className="pt-16 min-h-[calc(100dvh-4rem)]">
          {children}
        </main>
      </div>
    </div>
  )
}

export default function App() {
  const user = useAuthStore((state) => state.user)
  const logout = useAuthStore((state) => state.logout)
  const restoreSession = useAuthStore((state) => state.restoreSession)

  // Re-validate token expiry on every app mount
  React.useEffect(() => {
    restoreSession()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <BrowserRouter>
      <Routes>
        {/* Public */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPageNew />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />

        {/* ── STUDENT ── */}
        <Route path="/student" element={<ProtectedRoute role="student"><DashboardLayout role="student" user={user} onLogout={logout}><StudentDashboard /></DashboardLayout></ProtectedRoute>} />
        <Route path="/student/profile" element={<ProtectedRoute role="student"><DashboardLayout role="student" user={user} onLogout={logout}><Profile /></DashboardLayout></ProtectedRoute>} />
        <Route path="/student/grades" element={<ProtectedRoute role="student"><DashboardLayout role="student" user={user} onLogout={logout}><StudentGrades /></DashboardLayout></ProtectedRoute>} />
        <Route path="/student/attendance" element={<ProtectedRoute role="student"><DashboardLayout role="student" user={user} onLogout={logout}><StudentAttendance /></DashboardLayout></ProtectedRoute>} />
        <Route path="/student/assignments" element={<ProtectedRoute role="student"><DashboardLayout role="student" user={user} onLogout={logout}><StudentAssignments /></DashboardLayout></ProtectedRoute>} />
        <Route path="/student/timetable" element={<ProtectedRoute role="student"><DashboardLayout role="student" user={user} onLogout={logout}><StudentTimetable /></DashboardLayout></ProtectedRoute>} />
        <Route path="/student/announcements" element={<ProtectedRoute role="student"><DashboardLayout role="student" user={user} onLogout={logout}><Announcements /></DashboardLayout></ProtectedRoute>} />

        {/* ── TEACHER ── */}
        <Route path="/teacher" element={<ProtectedRoute role="teacher"><DashboardLayout role="teacher" user={user} onLogout={logout}><TeacherDashboard /></DashboardLayout></ProtectedRoute>} />
        <Route path="/teacher/profile" element={<ProtectedRoute role="teacher"><DashboardLayout role="teacher" user={user} onLogout={logout}><Profile /></DashboardLayout></ProtectedRoute>} />
        <Route path="/teacher/students" element={<ProtectedRoute role="teacher"><DashboardLayout role="teacher" user={user} onLogout={logout}><TeacherStudents /></DashboardLayout></ProtectedRoute>} />
        <Route path="/teacher/grades" element={<ProtectedRoute role="teacher"><DashboardLayout role="teacher" user={user} onLogout={logout}><TeacherGrades /></DashboardLayout></ProtectedRoute>} />
        <Route path="/teacher/attendance" element={<ProtectedRoute role="teacher"><DashboardLayout role="teacher" user={user} onLogout={logout}><TeacherAttendance /></DashboardLayout></ProtectedRoute>} />
        <Route path="/teacher/assignments" element={<ProtectedRoute role="teacher"><DashboardLayout role="teacher" user={user} onLogout={logout}><TeacherAssignments /></DashboardLayout></ProtectedRoute>} />
        <Route path="/teacher/timetable" element={<ProtectedRoute role="teacher"><DashboardLayout role="teacher" user={user} onLogout={logout}><TeacherTimetable /></DashboardLayout></ProtectedRoute>} />
        <Route path="/teacher/announcements" element={<ProtectedRoute role="teacher"><DashboardLayout role="teacher" user={user} onLogout={logout}><Announcements /></DashboardLayout></ProtectedRoute>} />

        {/* ── PARENT ── */}
        <Route path="/parent" element={<ProtectedRoute role="parent"><DashboardLayout role="parent" user={user} onLogout={logout}><ParentDashboard /></DashboardLayout></ProtectedRoute>} />
        <Route path="/parent/profile" element={<ProtectedRoute role="parent"><DashboardLayout role="parent" user={user} onLogout={logout}><Profile /></DashboardLayout></ProtectedRoute>} />
        <Route path="/parent/children" element={<ProtectedRoute role="parent"><DashboardLayout role="parent" user={user} onLogout={logout}><ParentChildren /></DashboardLayout></ProtectedRoute>} />
        <Route path="/parent/child/:studentId/grades" element={<ProtectedRoute role="parent"><DashboardLayout role="parent" user={user} onLogout={logout}><ParentChildGrades /></DashboardLayout></ProtectedRoute>} />
        <Route path="/parent/child/:studentId/attendance" element={<ProtectedRoute role="parent"><DashboardLayout role="parent" user={user} onLogout={logout}><ParentChildAttendance /></DashboardLayout></ProtectedRoute>} />
        <Route path="/parent/child/:studentId/assignments" element={<ProtectedRoute role="parent"><DashboardLayout role="parent" user={user} onLogout={logout}><ParentChildAssignments /></DashboardLayout></ProtectedRoute>} />
        <Route path="/parent/announcements" element={<ProtectedRoute role="parent"><DashboardLayout role="parent" user={user} onLogout={logout}><Announcements /></DashboardLayout></ProtectedRoute>} />

        {/* ── ADMIN ── */}
        <Route path="/admin" element={<ProtectedRoute role="admin"><DashboardLayout role="admin" user={user} onLogout={logout}><AdminDashboard /></DashboardLayout></ProtectedRoute>} />
        <Route path="/admin/profile" element={<ProtectedRoute role="admin"><DashboardLayout role="admin" user={user} onLogout={logout}><Profile /></DashboardLayout></ProtectedRoute>} />
        <Route path="/admin/students" element={<ProtectedRoute role="admin"><DashboardLayout role="admin" user={user} onLogout={logout}><Students /></DashboardLayout></ProtectedRoute>} />
        <Route path="/admin/teachers" element={<ProtectedRoute role="admin"><DashboardLayout role="admin" user={user} onLogout={logout}><Teachers /></DashboardLayout></ProtectedRoute>} />
        <Route path="/admin/parents" element={<ProtectedRoute role="admin"><DashboardLayout role="admin" user={user} onLogout={logout}><Parents /></DashboardLayout></ProtectedRoute>} />
        <Route path="/admin/classes" element={<ProtectedRoute role="admin"><DashboardLayout role="admin" user={user} onLogout={logout}><Classes /></DashboardLayout></ProtectedRoute>} />
        <Route path="/admin/subjects" element={<ProtectedRoute role="admin"><DashboardLayout role="admin" user={user} onLogout={logout}><Subjects /></DashboardLayout></ProtectedRoute>} />
        <Route path="/admin/timetable" element={<ProtectedRoute role="admin"><DashboardLayout role="admin" user={user} onLogout={logout}><Timetable /></DashboardLayout></ProtectedRoute>} />
        <Route path="/admin/attendance" element={<ProtectedRoute role="admin"><DashboardLayout role="admin" user={user} onLogout={logout}><Attendance /></DashboardLayout></ProtectedRoute>} />
        <Route path="/admin/examinations" element={<ProtectedRoute role="admin"><DashboardLayout role="admin" user={user} onLogout={logout}><Examinations /></DashboardLayout></ProtectedRoute>} />
        <Route path="/admin/assignments" element={<ProtectedRoute role="admin"><DashboardLayout role="admin" user={user} onLogout={logout}><Assignments /></DashboardLayout></ProtectedRoute>} />
        <Route path="/admin/results" element={<ProtectedRoute role="admin"><DashboardLayout role="admin" user={user} onLogout={logout}><Results /></DashboardLayout></ProtectedRoute>} />
        <Route path="/admin/reports" element={<ProtectedRoute role="admin"><DashboardLayout role="admin" user={user} onLogout={logout}><Reports /></DashboardLayout></ProtectedRoute>} />
        <Route path="/admin/enrollment" element={<ProtectedRoute role="admin"><DashboardLayout role="admin" user={user} onLogout={logout}><EnrollmentManagement /></DashboardLayout></ProtectedRoute>} />
        <Route path="/admin/academic-years" element={<ProtectedRoute role="admin"><DashboardLayout role="admin" user={user} onLogout={logout}><AcademicYearManagement /></DashboardLayout></ProtectedRoute>} />
        <Route path="/admin/settings" element={<ProtectedRoute role="admin"><DashboardLayout role="admin" user={user} onLogout={logout}><Settings /></DashboardLayout></ProtectedRoute>} />
        <Route path="/admin/users" element={<ProtectedRoute role="admin"><DashboardLayout role="admin" user={user} onLogout={logout}><UserManagement /></DashboardLayout></ProtectedRoute>} />
        <Route path="/admin/announcements" element={<ProtectedRoute role="admin"><DashboardLayout role="admin" user={user} onLogout={logout}><Announcements /></DashboardLayout></ProtectedRoute>} />

        {/* ── SUPERADMIN ── */}
        <Route path="/superadmin" element={<ProtectedRoute role="superadmin"><DashboardLayout role="superadmin" user={user} onLogout={logout}><SuperAdminDashboard /></DashboardLayout></ProtectedRoute>} />

        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </BrowserRouter>
  )
}
