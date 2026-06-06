export const DEFAULT_PAGE_SIZE = 20

export interface PaginationParams {
  page: number
  limit: number
  offset: number
}

export interface PaginationInfo {
  currentPage: number
  totalPages: number
  totalItems: number
  pageSize: number
  hasNextPage: boolean
  hasPrevPage: boolean
}

export interface VisiblePage {
  id: string
  page: number | null
}

/**
 * Parse pagination params from URL search params
 */
export function getPaginationParams(
  searchParams: URLSearchParams,
  defaultLimit = DEFAULT_PAGE_SIZE
): PaginationParams {
  const page = Math.max(1, Number(searchParams.get('page')) || 1)
  const limit = defaultLimit
  const offset = (page - 1) * limit
  return { page, limit, offset }
}

/**
 * Calculate pagination info from API response
 */
export function getPaginationInfo(total: number, page: number, limit: number): PaginationInfo {
  const totalPages = Math.max(1, Math.ceil(total / limit))
  return {
    currentPage: page,
    totalPages,
    totalItems: total,
    pageSize: limit,
    hasNextPage: page < totalPages,
    hasPrevPage: page > 1,
  }
}

/**
 * Calculate which page numbers to display with ellipsis
 * Returns array of numbers and 'ellipsis' strings
 */
export function getVisiblePages(
  currentPage: number,
  totalPages: number,
  maxVisible = 7
): VisiblePage[] {
  const pageToken = (page: number): VisiblePage => ({ id: `page-${page}`, page })

  if (totalPages <= maxVisible) {
    return Array.from({ length: totalPages }, (_, i) => pageToken(i + 1))
  }

  const pages: VisiblePage[] = []
  const sideCount = Math.floor((maxVisible - 3) / 2)

  // Always include first page
  pages.push(pageToken(1))

  // Calculate range around current page
  let rangeStart = Math.max(2, currentPage - sideCount)
  let rangeEnd = Math.min(totalPages - 1, currentPage + sideCount)

  // Adjust if at the start
  if (currentPage <= sideCount + 2) {
    rangeEnd = maxVisible - 2
    rangeStart = 2
  }

  // Adjust if at the end
  if (currentPage >= totalPages - sideCount - 1) {
    rangeStart = totalPages - maxVisible + 3
    rangeEnd = totalPages - 1
  }

  // Add ellipsis before range if needed
  if (rangeStart > 2) {
    pages.push({ id: 'ellipsis-left', page: null })
  }

  // Add range pages
  for (let i = rangeStart; i <= rangeEnd; i++) {
    pages.push(pageToken(i))
  }

  // Add ellipsis after range if needed
  if (rangeEnd < totalPages - 1) {
    pages.push({ id: 'ellipsis-right', page: null })
  }

  // Always include last page
  pages.push(pageToken(totalPages))

  return pages
}
