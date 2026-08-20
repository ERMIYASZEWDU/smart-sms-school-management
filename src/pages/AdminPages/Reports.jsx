import React, { useState, useEffect } from 'react'
import { 
  FileText, Download, Calendar, Users, TrendingUp, 
  BarChart3, BookOpen, Award, Clock,
  Printer, Mail, FileSpreadsheet
} from 'lucide-react'

export const Reports = () => {
  console.log('Reports component loaded')
  const [loading, setLoading] = useState(true)
  const [students, setStudents] = useState([])
  const [teachers, setTeachers] = useState([])
  const [grades, setGrades] = useState([])
  const [selectedReportType, setSelectedReportType] = useState(null)
  const [dateRange, setDateRange] = useState({ from: '', to: '' })
  const [selectedClass, setSelectedClass] = useState('all')
  const [selectedSubject, setSelectedSubject] = useState('all')

  useEffect(() => {
    // Fetch data from API when component mounts
    const fetchData = async () => {
      try {
        const { getStudents, getTeachers, getGrades } = await import('../../services/adminApi')
        const [studentsResponse, teachersResponse, gradesResponse] = await Promise.all([
          getStudents(),
          getTeachers(),
          getGrades()
        ])
        
        // Handle different response structures
        // Students API returns { students: [], pagination: {} }
        // Teachers API returns array directly
        // Grades API returns { grades: [], pagination: {} } or array
        const studentsArray = Array.isArray(studentsResponse) 
          ? studentsResponse 
          : (studentsResponse?.students || [])
        
        const teachersArray = Array.isArray(teachersResponse)
          ? teachersResponse
          : (teachersResponse?.teachers || [])
        
        const gradesArray = Array.isArray(gradesResponse)
          ? gradesResponse
          : (gradesResponse?.grades || [])
        
        setStudents(studentsArray)
        setTeachers(teachersArray)
        setGrades(gradesArray)
        
        console.log('📊 Reports data loaded:', {
          students: studentsArray.length,
          teachers: teachersArray.length,
          grades: gradesArray.length
        })
      } catch (error) {
        console.error('❌ Error fetching reports data:', error)
        // Set empty arrays on error to allow page to render
        setStudents([])
        setTeachers([])
        setGrades([])
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  // Report types available
  const reportTypes = [
    {
      id: 'student-performance',
      title: 'Student Performance Report',
      description: 'Detailed academic performance analysis by student, class, or subject',
      icon: Award,
      color: 'from-blue-500 to-blue-600',
      bgColor: 'bg-blue-50 dark:bg-blue-900/30',
      iconColor: 'text-blue-600 dark:text-blue-400',
      fields: ['class', 'subject', 'dateRange']
    },
    {
      id: 'attendance',
      title: 'Attendance Report',
      description: 'Student and teacher attendance statistics and trends',
      icon: Calendar,
      color: 'from-green-500 to-green-600',
      bgColor: 'bg-green-50 dark:bg-green-900/30',
      iconColor: 'text-green-600 dark:text-green-400',
      fields: ['class', 'dateRange']
    },
    {
      id: 'exam-results',
      title: 'Examination Results Report',
      description: 'Comprehensive exam results with grade distribution and analysis',
      icon: FileText,
      color: 'from-purple-500 to-purple-600',
      bgColor: 'bg-purple-50 dark:bg-purple-900/30',
      iconColor: 'text-purple-600 dark:text-purple-400',
      fields: ['class', 'subject', 'examType']
    },
    {
      id: 'teacher-performance',
      title: 'Teacher Performance Report',
      description: 'Teaching effectiveness metrics and student outcomes by teacher',
      icon: Users,
      color: 'from-orange-500 to-orange-600',
      bgColor: 'bg-orange-50 dark:bg-orange-900/30',
      iconColor: 'text-orange-600 dark:text-orange-400',
      fields: ['teacher', 'subject', 'dateRange']
    },
    {
      id: 'class-overview',
      title: 'Class Overview Report',
      description: 'Complete class statistics including students, subjects, and performance',
      icon: BookOpen,
      color: 'from-indigo-500 to-indigo-600',
      bgColor: 'bg-indigo-50 dark:bg-indigo-900/30',
      iconColor: 'text-indigo-600 dark:text-indigo-400',
      fields: ['class']
    },
    {
      id: 'progress-tracking',
      title: 'Progress Tracking Report',
      description: 'Student progress over time with trends and improvement areas',
      icon: TrendingUp,
      color: 'from-pink-500 to-pink-600',
      bgColor: 'bg-pink-50 dark:bg-pink-900/30',
      iconColor: 'text-pink-600 dark:text-pink-400',
      fields: ['class', 'subject', 'dateRange']
    },
    {
      id: 'subject-analysis',
      title: 'Subject-wise Analysis',
      description: 'Subject performance metrics, difficulty analysis, and comparisons',
      icon: BarChart3,
      color: 'from-teal-500 to-teal-600',
      bgColor: 'bg-teal-50 dark:bg-teal-900/30',
      iconColor: 'text-teal-600 dark:text-teal-400',
      fields: ['subject', 'class']
    },
    {
      id: 'time-table',
      title: 'Timetable Report',
      description: 'Complete schedule overview for classes and teachers',
      icon: Clock,
      color: 'from-cyan-500 to-cyan-600',
      bgColor: 'bg-cyan-50 dark:bg-cyan-900/30',
      iconColor: 'text-cyan-600 dark:text-cyan-400',
      fields: ['class', 'teacher']
    }
  ]

  // Calculate statistics
  const stats = {
    totalStudents: Array.isArray(students) ? students.length : 0,
    totalTeachers: Array.isArray(teachers) ? teachers.length : 0,
    totalClasses: Array.isArray(students) && students.length > 0
      ? [...new Set(students.map(s => `${s.grade}-${s.section}`).filter(Boolean))].length
      : 0,
    avgAttendance: 85.5,
    passRate: Array.isArray(grades) && grades.length > 0 
      ? ((grades.filter(g => (g.score / (g.maxScore || 100)) >= 0.5).length / grades.length) * 100).toFixed(1)
      : 0
  }

  const handleGenerateReport = (reportType) => {
    setSelectedReportType(reportType)
    // Scroll to report details section
    document.getElementById('report-details')?.scrollIntoView({ behavior: 'smooth' })
  }

  const handleExportReport = (format) => {
    alert(`Exporting ${selectedReportType?.title || 'report'} as ${format.toUpperCase()}...`)
    // In production, this would trigger actual export functionality
  }

  const handlePrintReport = () => {
    window.print()
  }

  const handleEmailReport = () => {
    alert('Email report functionality would be implemented here')
  }

  // Get unique classes
  const classes = Array.isArray(students) && students.length > 0
    ? [...new Set(students.map(s => `${s.grade}-${s.section}`).filter(Boolean))].sort()
    : []
  
  // Get unique subjects
  const subjects = Array.isArray(grades) && grades.length > 0
    ? [...new Set(grades.map(g => g.subject).filter(Boolean))].sort()
    : []

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 dark:from-gray-900 via-blue-50 dark:via-blue-900/40 to-purple-50 dark:to-purple-900/40 p-6 pt-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <FileText size={36} className="text-indigo-600 dark:text-indigo-400" />
            <h1 className="text-4xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
              Reports & Analytics
            </h1>
          </div>
          <p className="text-gray-600 dark:text-gray-300 mt-2">
            Generate comprehensive reports and insights for your school
          </p>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg border border-gray-100 dark:border-gray-800">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 dark:text-gray-300 text-sm font-medium mb-1">Total Students</p>
                <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">{stats.totalStudents}</p>
              </div>
              <div className="p-4 bg-blue-50 dark:bg-blue-900/30 rounded-xl">
                <Users size={28} className="text-blue-600 dark:text-blue-400" />
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg border border-gray-100 dark:border-gray-800">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 dark:text-gray-300 text-sm font-medium mb-1">Total Teachers</p>
                <p className="text-3xl font-bold text-green-600 dark:text-green-400">{stats.totalTeachers}</p>
              </div>
              <div className="p-4 bg-green-50 dark:bg-green-900/30 rounded-xl">
                <Users size={28} className="text-green-600 dark:text-green-400" />
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg border border-gray-100 dark:border-gray-800">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 dark:text-gray-300 text-sm font-medium mb-1">Total Classes</p>
                <p className="text-3xl font-bold text-purple-600 dark:text-purple-400">{stats.totalClasses}</p>
              </div>
              <div className="p-4 bg-purple-50 dark:bg-purple-900/30 rounded-xl">
                <BookOpen size={28} className="text-purple-600 dark:text-purple-400" />
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg border border-gray-100 dark:border-gray-800">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 dark:text-gray-300 text-sm font-medium mb-1">Avg Attendance</p>
                <p className="text-3xl font-bold text-orange-600 dark:text-orange-400">{stats.avgAttendance}%</p>
              </div>
              <div className="p-4 bg-orange-50 dark:bg-orange-900/30 rounded-xl">
                <Calendar size={28} className="text-orange-600 dark:text-orange-400" />
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg border border-gray-100 dark:border-gray-800">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 dark:text-gray-300 text-sm font-medium mb-1">Pass Rate</p>
                <p className="text-3xl font-bold text-teal-600 dark:text-teal-400">{stats.passRate}%</p>
              </div>
              <div className="p-4 bg-teal-50 dark:bg-teal-900/30 rounded-xl">
                <Award size={28} className="text-teal-600 dark:text-teal-400" />
              </div>
            </div>
          </div>
        </div>

        {/* Report Types Grid */}
        <div>
          <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-6">Select Report Type</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
            {reportTypes.map((report, index) => {
              const IconComponent = report.icon
              return (
                <div
                  key={report.id}
                  onClick={() => handleGenerateReport(report)}
                  className={`${report.bgColor} rounded-2xl p-6 cursor-pointer shadow-lg border-2 ${
                    selectedReportType?.id === report.id ? 'border-indigo-500 ring-4 ring-indigo-100' : 'border-gray-100 dark:border-gray-800'
                  } transition-all duration-300 hover:scale-105`}
                >
                  <div className={`w-14 h-14 bg-gradient-to-br ${report.color} rounded-xl flex items-center justify-center mb-4 shadow-md`}>
                    <IconComponent size={28} className="text-white" />
                  </div>
                  <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100 mb-2">{report.title}</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-300">{report.description}</p>
                </div>
              )
            })}
          </div>
        </div>

        {/* Report Generation Section */}
        {selectedReportType && (
          <div
            id="report-details"
            className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-800 p-8 mb-8"
          >
            <div className="flex items-center gap-4 mb-6">
              {React.createElement(selectedReportType.icon, { size: 32, className: selectedReportType.iconColor })}
              <div>
                <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100">{selectedReportType.title}</h2>
                <p className="text-gray-600 dark:text-gray-300">{selectedReportType.description}</p>
              </div>
            </div>

            {/* Filter Options */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
              {selectedReportType.fields.includes('class') && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
                    <BookOpen size={16} className="inline mr-2" />
                    Select Class
                  </label>
                  <select
                    value={selectedClass}
                    onChange={(e) => setSelectedClass(e.target.value)}
                    className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white dark:bg-gray-800"
                  >
                    <option value="all">All Classes</option>
                    {classes.map(cls => (
                      <option key={cls} value={cls}>{cls}</option>
                    ))}
                  </select>
                </div>
              )}

              {selectedReportType.fields.includes('subject') && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
                    <FileText size={16} className="inline mr-2" />
                    Select Subject
                  </label>
                  <select
                    value={selectedSubject}
                    onChange={(e) => setSelectedSubject(e.target.value)}
                    className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white dark:bg-gray-800"
                  >
                    <option value="all">All Subjects</option>
                    {subjects.map(subject => (
                      <option key={subject} value={subject}>{subject}</option>
                    ))}
                  </select>
                </div>
              )}

              {selectedReportType.fields.includes('dateRange') && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
                      <Calendar size={16} className="inline mr-2" />
                      From Date
                    </label>
                    <input
                      type="date"
                      value={dateRange.from}
                      onChange={(e) => setDateRange({ ...dateRange, from: e.target.value })}
                      className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
                      <Calendar size={16} className="inline mr-2" />
                      To Date
                    </label>
                    <input
                      type="date"
                      value={dateRange.to}
                      onChange={(e) => setDateRange({ ...dateRange, to: e.target.value })}
                      className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    />
                  </div>
                </>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap gap-3 border-t border-gray-200 dark:border-gray-700 pt-6">
              <button
                onClick={() => handleExportReport('pdf')}
                className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white font-semibold rounded-lg transition-all shadow-md hover:shadow-lg"
              >
                <Download size={18} />
                Export as PDF
              </button>
              <button
                onClick={() => handleExportReport('excel')}
                className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white font-semibold rounded-lg transition-all shadow-md hover:shadow-lg"
              >
                <FileSpreadsheet size={18} />
                Export as Excel
              </button>
              <button
                onClick={handlePrintReport}
                className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-gray-600 to-gray-700 hover:from-gray-700 hover:to-gray-800 text-white font-semibold rounded-lg transition-all shadow-md hover:shadow-lg"
              >
                <Printer size={18} />
                Print Report
              </button>
              <button
                onClick={handleEmailReport}
                className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold rounded-lg transition-all shadow-md hover:shadow-lg"
              >
                <Mail size={18} />
                Email Report
              </button>
            </div>

            {/* Report Preview */}
            <div className="mt-8 border-t border-gray-200 dark:border-gray-700 pt-8">
              <h3 className="text-xl font-bold text-gray-800 dark:text-gray-100 mb-4">Report Preview</h3>
              <div className="bg-gradient-to-br from-gray-50 dark:from-gray-900 to-blue-50 dark:to-blue-900/40 rounded-xl p-8 border-2 border-gray-200 dark:border-gray-700">
                <div className="text-center mb-6">
                  <h4 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-2">{selectedReportType.title}</h4>
                  <p className="text-gray-600 dark:text-gray-300">
                    Generated on {new Date().toLocaleDateString()} at {new Date().toLocaleTimeString()}
                  </p>
                </div>

                {/* Sample Data Table */}
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white">
                      <tr>
                        <th className="text-left p-4 font-semibold">Parameter</th>
                        <th className="text-left p-4 font-semibold">Value</th>
                        <th className="text-left p-4 font-semibold">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="border-b border-gray-100 dark:border-gray-800">
                        <td className="p-4 font-medium text-gray-700 dark:text-gray-200">Selected Class</td>
                        <td className="p-4 text-gray-600 dark:text-gray-300">{selectedClass === 'all' ? 'All Classes' : selectedClass}</td>
                        <td className="p-4">
                          <span className="px-3 py-1 bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300 rounded-full text-xs font-semibold">
                            Active
                          </span>
                        </td>
                      </tr>
                      <tr className="border-b border-gray-100 dark:border-gray-800">
                        <td className="p-4 font-medium text-gray-700 dark:text-gray-200">Selected Subject</td>
                        <td className="p-4 text-gray-600 dark:text-gray-300">{selectedSubject === 'all' ? 'All Subjects' : selectedSubject}</td>
                        <td className="p-4">
                          <span className="px-3 py-1 bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 rounded-full text-xs font-semibold">
                            Active
                          </span>
                        </td>
                      </tr>
                      <tr className="border-b border-gray-100 dark:border-gray-800">
                        <td className="p-4 font-medium text-gray-700 dark:text-gray-200">Date Range</td>
                        <td className="p-4 text-gray-600 dark:text-gray-300">
                          {dateRange.from && dateRange.to 
                            ? `${new Date(dateRange.from).toLocaleDateString()} - ${new Date(dateRange.to).toLocaleDateString()}`
                            : 'All Time'}
                        </td>
                        <td className="p-4">
                          <span className="px-3 py-1 bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300 rounded-full text-xs font-semibold">
                            Selected
                          </span>
                        </td>
                      </tr>
                      <tr>
                        <td className="p-4 font-medium text-gray-700 dark:text-gray-200">Total Records</td>
                        <td className="p-4 text-gray-600 dark:text-gray-300 font-bold">{stats.totalStudents}</td>
                        <td className="p-4">
                          <span className="px-3 py-1 bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300 rounded-full text-xs font-semibold">
                            Ready
                          </span>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/30 rounded-lg border-2 border-blue-200 dark:border-blue-900/50">
                  <p className="text-sm text-blue-800">
                    <strong>Note:</strong> This is a preview. Click "Export as PDF" or "Export as Excel" to generate the full detailed report with charts, graphs, and comprehensive data analysis.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* No Report Selected Message */}
        {!selectedReportType && (
          <div className="bg-gradient-to-br from-indigo-50 dark:from-indigo-900/40 to-purple-50 dark:to-purple-900/40 rounded-2xl p-12 text-center border-2 border-indigo-200">
            <FileText size={64} className="mx-auto text-indigo-400 mb-4" />
            <h3 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-2">Select a Report Type</h3>
            <p className="text-gray-600 dark:text-gray-300">
              Choose a report type from above to generate comprehensive insights and analytics
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
