import { Tooltip } from '@centrifuge/fabric'
import * as React from 'react'
import { useHistory, useLocation } from 'react-router-dom'
import { FilterButton } from './FilterButton'
import { SEARCH_KEYS } from './PoolFilter/config'
import { SortChevrons } from './SortChevrons'

export type SortButtonProps = {
  label: string
  searchKey: string
  tooltip?: string
  justifySelf?: 'start' | 'end'
}

type Sorting = {
  isActive: boolean
  direction: string | null
}

export function SortButton({ label, searchKey, tooltip, justifySelf = 'end' }: SortButtonProps) {
  const history = useHistory()
  const { pathname, search } = useLocation()

  const sorting: Sorting = React.useMemo(() => {
    const searchParams = new URLSearchParams(search)

    return {
      isActive: searchParams.get(SEARCH_KEYS.SORT_BY) === searchKey,
      direction: searchParams.get(SEARCH_KEYS.SORT),
    }
  }, [search])

  function handleClick() {
    const restSearchParams = new URLSearchParams(search)
    restSearchParams.delete(SEARCH_KEYS.SORT_BY)
    restSearchParams.delete(SEARCH_KEYS.SORT)

    const searchParams = new URLSearchParams({
      [SEARCH_KEYS.SORT_BY]: searchKey,
      [SEARCH_KEYS.SORT]: sorting.direction === 'asc' ? 'desc' : 'asc',
    })

    history.push({
      pathname,
      search: `?${searchParams}${restSearchParams.size > 0 ? `&${restSearchParams}` : ''}`,
    })
  }

  if (tooltip) {
    return (
      <Tooltip
        body={tooltip}
        onClick={handleClick}
        aria-label={
          !sorting.isActive
            ? `Sort ${label}`
            : sorting.direction === 'asc'
            ? `Sort ${label} descending`
            : `Sort ${label} ascending`
        }
        aria-live
        style={{ justifySelf }}
      >
        <FilterButton forwardedAs="span" variant="body3">
          {label}

          <SortChevrons sorting={sorting} />
        </FilterButton>
      </Tooltip>
    )
  }

  return (
    <FilterButton
      forwardedAs="button"
      variant="body3"
      onClick={handleClick}
      aria-label={
        !sorting.isActive
          ? `Sort ${label}`
          : sorting.direction === 'asc'
          ? `Sort ${label} descending`
          : `Sort ${label} ascending`
      }
      aria-live
      style={{ justifySelf }}
    >
      {label}

      <SortChevrons sorting={sorting} />
    </FilterButton>
  )
}
