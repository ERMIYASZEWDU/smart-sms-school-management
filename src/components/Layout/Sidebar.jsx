import React from 'react'
import { useTranslation } from 'react-i18next'
import { Link, useLocation } from 'react-router-dom'
import { motion } from 'framer-motion'
import { resolvePhotoUrl } from '../../utils/api'
import {
  LayoutDashboard,
  Users,
  BookOpen,
  Calendar,
  FileText,
  Settings,
  Menu,
  X,
  MessageSquare,
  Award,
  Bell,
  User,
  BarChart3,
  Megaphone
} from 'lucide-react'

const menuItems = {
  student: [
    { icon: LayoutDashboard, label: 'nav.dashboard', path: '/student' },
    { icon: BookOpen, label: 'nav.grades', path: '/student/grades' },
    { icon: Calendar, label: 'nav.attendance', path: '/student/attendance' },
    { icon: FileText, label: 'nav.assignments', path: '/student/assignments' },
    { icon: Calendar, label: 'nav.timetable', path: '/student/timetable' },
    { icon: Megaphone, label: 'nav.announcements', path: '/student/announcements' }
  ],
  teacher: [
    { icon: LayoutDashboard, label: 'nav.dashboard', path: '/teacher' },
    { icon: Users, label: 'nav.students', path: '/teacher/students' },
    { icon: BookOpen, label: 'nav.grades', path: '/teacher/grades' },
    { icon: Calendar, label: 'nav.attendance', path: '/teacher/attendance' },
    { icon: FileText, label: 'nav.assignments', path: '/teacher/assignments' },
    { icon: Calendar, label: 'nav.timetable', path: '/teacher/timetable' },
    { icon: Megaphone, label: 'nav.announcements', path: '/teacher/announcements' }
  ],
  parent: [
    { icon: LayoutDashboard, label: 'nav.dashboard', path: '/parent' },
    { icon: Users, label: 'parents.myChildren', path: '/parent/children' },
    { icon: Megaphone, label: 'nav.announcements', path: '/parent/announcements' }
  ],
  admin: [
    { section: 'nav.main', items: [
      { icon: LayoutDashboard, label: 'nav.dashboard', path: '/admin' },
      { icon: Users, label: 'nav.students', path: '/admin/students' },
      { icon: Users, label: 'nav.teachers', path: '/admin/teachers' },
      { icon: Users, label: 'nav.parents', path: '/admin/parents' },
      { icon: BookOpen, label: 'nav.classes', path: '/admin/classes' },
      { icon: BookOpen, label: 'nav.subjects', path: '/admin/subjects' },
      { icon: Calendar, label: 'nav.timetable', path: '/admin/timetable' },
      { icon: Calendar, label: 'nav.attendance', path: '/admin/attendance' },
      { icon: FileText, label: 'nav.examinations', path: '/admin/examinations' },
      { icon: Award, label: 'nav.results', path: '/admin/results' },
      { icon: FileText, label: 'nav.assignments', path: '/admin/assignments' },
      { icon: Users, label: 'nav.enrollment', path: '/admin/enrollment' },
      { icon: Calendar, label: 'nav.academicYears', path: '/admin/academic-years' },
      { icon: Megaphone, label: 'nav.announcements', path: '/admin/announcements' }
    ]},
    { section: 'nav.reportsSection', items: [
      { icon: BarChart3, label: 'nav.reports', path: '/admin/reports' }
    ]},
    { section: 'nav.settingsSection', items: [
      { icon: Users, label: 'nav.users', path: '/admin/users' },
      { icon: Settings, label: 'nav.settings', path: '/admin/settings' }
    ]}
  ],
  superadmin: [
    { icon: LayoutDashboard, label: 'nav.dashboard', path: '/superadmin' }
  ]
}

export const Sidebar = ({ role, isOpen, onClose, isMobile, user }) => {
  const { t } = useTranslation()
  const location = useLocation()
  const items = menuItems[role] || []

  return (
    <>
      {/* Overlay only on mobile */}
      {isOpen && isMobile && (
        <div
          className="fixed inset-0 bg-black/50 z-30"
          onClick={onClose}
        />
      )}

      <motion.aside
        initial={false}
        animate={{ 
          x: isOpen ? 0 : (isMobile ? -256 : -256),
          opacity: isOpen ? 1 : (isMobile ? 0 : 1)
        }}
        transition={{ duration: 0.3, ease: "easeInOut" }}
        className={`fixed top-0 left-0 w-64 h-screen bg-white dark:bg-gray-900 text-gray-900 dark:text-white z-40 shadow-lg border-r border-gray-200 dark:border-gray-800 ${
          !isOpen && !isMobile ? 'pointer-events-none opacity-0' : ''
        }`}
      >
        <div className="p-6 border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                SMS
              </h1>
              <p className="text-gray-600 dark:text-gray-400 text-xs mt-1 font-medium">Smart School Management System</p>
            </div>
            {isMobile && (
              <button 
                onClick={onClose}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
              >
                <X size={18} className="text-gray-600 dark:text-gray-400" />
              </button>
            )}
          </div>
        </div>

        <nav className="p-4 space-y-1 overflow-y-auto h-[calc(100vh-120px)]">
          {items.map((item, idx) => {
            // Handle section-based items (for admin)
            if (item.section) {
              return (
                <div key={idx}>
                  <p className="px-4 py-3 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mt-4 first:mt-0">{t(item.section)}</p>
                  <div className="space-y-1">
                    {item.items.map((subItem) => {
                      const Icon = subItem.icon
                      const isActive = location.pathname === subItem.path
                      return (
                        <Link key={subItem.path} to={subItem.path} onClick={onClose}>
                          <motion.div
                            whileHover={{ x: 4 }}
                            whileTap={{ scale: 0.98 }}
                            className={`flex items-center gap-3 px-4 py-2.5 rounded-lg transition-all duration-200 text-sm font-medium ${
                              isActive
                                ? 'bg-blue-600 text-white shadow-sm'
                                : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                            }`}
                          >
                            <Icon size={18} />
                            <span>{t(subItem.label)}</span>
                            {isActive && (
                              <motion.div
                                layoutId="activeIndicator"
                                className="ml-auto w-1.5 h-1.5 bg-white rounded-full"
                              />
                            )}
                          </motion.div>
                        </Link>
                      )
                    })}
                  </div>
                </div>
              )
            }

            // Handle regular items (for other roles)
            const Icon = item.icon
            const isActive = location.pathname === item.path

            return (
              <Link key={item.path} to={item.path} onClick={onClose}>
                <motion.div
                  whileHover={{ x: 4 }}
                  whileTap={{ scale: 0.98 }}
                  className={`flex items-center gap-3 px-4 py-2.5 rounded-lg transition-all duration-200 text-sm font-medium ${
                    isActive
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                  }`}
                >
                  <Icon size={18} />
                  <span>{t(item.label)}</span>
                  {isActive && (
                    <motion.div
                      layoutId="activeIndicator"
                      className="ml-auto w-1.5 h-1.5 bg-white rounded-full"
                    />
                  )}
                </motion.div>
              </Link>
            )
          })}
        </nav>

        {/* User footer */}
        <div className="p-4 border-t border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center overflow-hidden shrink-0">
              {user?.profilePhoto ? (
                <img src={resolvePhotoUrl(user.profilePhoto)} alt={user?.name || 'User'} className="w-full h-full object-cover" />
              ) : (
                <User size={20} className="text-white" />
              )}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">{user?.name || 'User'}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400 capitalize truncate">{user?.role || ''}</p>
            </div>
          </div>
        </div>
      </motion.aside>
    </>
  )
}
