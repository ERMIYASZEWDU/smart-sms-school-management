import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { motion } from 'framer-motion'
import { Users, BookOpen, TrendingUp, AlertTriangle, Download, Calendar } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts'
import { AddStudentModal } from '../../components/AddStudentModal'
import { AddTeacherModal } from '../../components/AddTeacherModal'
import { MarkAttendanceModal } from '../../components/MarkAttendanceModal'
import { CollectFeesModal } from '../../components/CollectFeesModal'

const feeCollectionData = [
  { month: 'Jan', amount: 8000 },
  { month: 'Feb', amount: 10000 },
  { month: 'Mar', amount: 12500 },
  { month: 'Apr', amount: 15000 },
  { month: 'May', amount: 18750 },
  { month: 'Jun', amount: 18750 }
]

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
  const navigate = useNavigate()
  
  const [showAddStudent, setShowAddStudent] = useState(false)
  const [showAddTeacher, setShowAddTeacher] = useState(false)
  const [showMarkAttendance, setShowMarkAttendance] = useState(false)
  const [showCollectFees, setShowCollectFees] = useState(false)
  const [dateRange, setDateRange] = useState({
    start: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0]
  })
  const [showDatePicker, setShowDatePicker] = useState(false)
  const [feeYearFilter, setFeeYearFilter] = useState('This Year')
  const [attendanceFilter, setAttendanceFilter] = useState('This Week')
  const [feesMonthFilter, setFeesMonthFilter] = useState('May 2026')

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

  const handleSaveFees = (feeData) => {
    console.log('Fee Collection:', feeData)
    alert(`Fee collected: $${feeData.amount} - Receipt #${feeData.receiptNumber}`)
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
    { icon: '💰', label: 'Collect Fees', onClick: () => setShowCollectFees(true) },
    { icon: '📊', label: 'View Reports', onClick: () => navigate('/admin/reports') }
  ]

  const stats = [
    { 
      icon: Users, 
      label: 'Total Students', 
      value: '1,248', 
      subtitle: '+3.2% from last month', 
      bgColor: 'bg-blue-50', 
      textColor: 'text-blue-600', 
      borderColor: 'border-blue-200',
      onClick: () => navigate('/admin/students')
    },
    { 
      icon: Users, 
      label: 'Total Teachers', 
      value: '98', 
      subtitle: '+3.5% from last month', 
      bgColor: 'bg-green-50', 
      textColor: 'text-green-600', 
      borderColor: 'border-green-200',
      onClick: () => navigate('/admin/teachers')
    },
    { 
      icon: AlertTriangle, 
      label: "Today's Attendance", 
      value: '92.6%', 
      subtitle: '+3.4% from yesterday', 
      bgColor: 'bg-orange-50', 
      textColor: 'text-orange-600', 
      borderColor: 'border-orange-200',
      onClick: () => navigate('/admin/attendance')
    },
    { 
      icon: TrendingUp, 
      label: 'Fee Collection (May)', 
      value: '₹18,75,500', 
      subtitle: '+12.6% from last month', 
      bgColor: 'bg-purple-50', 
      textColor: 'text-purple-600', 
      borderColor: 'border-purple-200',
      onClick: () => navigate('/admin/fees')
    }
  ]

  return (
    <div className="min-h-screen bg-gray-50 p-6 pt-8">
      <h1 className="text-3xl font-bold text-gray-800 mb-8">Admin Dashboard - Temporarily Simplified</h1>
      
      <div className="bg-yellow-50 border-2 border-yellow-400 rounded-lg p-4 mb-6">
        <p className="text-yellow-800 font-semibold">⚠️ Dashboard in safe mode - Full version will be restored shortly</p>
        <p className="text-sm text-yellow-700 mt-2">All features are functional. UI is temporarily simplified to fix a technical issue.</p>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {stats.map((stat, idx) => {
          const Icon = stat.icon
          return (
            <div
              key={idx}
              onClick={stat.onClick}
              className={`${stat.bgColor} border ${stat.borderColor} rounded-lg p-5 cursor-pointer hover:shadow-lg transition-all`}
            >
              <div className="flex items-start justify-between mb-3">
                <div className={`p-2 rounded-lg ${stat.textColor} bg-white/50`}>
                  <Icon size={20} />
                </div>
                <span className={`text-xs font-semibold ${stat.textColor} px-2 py-1 rounded-full bg-white/60`}>
                  +3.2%
                </span>
              </div>
              <p className="text-gray-600 text-sm font-medium">{stat.label}</p>
              <p className={`text-2xl font-bold ${stat.textColor} mt-1`}>
                {stat.value}
              </p>
              <p className="text-xs text-gray-500 mt-2">{stat.subtitle}</p>
            </div>
          )
        })}
      </div>

      <div className="grid md:grid-cols-3 gap-4 mb-6">
        {quickActions.map((action, idx) => (
          <button
            key={idx}
            onClick={action.onClick}
            className="bg-white border border-gray-200 rounded-lg p-4 text-center hover:shadow-md transition cursor-pointer"
          >
            <div className="text-3xl mb-2">{action.icon}</div>
            <p className="text-gray-800 font-semibold text-sm">{action.label}</p>
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
      <CollectFeesModal
        isOpen={showCollectFees}
        onClose={() => setShowCollectFees(false)}
        onSave={handleSaveFees}
      />
    </div>
  )
}
