import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { motion } from 'framer-motion'
import { Users, BookOpen, TrendingUp, AlertTriangle, Download, Calendar } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts'
import { AddStudentModal } from '../../components/AddStudentModal'
import { AddTeacherModal } from '../../components/AddTeacherModal'
import { useAuthStore } from '../../store/authStore'
import { resolvePhotoUrl } from '../../utils/api'
import { MarkAttendanceModal } from '../../components/MarkAttendanceModal'
import { getAdminDashboard } from '../../services/adminApi'

const studentByClassData = [
  { name: 'Class 1-5', value: 245, fill: '#3b82f6' },
  { name: 'Class 6-8', value: 312, fill: '#8b5cf6' },
  { name: 'Class 9-10', value: 298, fill: '#f59e0b' },
  { name: 'Class 11-12', value: 281, fill: '#ec4899' },
  { name: 'Others', value: 112, fill: '#06b6d4' }
]

const attendanceData = [
  { class: 'Class 1 - A', total: 28, present: 26, absent: 2, percentage: 92.86 },
  { class: 'Class 2 - B', total: 30, present: 27, absent: 3, percentage: 90.0 },
  { class: 'Class 3 - A', total: 29, present: 25, absent: 4, percentage: 86.21 },
  { class: 'Class 4 - B', total: 31, present: 28, absent: 2, percentage: 93.33 },
  { class: 'Class 5 - A', total: 28, present: 24, absent: 4, percentage: 85.71 }
]

export const AdminDashboard = () => {
  const { t } = useTranslation()
  const user = useAuthStore((s) => s.user)
  const navigate = useNavigate()
  
  const [showAddStudent, setShowAddStudent] = useState(false)
  const [showAddTeacher, setShowAddTeacher] = useState(false)
  const [showMarkAttendance, setShowMarkAttendance] = useState(false)
  const [dateRange, setDateRange] = useState({
    start: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0]
  })
  const [showDatePicker, setShowDatePicker] = useState(false)
  const [attendanceFilter, setAttendanceFilter] = useState('This Week')
  
  // Real data from API
  const [dashboardData, setDashboardData] = useState({
    totalStudents: 0,
    totalTeachers: 0,
    totalParents: 0,
    totalClasses: 0,
    avgAttendance: 0
  })
  const [loading, setLoading] = useState(true)

  // Fetch dashboard data on mount - AFTER navigation
  useEffect(() => {
    console.log('📊 [DASHBOARD] Starting to load admin dashboard data...')
    const fetchStart = performance.now()
    
    fetchDashboardData().then(() => {
      const fetchTime = performance.now() - fetchStart
      console.log(`⏱️  [DASHBOARD] Admin dashboard data loaded in ${fetchTime.toFixed(0)}ms`)
    })
  }, [])

  const fetchDashboardData = async () => {
    try {
      setLoading(true)
      const data = await getAdminDashboard()
      setDashboardData(data)
    } catch (error) {
      console.error('❌ [DASHBOARD] Error fetching dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSaveStudent = (studentData) => {
    console.log('New Student:', studentData)
    alert(`Student ${studentData.firstName} ${studentData.lastName} added successfully!`)
  }

  const handleSaveTeacher = (teacherData) => {
    console.log('New Teacher:', teacherData)
    alert(`Teacher ${teacherData.firstName} ${teacherData.lastName} added successfully!`)
  }

  const handleSaveAttendance = (attendanceData) => {
    console.log('Attendance:', attendanceData)
    alert(`Attendance marked for Class ${attendanceData.class}!`)
  }

  const handleDownloadReport = () => {
    const reportData = {
      students: { total: 1248, new: 40 },
      teachers: { total: 98, new: 3 },
      attendance: { rate: 92.6, present: 1155, absent: 93 },
      fees: { collected: 1875500, pending: 575000, overdue: 50000 }
    }

    const csv = `School Management System Report
Generated: ${new Date().toLocaleString()}
Date Range: ${formatDate(dateRange.start)} - ${formatDate(dateRange.end)}

SUMMARY
Total Students,${reportData.students.total}
New Students,${reportData.students.new}
Total Teachers,${reportData.teachers.total}
Attendance Rate,${reportData.attendance.rate}%

ATTENDANCE BY CLASS
Class,Total,Present,Absent,Percentage
${attendanceData.map(item => `${item.class},${item.total},${item.present},${item.absent},${item.percentage.toFixed(2)}%`).join('\n')}
`

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', `School_Report_${new Date().toISOString().split('T')[0]}.csv`)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    
    alert('Report downloaded successfully!')
  }

  const formatDate = (dateString) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
  }

  const quickActions = [
    { icon: '👤', label: 'Add Student', onClick: () => setShowAddStudent(true) },
    { icon: '👨‍🏫', label: 'Add Teacher', onClick: () => setShowAddTeacher(true) },
    { icon: '📚', label: 'Add Class', onClick: () => navigate('/admin/classes') },
    { icon: '📋', label: 'Mark Attendance', onClick: () => setShowMarkAttendance(true) },
    { icon: '📊', label: 'View Reports', onClick: () => navigate('/admin/reports') }
  ]

  const stats = [
    { 
      icon: Users, 
      label: 'Total Students', 
      value: loading ? '...' : dashboardData.totalStudents.toLocaleString(), 
      subtitle: 'Active students', 
      bgColor: 'bg-[#EFF6FF]', 
      numberColor: 'text-[#1D4ED8]',
      titleColor: 'text-[#1E3A8A]',
      percentColor: 'text-[#16A34A]',
      iconBg: 'bg-[#DBEAFE]',
      iconColor: 'text-[#2563EB]',
      borderColor: 'border-black/5',
      onClick: () => navigate('/admin/students')
    },
    { 
      icon: Users, 
      label: 'Total Teachers', 
      value: loading ? '...' : dashboardData.totalTeachers.toLocaleString(), 
      subtitle: 'Teaching staff', 
      bgColor: 'bg-[#F5F3FF]', 
      numberColor: 'text-[#6D28D9]',
      titleColor: 'text-[#4C1D95]',
      percentColor: 'text-[#16A34A]',
      iconBg: 'bg-[#EDE9FE]',
      iconColor: 'text-[#7C3AED]',
      borderColor: 'border-black/5',
      onClick: () => navigate('/admin/teachers')
    },
    { 
      icon: AlertTriangle, 
      label: "Today's Attendance", 
      value: loading ? '...' : `${dashboardData.avgAttendance}%`, 
      subtitle: 'Average attendance rate', 
      bgColor: 'bg-[#F0FDF4]', 
      numberColor: 'text-[#15803D]',
      titleColor: 'text-[#166534]',
      percentColor: 'text-[#16A34A]',
      iconBg: 'bg-[#DCFCE7]',
      iconColor: 'text-[#22C55E]',
      borderColor: 'border-black/5',
      onClick: () => navigate('/admin/attendance')
    },
    { 
      icon: BookOpen, 
      label: 'Total Classes', 
      value: loading ? '...' : dashboardData.totalClasses.toLocaleString(), 
      subtitle: 'Active classes', 
      bgColor: 'bg-[#FFF7ED]', 
      numberColor: 'text-[#C2410C]',
      titleColor: 'text-[#9A3412]',
      percentColor: 'text-[#16A34A]',
      iconBg: 'bg-[#FFEDD5]',
      iconColor: 'text-[#F97316]',
      borderColor: 'border-black/5',
      onClick: () => navigate('/admin/classes')
    }
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 dark:from-gray-900 via-blue-50 dark:via-blue-900/40 to-purple-50 dark:to-purple-900/40 p-3 sm:p-6 pt-4 sm:pt-8">
      
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6 md:mb-8"
      >
        <div className="flex items-center gap-3 md:gap-4">
          <div className="w-11 h-11 md:w-14 md:h-14 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center overflow-hidden shrink-0">
            {user?.profilePhoto ? (
              <img src={resolvePhotoUrl(user.profilePhoto)} alt={user?.name || 'User'} className="w-full h-full object-cover" />
            ) : (
              <span className="text-white font-bold text-lg">{(user?.name || 'A').charAt(0).toUpperCase()}</span>
            )}
          </div>
          <div className="min-w-0">
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-1 md:mb-2">
              Admin Dashboard
            </h1>
            <p className="text-sm sm:text-base md:text-lg text-gray-600 dark:text-gray-300">Welcome back, {user?.name || 'Admin'}! Here's what's happening today.</p>
          </div>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-6 md:mb-8">
        {stats.map((stat, idx) => {
          const Icon = stat.icon
          return (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
              whileHover={{ y: -4, boxShadow: '0 10px 25px rgba(0,0,0,0.10)' }}
              onClick={stat.onClick}
              className={`${stat.bgColor} border ${stat.borderColor} rounded-xl md:rounded-2xl p-4 md:p-6 cursor-pointer transition-all duration-250 shadow-[0_4px_12px_rgba(0,0,0,0.06)] h-full`}
              style={{ fontFamily: 'Inter, system-ui, sans-serif' }}
            >
              <div className="flex items-start justify-between mb-3 md:mb-4">
                <p className={`${stat.titleColor} text-xs md:text-sm font-semibold`}>{stat.label}</p>
                <div className={`${stat.iconBg} p-2 md:p-2.5 rounded-lg md:rounded-xl`}>
                  <Icon size={18} className={`${stat.iconColor} md:w-5 md:h-5`} />
                </div>
              </div>
              
              <p className={`text-2xl md:text-[30px] font-bold ${stat.numberColor} leading-tight mb-2 md:mb-3`}>
                {stat.value}
              </p>
              
              <p className={`text-xs md:text-[13px] font-semibold ${stat.percentColor} flex items-center gap-1`}>
                <span>↗</span>
                <span className="line-clamp-1">{stat.subtitle}</span>
              </p>
            </motion.div>
          )
        })}
      </div>

      <div className="grid md:grid-cols-3 gap-4 mb-6">
        {quickActions.map((action, idx) => (
          <button
            key={idx}
            onClick={action.onClick}
            className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 text-center hover:shadow-md transition cursor-pointer"
          >
            <div className="text-3xl mb-2">{action.icon}</div>
            <p className="text-gray-800 dark:text-gray-100 font-semibold text-sm">{action.label}</p>
          </button>
        ))}
      </div>

      <div className="flex gap-4">
        <button
          onClick={handleDownloadReport}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          <Download size={18} />
          Download Report
        </button>
      </div>

      <AddStudentModal
        isOpen={showAddStudent}
        onClose={() => setShowAddStudent(false)}
        onSave={handleSaveStudent}
      />
      <AddTeacherModal
        isOpen={showAddTeacher}
        onClose={() => setShowAddTeacher(false)}
        onSave={handleSaveTeacher}
      />
      <MarkAttendanceModal
        isOpen={showMarkAttendance}
        onClose={() => setShowMarkAttendance(false)}
        onSave={handleSaveAttendance}
      />
    </div>
  )
}
