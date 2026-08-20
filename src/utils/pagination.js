/**
 * Pagination Utilities
 * Helper functions for handling paginated data
 */

/**
 * Calculate pagination info
 */
export const getPaginationInfo = (page, limit, total) => {
  const totalPages = Math.ceil(total / limit)
  const hasNextPage = page < totalPages
  const hasPrevPage = page > 1

  return {
    page,
    limit,
    total,
    totalPages,
    hasNextPage,
    hasPrevPage,
    startIndex: (page - 1) * limit + 1,
    endIndex: Math.min(page * limit, total)
  }
}

/**
 * Generate page numbers for pagination UI
 */
export const getPageNumbers = (currentPage, totalPages, maxVisible = 5) => {
  const pages = []
  
  if (totalPages <= maxVisible) {
    // Show all pages if total is less than max visible
    for (let i = 1; i <= totalPages; i++) {
      pages.push(i)
    }
  } else {
    // Calculate range around current page
    let start = Math.max(1, currentPage - Math.floor(maxVisible / 2))
    let end = Math.min(totalPages, start + maxVisible - 1)
    
    // Adjust start if end is at maximum
    if (end === totalPages) {
      start = Math.max(1, end - maxVisible + 1)
    }
    
    // Add first page and ellipsis if needed
    if (start > 1) {
      pages.push(1)
      if (start > 2) {
        pages.push('...')
      }
    }
    
    // Add page numbers in range
    for (let i = start; i <= end; i++) {
      pages.push(i)
    }
    
    // Add ellipsis and last page if needed
    if (end < totalPages) {
      if (end < totalPages - 1) {
        pages.push('...')
      }
      pages.push(totalPages)
    }
  }
  
  return pages
}

/**
 * Parse pagination params from query string
 */
export const parsePaginationParams = (searchParams) => {
  return {
    page: parseInt(searchParams.get('page')) || 1,
    limit: parseInt(searchParams.get('limit')) || 20
  }
}

/**
 * Build pagination query string
 */
export const buildPaginationQuery = (page, limit, additionalParams = {}) => {
  const params = new URLSearchParams({
    page: page.toString(),
    limit: limit.toString(),
    ...additionalParams
  })
  return params.toString()
}
