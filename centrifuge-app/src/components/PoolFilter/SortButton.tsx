import { IconChevronDown, IconChevronUp, Stack, Text } from '@centrifuge/fabric'
import * as React from 'react'
import { useHistory, useLocation } from 'react-router-dom'
import { SEARCH_KEYS } from './config'
import { SortBy } from './types'

export type SortButtonProps = {
  label: string
  searchKey: SortBy
}

export function SortButton({ label, searchKey }: SortButtonProps) {
  const history = useHistory()
  const { pathname, search } = useLocation()

  const sorting = React.useMemo(() => {
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

  return (
    <Text
      as="button"
      variant="body3"
      onClick={handleClick}
      color={sorting.isActive ? 'green' : 'blue'}
      aria-label={
        !sorting.isActive
          ? `Sort ${label}`
          : sorting.direction === 'asc'
          ? `Sort ${label} descending`
          : `Sort ${label} ascending`
      }
      aria-live
    >
      {label}

      <Stack as="span" width={14}>
        <IconChevronUp size={14} color={sorting.isActive && sorting.direction === 'asc' ? 'green' : 'gray'} />
        <IconChevronDown size={14} color={sorting.isActive && sorting.direction === 'desc' ? 'green' : 'gray'} />
      </Stack>
    </Text>
  )
}
