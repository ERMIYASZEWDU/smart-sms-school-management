import React, { useState } from 'react'
import { Modal } from './Modal'
import { Button } from './Button'
import { Input } from './Input'
import { DollarSign, CreditCard, Receipt } from 'lucide-react'

export const CollectFeesModal = ({ isOpen, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    studentName: '',
    studentId: '',
    class: '',
    feeType: '',
    amount: '',
    paymentMethod: '',
    transactionId: '',
    remarks: ''
  })

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    onSave({
      ...formData,
      receiptNumber: `RCP${Date.now()}`,
      date: new Date().toISOString(),
      status: 'paid'
    })
    setFormData({
      studentName: '',
      studentId: '',
      class: '',
      feeType: '',
      amount: '',
      paymentMethod: '',
      transactionId: '',
      remarks: ''
    })
    onClose()
  }

  const feeTypes = [
    'Tuition Fee',
    'Admission Fee',
    'Exam Fee',
    'Library Fee',
    'Sports Fee',
    'Transportation Fee',
    'Lab Fee',
    'Annual Fee',
    'Other'
  ]

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Collect Fees" size="lg">
      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Student Information */}
        <div>
          <h3 className="text-sm sm:text-base font-semibold text-gray-800 dark:text-gray-100 mb-3 flex items-center gap-2">
            <Receipt className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600 dark:text-blue-400" />
            Student Information
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
            <div>
              <label className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-200 mb-1.5">
                Student ID *
              </label>
              <Input
                name="studentId"
                value={formData.studentId}
                onChange={handleChange}
                placeholder="Enter student ID"
                required
              />
            </div>
            <div>
              <label className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-200 mb-1.5">
                Student Name *
              </label>
              <Input
                name="studentName"
                value={formData.studentName}
                onChange={handleChange}
                placeholder="Enter student name"
                required
              />
            </div>
            <div>
              <label className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-200 mb-1.5">
                Class *
              </label>
              <select
                name="class"
                value={formData.class}
                onChange={handleChange}
                className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-800"
                required
              >
                <option value="">Select Class</option>
                {['9-A', '9-B', '10-A', '10-B', '11-Science', '11-Arts', '12-Science', '12-Arts'].map(cls => (
                  <option key={cls} value={cls}>Class {cls}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Fee Details */}
        <div>
          <h3 className="text-sm sm:text-base font-semibold text-gray-800 dark:text-gray-100 mb-3 flex items-center gap-2">
            <DollarSign className="w-4 h-4 sm:w-5 sm:h-5 text-green-600 dark:text-green-400" />
            Fee Details
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
            <div>
              <label className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-200 mb-1.5">
                Fee Type *
              </label>
              <select
                name="feeType"
                value={formData.feeType}
                onChange={handleChange}
                className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-800"
                required
              >
                <option value="">Select Fee Type</option>
                {feeTypes.map(type => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-200 mb-1.5">
                Amount ($) *
              </label>
              <Input
                type="number"
                name="amount"
                value={formData.amount}
                onChange={handleChange}
                placeholder="Enter amount"
                required
              />
            </div>
          </div>
        </div>

        {/* Payment Information */}
        <div>
          <h3 className="text-sm sm:text-base font-semibold text-gray-800 dark:text-gray-100 mb-3 flex items-center gap-2">
            <CreditCard className="w-4 h-4 sm:w-5 sm:h-5 text-purple-600 dark:text-purple-400" />
            Payment Information
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
            <div>
              <label className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-200 mb-1.5">
                Payment Method *
              </label>
              <select
                name="paymentMethod"
                value={formData.paymentMethod}
                onChange={handleChange}
                className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-800"
                required
              >
                <option value="">Select Method</option>
                <option value="cash">Cash</option>
                <option value="card">Credit/Debit Card</option>
                <option value="bank_transfer">Bank Transfer</option>
                <option value="cheque">Cheque</option>
                <option value="online">Online Payment</option>
              </select>
            </div>
            <div>
              <label className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-200 mb-1.5">
                Transaction ID
              </label>
              <Input
                name="transactionId"
                value={formData.transactionId}
                onChange={handleChange}
                placeholder="Enter transaction ID (if applicable)"
              />
            </div>
          </div>
        </div>

        {/* Remarks */}
        <div>
          <label className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-200 mb-1.5">
            Remarks
          </label>
          <textarea
            name="remarks"
            value={formData.remarks}
            onChange={handleChange}
            placeholder="Additional notes..."
            rows={2}
            className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none dark:bg-gray-800"
          />
        </div>

        {/* Summary */}
        {formData.amount && (
          <div className="p-3 sm:p-4 bg-green-50 dark:bg-green-900/30 border-2 border-green-200 dark:border-green-900/50 rounded-lg">
            <div className="flex justify-between items-center">
              <span className="text-sm sm:text-lg font-semibold text-gray-800 dark:text-gray-100">Total Amount:</span>
              <span className="text-xl sm:text-2xl font-bold text-green-600 dark:text-green-400">${formData.amount}</span>
            </div>
          </div>
        )}

        {/* Footer Buttons - Always visible */}
        <div className="flex flex-col-reverse sm:flex-row justify-end gap-2 sm:gap-3 pt-4 border-t border-gray-200 dark:border-gray-700 -mx-4 sm:-mx-6 px-4 sm:px-6 pb-2 bg-gray-50 dark:bg-gray-900 sticky bottom-0">
          <Button type="button" variant="secondary" onClick={onClose} className="w-full sm:w-auto">
            Cancel
          </Button>
          <Button type="submit" className="w-full sm:w-auto">
            Collect Fee & Generate Receipt
          </Button>
        </div>
      </form>
    </Modal>
  )
}
