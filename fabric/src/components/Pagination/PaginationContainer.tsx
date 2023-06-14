import * as React from 'react'
import { useUpdateEffect } from '../../utils/useUpdateEffect'
import { PaginationState } from './usePagination'

const PaginationContext = React.createContext<PaginationState>(null as any)

export function usePaginationContext() {
  return React.useContext(PaginationContext)
}

export function PaginationProvider({
  pagination,
  children,
}: {
  pagination: PaginationState
  children: React.ReactNode
}) {
  return <PaginationContext.Provider value={pagination}>{children}</PaginationContext.Provider>
}

function PaginatedContent({ children, scrollToTop }: { children: React.ReactNode; scrollToTop?: boolean }) {
  const pagination = usePaginationContext()
  const ref = React.useRef<HTMLDivElement>(null)

  useUpdateEffect(
    (didUpdate) => {
      if (scrollToTop && didUpdate) {
        ref.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
      }
    },
    [pagination.page]
  )

  return <div ref={ref}>{children}</div>
}

export function PaginationContainer({
  pagination,
  children,
  scrollToTop,
}: {
  pagination: PaginationState
  children: React.ReactNode
  scrollToTop?: boolean
}) {
  return (
    <PaginationProvider pagination={pagination}>
      <PaginatedContent scrollToTop={scrollToTop}>{children}</PaginatedContent>
    </PaginationProvider>
  )
}
