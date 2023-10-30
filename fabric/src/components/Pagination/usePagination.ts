import * as React from 'react'
import { useControlledState } from '../../utils/useControlledState'
import { useEventCallback } from '../../utils/useEventCallback'

export type PaginationProps = {
  manual?: boolean
  data?: any[]
  totalSize?: number
  page?: number
  pageSize?: number
  onPageChange?: (page: number) => void
  initialPage?: number
  onPageSizeChange?: (size: number) => void
}

export function usePagination({
  /**
   * When `manual` is `true`, it indicates that the component implementing this hook is fetching data for each page,
   * So `data` represents data only for the current page.
   */
  manual,
  data = [],
  totalSize = data.length,
  page: pageProp,
  pageSize: pageSizeProp,
  onPageChange,
  initialPage = 1,
  onPageSizeChange,
}: PaginationProps) {
  const [page, setPage] = useControlledState(initialPage, pageProp, onPageChange)
  const [pageSize, setPageSize] = useControlledState(10, pageSizeProp, onPageSizeChange)

  const pageData = React.useMemo(() => {
    if (manual) {
      return data
    }
    const pageStart = pageSize * (page - 1)
    const pageEnd = pageStart + pageSize

    return data.slice(pageStart, pageEnd)
  }, [data, manual, page, pageSize])

  const pageCount = Math.max(Math.ceil(totalSize / pageSize), 1)

  const itemCountOnPage = totalSize ? Math.min(pageSize, totalSize - pageSize * (page - 1)) : pageSize

  const goToPrevious = useEventCallback(() => {
    setPage(Math.max(page - 1, 1))
  })

  const goToNext = useEventCallback(() => {
    setPage(Math.min(page + 1, pageCount))
  })

  const goToFirst = useEventCallback(() => {
    setPage(1)
  })

  const goToLast = useEventCallback(() => {
    setPage(pageCount)
  })

  const goToPage = useEventCallback((n: number) => {
    if (n >= 1 && n <= pageCount && n !== page) {
      setPage(n)
    }
  })

  React.useEffect(() => {
    if (page > pageCount) setPage(1)
  }, [pageCount, page])

  const canPreviousPage = page > 1
  const canNextPage = page < pageCount

  return {
    pageData,
    page,
    pageSize,
    pageCount,
    canPreviousPage,
    canNextPage,
    goToPage,
    setPageSize,
    goToPrevious,
    goToNext,
    goToFirst,
    goToLast,
    itemCountOnPage,
    totalSize,
  }
}

export type PaginationState = ReturnType<typeof usePagination>
