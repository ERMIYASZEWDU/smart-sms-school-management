import React from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { getPageNumbers } from '../../utils/pagination'

/**
 * Pagination Component
 * Displays page numbers and navigation controls
 */
export const Pagination = ({ 
  currentPage, 
  totalPages, 
  onPageChange,
  maxVisible = 5,
  showInfo = true,
  startIndex,
  endIndex,
  total,
  className = ''
}) => {
  const pageNumbers = getPageNumbers(currentPage, totalPages, maxVisible)

  const handlePageClick = (page) => {
    if (page !== '...' && page !== currentPage) {
      onPageChange(page)
    }
  }

  const handlePrevious = () => {
    if (currentPage > 1) {
      onPageChange(currentPage - 1)
    }
  }

  const handleNext = () => {
    if (currentPage < totalPages) {
      onPageChange(currentPage + 1)
    }
  }

  if (totalPages <= 1) return null

  return (
    <div className={`flex items-center justify-between ${className}`}>
      {/* Info */}
      {showInfo && startIndex && endIndex && total && (
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Showing <span className="font-medium">{startIndex}</span> to{' '}
          <span className="font-medium">{endIndex}</span> of{' '}
          <span className="font-medium">{total}</span> results
        </p>
      )}

      {/* Navigation */}
      <nav className={`flex items-center gap-1 ${!showInfo ? 'w-full justify-center' : ''}`}>
        {/* Previous Button */}
        <button
          onClick={handlePrevious}
          disabled={currentPage === 1}
          className="p-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          aria-label="Previous page"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>

        {/* Page Numbers */}
        {pageNumbers.map((page, index) => {
          if (page === '...') {
            return (
              <span 
                key={`ellipsis-${index}`}
                className="px-3 py-2 text-gray-500 dark:text-gray-400"
              >
                ...
              </span>
            )
          }

          return (
            <button
              key={page}
              onClick={() => handlePageClick(page)}
              className={`min-w-[40px] px-3 py-2 rounded-lg border transition-colors ${
                page === currentPage
                  ? 'border-blue-600 bg-blue-600 text-white'
                  : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
              }`}
              aria-label={`Page ${page}`}
              aria-current={page === currentPage ? 'page' : undefined}
            >
              {page}
            </button>
          )
        })}

        {/* Next Button */}
        <button
          onClick={handleNext}
          disabled={currentPage === totalPages}
          className="p-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          aria-label="Next page"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </nav>
    </div>
  )
}

/**
 * Simple Pagination (Previous/Next only)
 */
export const SimplePagination = ({
  hasNextPage,
  hasPrevPage,
  onNext,
  onPrevious,
  className = ''
}) => {
  return (
    <div className={`flex items-center justify-between ${className}`}>
      <button
        onClick={onPrevious}
        disabled={!hasPrevPage}
        className="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
      >
        <ChevronLeft className="w-4 h-4" />
        Previous
      </button>
      
      <button
        onClick={onNext}
        disabled={!hasNextPage}
        className="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
      >
        Next
        <ChevronRight className="w-4 h-4" />
      </button>
    </div>
  )
}
