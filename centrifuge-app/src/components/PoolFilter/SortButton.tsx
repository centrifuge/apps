import { IconChevronDown, IconChevronUp, Stack, Tooltip } from '@centrifuge/fabric'
import * as React from 'react'
import { useHistory, useLocation } from 'react-router-dom'
import { SEARCH_KEYS } from './config'
import { FilterButton } from './styles'
import { SortBy } from './types'

export type SortButtonProps = {
  label: string
  searchKey: SortBy
  tooltip?: string
}

type Sorting = {
  isActive: boolean
  direction: string | null
}

export function SortButton({ label, searchKey, tooltip }: SortButtonProps) {
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
        style={{ justifySelf: 'end' }}
      >
        <FilterButton forwardedAs="span" variant="body3">
          {label}

          <Inner sorting={sorting} />
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
      style={{ justifySelf: 'end' }}
    >
      {label}

      <Inner sorting={sorting} />
    </FilterButton>
  )
}

function Inner({ sorting }: { sorting: Sorting }) {
  return (
    <Stack as="span" width="1em">
      <IconChevronUp
        size="1em"
        color={sorting.isActive && sorting.direction === 'asc' ? 'textSelected' : 'textSecondary'}
      />
      <IconChevronDown
        size="1em"
        color={sorting.isActive && sorting.direction === 'desc' ? 'textSelected' : 'textSecondary'}
        style={{ marginTop: '-.4em' }}
      />
    </Stack>
  )
}
