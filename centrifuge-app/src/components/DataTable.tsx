import {
  Box,
  Card,
  Checkbox,
  Divider,
  IconArrowDown,
  IconFilter,
  Menu,
  Popover,
  Shelf,
  Stack,
  Text,
  Tooltip,
} from '@centrifuge/fabric'
import css from '@styled-system/css'
import BN from 'bn.js'
import * as React from 'react'
import { Link, LinkProps } from 'react-router-dom'
import styled from 'styled-components'
import { useElementScrollSize } from '../utils/useElementScrollSize'
import { FiltersState } from '../utils/useFilters'
import { FilterButton, QuickAction } from './PoolFilter/styles'

type GroupedProps = {
  groupIndex?: number
  lastGroupIndex?: number
}

export type DataTableProps<T = any> = {
  data: Array<T>
  columns: Column[]
  keyField?: string
  onRowClicked?: (row: T) => string | LinkProps['to']
  defaultSortKey?: string
  defaultSortOrder?: OrderBy
  rounded?: boolean
  hoverable?: boolean
  summary?: T
  pageSize?: number
  page?: number
} & GroupedProps

export type OrderBy = 'asc' | 'desc'

export type Column = {
  header: string | React.ReactElement
  cell: (row: any, index: number) => React.ReactNode
  align?: string
  flex?: string
  sortKey?: string
  width?: string
}
const sorter = <T extends Record<string, any>>(data: Array<T>, order: OrderBy, sortKey?: string) => {
  if (!sortKey) return data
  if (order === 'asc') {
    return data.sort((a, b) => {
      if (sortKey === 'nftIdSortKey') return new BN(a[sortKey]).gt(new BN(b[sortKey])) ? 1 : -1
      return a[sortKey] > b[sortKey] ? 1 : -1
    })
  }
  return data.sort((a, b) => {
    if (sortKey === 'nftIdSortKey') return new BN(b[sortKey]).gt(new BN(a[sortKey])) ? 1 : -1
    return b[sortKey] > a[sortKey] ? 1 : -1
  })
}

export const DataTable = <T extends Record<string, any>>({
  data,
  columns,
  keyField,
  onRowClicked,
  defaultSortKey,
  rounded = true,
  hoverable = false,
  summary,
  groupIndex,
  lastGroupIndex,
  defaultSortOrder = 'desc',
  pageSize = Infinity,
  page = 1,
}: DataTableProps<T>) => {
  const [orderBy, setOrderBy] = React.useState<Record<string, OrderBy>>(
    defaultSortKey ? { [defaultSortKey]: defaultSortOrder } : {}
  )

  const [currentSortKey, setCurrentSortKey] = React.useState(defaultSortKey || '')
  const ref = React.useRef(null)
  const { scrollWidth } = useElementScrollSize(ref)

  const updateSortOrder = (sortKey: Column['sortKey']) => {
    if (!sortKey) return
    const updatedOrderBy = orderBy[sortKey] === 'desc' ? 'asc' : 'desc'
    setOrderBy({ [sortKey]: updatedOrderBy })
    setCurrentSortKey(sortKey)
  }

  const sortedAndPaginatedData = React.useMemo(() => {
    const sortedData = sorter([...data], orderBy[currentSortKey], currentSortKey)
    return sortedData.slice((page - 1) * pageSize, page * pageSize)
  }, [orderBy, data, currentSortKey, page, pageSize])

  const showHeader = groupIndex === 0 || !groupIndex

  return (
    <Stack ref={ref} as={rounded && !lastGroupIndex ? Card : Stack} minWidth={scrollWidth > 0 ? scrollWidth : 'auto'}>
      <Shelf>
        {showHeader &&
          columns.map((col, i) => (
            <HeaderCol
              key={i}
              style={{ flex: col.flex }}
              tabIndex={col?.sortKey ? 0 : undefined}
              as={col?.sortKey ? 'button' : 'div'}
              onClick={col?.sortKey ? () => updateSortOrder(col.sortKey) : () => undefined}
              align={col?.align}
            >
              <Text variant="label2">
                {col?.header && typeof col.header !== 'string' && col?.sortKey && React.isValidElement(col.header)
                  ? React.cloneElement(col.header as React.ReactElement<any>, {
                      align: col?.align,
                      orderBy: orderBy[col.sortKey],
                    })
                  : col.header}
              </Text>
            </HeaderCol>
          ))}
      </Shelf>
      <Stack>
        {sortedAndPaginatedData?.map((row, i) => (
          <Row
            rounded={rounded}
            hoverable={hoverable}
            as={onRowClicked ? Link : 'div'}
            to={onRowClicked && (() => onRowClicked(row))}
            key={keyField ? row[keyField] : i}
            tabIndex={onRowClicked ? 0 : undefined}
          >
            {columns.map((col, index) => (
              <DataCol
                variant="body2"
                style={{ flex: col.width !== undefined ? 'auto' : col.flex, width: col.width }}
                align={col?.align}
                key={index}
              >
                {col.cell(row, i)}
              </DataCol>
            ))}
          </Row>
        ))}
        {/* summary row is not included in sorting */}
        {summary && (
          <Row rounded={rounded && groupIndex === lastGroupIndex}>
            {columns.map((col, i) => (
              <DataCol variant="body2" key={`${col.sortKey}-${i}`} style={{ flex: col.flex }} align={col?.align}>
                {col.cell(summary, i)}
              </DataCol>
            ))}
          </Row>
        )}
      </Stack>
    </Stack>
  )
}

const Row = styled(Shelf)<any>`
  ${({ rounded, hoverable, as: comp }) =>
    css({
      height: '48px',
      width: '100%',
      appearance: 'none',
      border: 'none',
      borderBottomStyle: 'solid',
      borderBottomWidth: '1px',
      borderBottomColor: 'borderPrimary',
      backgroundColor: 'transparent',
      // using a&:hover caused the background sometimes not to update when switching themes
      '&:hover':
        comp === Link
          ? {
              backgroundColor: 'secondarySelectedBackground',
              cursor: 'pointer',
            }
          : hoverable
          ? {
              backgroundColor: 'secondarySelectedBackground',
            }
          : undefined,
      '&:focus-visible': {
        boxShadow: 'inset 0 0 0 3px var(--fabric-color-focus)',
      },
      '&:last-child': rounded
        ? {
            borderBottomLeftRadius: 'card',
            borderBottomRightRadius: 'card',
          }
        : {},
    })}
`

const DataCol = styled(Text)<{ align: Column['align'] }>`
  background: initial;
  border: none;
  padding: 8px 0 8px 16px;
  display: flex;
  flex: 1 1 160px;
  max-width: 100%;
  overflow: hidden;
  white-space: nowrap;

  &:first-child {
    padding-right: 16px;
  }
  ${({ align }) => {
    switch (align) {
      case 'left':
        return css({
          justifyContent: 'flex-start',
          '&:last-child': {
            paddingRight: 16,
          },
        })
      case 'center':
        return css({
          justifyContent: 'center',
          '&:last-child': {
            paddingRight: 16,
          },
        })
      case 'right':
      default:
        return css({
          textAlign: 'right',
          justifyContent: 'flex-end',

          '&:last-child': {
            paddingRight: 16,
          },
        })
    }
  }}
`

const HeaderCol = styled(DataCol)`
  height: 48px;
  align-items: center;
`

export function SortableTableHeader({
  label,
  orderBy,
  align,
}: {
  label: string
  orderBy?: OrderBy
  align?: Column['align']
}) {
  return (
    <StyledHeader>
      {(!align || align === 'right') && (
        <IconArrowDown
          color={orderBy ? 'currentColor' : 'transparent'}
          size={16}
          style={{ transform: orderBy === 'asc' ? 'rotate(180deg)' : 'rotate(0deg)' }}
        />
      )}
      {label}
      {align && (align === 'left' || align === 'center') && (
        <IconArrowDown
          color={orderBy ? 'currentColor' : 'transparent'}
          size={16}
          style={{ transform: orderBy === 'asc' ? 'rotate(180deg)' : 'rotate(0deg)' }}
        />
      )}
    </StyledHeader>
  )
}

export function FilterableTableHeader({
  filterKey: key,
  label,
  options,
  filters,
  align,
  tooltip,
}: {
  filterKey: string
  label: string
  options: string[] | Record<string, string>
  filters: FiltersState
  align?: Column['align']
  tooltip?: string
}) {
  const optionKeys = Array.isArray(options) ? options : Object.keys(options)
  const form = React.useRef<HTMLFormElement>(null)

  function handleChange() {
    if (!form.current) return
    const formData = new FormData(form.current)
    const entries = formData.getAll(key) as string[]
    console.log('entries', entries)
    filters.setFilter(key, entries)
  }

  function deselectAll() {
    filters.setFilter(key, [])
  }

  function selectAll() {
    filters.setFilter(key, optionKeys)
  }
  const state = filters.getState()
  const selectedOptions = state[key] as Set<string> | undefined
  console.log('state', state)

  return (
    <Box position="relative">
      <Popover
        placement="bottom left"
        renderTrigger={(props, ref, state) => {
          return (
            <Box ref={ref}>
              {tooltip ? (
                <Tooltip body={tooltip} {...props} style={{ display: 'block' }}>
                  <FilterButton forwardedAs="span" variant="body3">
                    {label}
                    <IconFilter color={selectedOptions?.size ? 'textSelected' : 'textSecondary'} size="1em" />
                  </FilterButton>
                </Tooltip>
              ) : (
                <FilterButton forwardedAs="button" type="button" variant="body3" {...props}>
                  {label}
                  <IconFilter color={selectedOptions?.size ? 'textSelected' : 'textSecondary'} size="1em" />
                </FilterButton>
              )}
            </Box>
          )
        }}
        renderContent={(props, ref) => (
          <Box {...props} ref={ref}>
            <Menu width={300}>
              <Stack as="form" ref={form} p={[2, 3]} gap={2}>
                <Stack as="fieldset" borderWidth={0} gap={2}>
                  <Box as="legend" className="visually-hidden">
                    Filter {label} by:
                  </Box>
                  {optionKeys.map((option, index) => {
                    const label = Array.isArray(options) ? option : options[option]
                    const checked = filters.hasFilter(key, option)
                    console.log('checked', filters.hasFilter(key, option))
                    return (
                      <Checkbox
                        key={index}
                        name={key}
                        value={option}
                        onChange={handleChange}
                        checked={checked}
                        label={label}
                        extendedClickArea
                      />
                    )
                  })}
                </Stack>

                <Divider borderColor="textPrimary" />

                {selectedOptions?.size === optionKeys.length ? (
                  <QuickAction variant="body1" forwardedAs="button" type="button" onClick={() => deselectAll()}>
                    Deselect all
                  </QuickAction>
                ) : (
                  <QuickAction variant="body1" forwardedAs="button" type="button" onClick={() => selectAll()}>
                    Select all
                  </QuickAction>
                )}
              </Stack>
            </Menu>
          </Box>
        )}
      />
    </Box>
  )
}

const StyledHeader = styled(Shelf)`
  color: ${({ theme }) => theme.colors.textSecondary};

  &:hover,
  &:hover > svg {
    cursor: pointer;
    color: ${({ theme }) => theme.colors.textInteractiveHover};
  }
`
