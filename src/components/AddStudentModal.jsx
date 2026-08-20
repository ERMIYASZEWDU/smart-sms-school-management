import React, { useState } from 'react'
import { Modal } from './Modal'
import { Button } from './Button'
import { Input } from './Input'
import { User, Mail, Phone, Calendar, MapPin, Users } from 'lucide-react'

export const AddStudentModal = ({ isOpen, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    dateOfBirth: '',
    gender: '',
    class: '',
    section: '',
    stream: '', // For Grade 11-12: Natural/Social
    rollNumber: '',
    address: '',
    parentName: '',
    parentPhone: '',
    parentEmail: ''
  })

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => {
      const updated = { ...prev, [name]: value }
      // Reset stream if not grade 11 or 12
      if (name === 'class' && !['11', '12'].includes(value)) {
        updated.stream = ''
      }
      return updated
    })
  }

  // Generate sections A-Z
  const sections = Array.from({ length: 26 }, (_, i) => String.fromCharCode(65 + i))
  
  // Check if selected grade needs stream selection
  const needsStream = ['11', '12'].includes(formData.class)

  const handleSubmit = (e) => {
    e.preventDefault()
    onSave(formData)
    // Reset form
    setFormData({
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      dateOfBirth: '',
      gender: '',
      class: '',
      section: '',
      stream: '',
      rollNumber: '',
      address: '',
      parentName: '',
      parentPhone: '',
      parentEmail: ''
    })
    onClose()
  }

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={onClose} 
      title="Add New Student" 
      size="lg"
      footer={
        <div className="flex flex-col-reverse sm:flex-row justify-end gap-2 sm:gap-3">
          <Button type="button" variant="secondary" onClick={onClose} className="w-full sm:w-auto">
            Cancel
          </Button>
          <Button type="submit" form="student-form" className="w-full sm:w-auto">
            Save Student
          </Button>
        </div>
      }
    >
      <form id="student-form" onSubmit={handleSubmit} className="space-y-3">
        {/* Personal Information */}
        <div>
          <h3 className="text-sm sm:text-base font-semibold text-gray-800 dark:text-gray-100 mb-2 flex items-center gap-2">
            <User className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600 dark:text-blue-400" />
            Personal Information
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
            <div>
              <label className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-200 mb-0.5">
                First Name *
              </label>
              <Input
                name="firstName"
                value={formData.firstName}
                onChange={handleChange}
                placeholder="Enter first name"
                required
              />
            </div>
            <div>
              <label className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-200 mb-0.5">
                Last Name *
              </label>
              <Input
                name="lastName"
                value={formData.lastName}
                onChange={handleChange}
                placeholder="Enter last name"
                required
              />
            </div>
            <div>
              <label className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-200 mb-0.5">
                Email
              </label>
              <Input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="student@example.com"
              />
            </div>
            <div>
              <label className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-200 mb-0.5">
                Phone
              </label>
              <Input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                placeholder="+1 (555) 000-0000"
              />
            </div>
            <div>
              <label className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-200 mb-0.5">
                Date of Birth *
              </label>
              <Input
                type="date"
                name="dateOfBirth"
                value={formData.dateOfBirth}
                onChange={handleChange}
                required
              />
            </div>
            <div>
              <label className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-200 mb-0.5">
                Gender *
              </label>
              <select
                name="gender"
                value={formData.gender}
                onChange={handleChange}
                className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-800"
                required
              >
                <option value="">Select Gender</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
              </select>
            </div>
          </div>
        </div>

        {/* Academic Information */}
        <div>
          <h3 className="text-sm sm:text-base font-semibold text-gray-800 dark:text-gray-100 mb-2 flex items-center gap-2">
            <Users className="w-4 h-4 sm:w-5 sm:h-5 text-green-600 dark:text-green-400" />
            Academic Information
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
            <div>
              <label className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-200 mb-0.5">
                Grade *
              </label>
              <select
                name="class"
                value={formData.class}
                onChange={handleChange}
                className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-800"
                required
              >
                <option value="">Select Grade</option>
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map(num => (
                  <option key={num} value={num}>Grade {num}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-200 mb-0.5">
                Section *
              </label>
              <select
                name="section"
                value={formData.section}
                onChange={handleChange}
                className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-800"
                required
              >
                <option value="">Select Section</option>
                {sections.map(sec => (
                  <option key={sec} value={sec}>Section {sec}</option>
                ))}
              </select>
            </div>
            {needsStream && (
              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-200 mb-0.5">
                  Stream *
                </label>
                <select
                  name="stream"
                  value={formData.stream}
                  onChange={handleChange}
                  className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-800"
                  required
                >
                  <option value="">Select Stream</option>
                  <option value="Natural Science">Natural Science</option>
                  <option value="Social Science">Social Science</option>
                </select>
              </div>
            )}
            <div>
              <label className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-200 mb-0.5">
                Roll Number *
              </label>
              <Input
                type="number"
                name="rollNumber"
                value={formData.rollNumber}
                onChange={handleChange}
                placeholder="Enter roll number"
                required
              />
            </div>
          </div>
        </div>

        {/* Parent Information */}
        <div>
          <h3 className="text-sm sm:text-base font-semibold text-gray-800 dark:text-gray-100 mb-2 flex items-center gap-2">
            <User className="w-4 h-4 sm:w-5 sm:h-5 text-purple-600 dark:text-purple-400" />
            Parent/Guardian Information
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5">
            <div>
              <label className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-200 mb-0.5">
                Parent Name *
              </label>
              <Input
                name="parentName"
                value={formData.parentName}
                onChange={handleChange}
                placeholder="Enter parent name"
                required
              />
            </div>
            <div>
              <label className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-200 mb-0.5">
                Parent Phone *
              </label>
              <Input
                type="tel"
                name="parentPhone"
                value={formData.parentPhone}
                onChange={handleChange}
                placeholder="+1 (555) 000-0000"
                required
              />
            </div>
            <div>
              <label className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-200 mb-0.5">
                Parent Email
              </label>
              <Input
                type="email"
                name="parentEmail"
                value={formData.parentEmail}
                onChange={handleChange}
                placeholder="parent@example.com"
              />
            </div>
          </div>
        </div>

        {/* Address */}
        <div>
          <label className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-200 mb-0.5">
            Address
          </label>
          <textarea
            name="address"
            value={formData.address}
            onChange={handleChange}
            placeholder="Enter full address"
            rows={2}
            className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none dark:bg-gray-800"
          />
        </div>
      </form>
    </Modal>
  )
}
