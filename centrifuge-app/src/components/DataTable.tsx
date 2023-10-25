import { Grid, IconChevronDown, IconChevronUp, Shelf, Stack, Text } from '@centrifuge/fabric'
import css from '@styled-system/css'
import BN from 'bn.js'
import * as React from 'react'
import { Link, LinkProps } from 'react-router-dom'
import styled from 'styled-components'
import { useElementScrollSize } from '../utils/useElementScrollSize'

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

  const templateColumns = `[start] ${columns.map((col) => col.width ?? 'minmax(min-content, 1fr)').join(' ')} [end]`

  return (
    <TableGrid
      gridTemplateColumns={templateColumns}
      gridAutoRows="auto"
      gap={0}
      rowGap={0}
      ref={ref}
      minWidth={scrollWidth > 0 ? scrollWidth : 'auto'}
    >
      {showHeader && (
        <HeaderRow>
          {columns.map((col, i) => (
            <HeaderCol key={i} align={col?.align}>
              <Text variant="body3">
                {col?.header && typeof col.header !== 'string' && col?.sortKey && React.isValidElement(col.header)
                  ? React.cloneElement(col.header as React.ReactElement<any>, {
                      orderBy: orderBy[col.sortKey],
                      onClick: () => updateSortOrder(col.sortKey),
                    })
                  : col.header}
              </Text>
            </HeaderCol>
          ))}
        </HeaderRow>
      )}
      {sortedAndPaginatedData?.map((row, i) => (
        <DataRow
          hoverable={hoverable}
          as={onRowClicked ? Link : 'div'}
          to={onRowClicked && (() => onRowClicked(row))}
          key={keyField ? row[keyField] : i}
          tabIndex={onRowClicked ? 0 : undefined}
        >
          {columns.map((col, index) => (
            <DataCol variant="body2" align={col?.align} key={index}>
              {col.cell(row, i)}
            </DataCol>
          ))}
        </DataRow>
      ))}
      {/* summary row is not included in sorting */}
      {summary && (
        <DataRow>
          {columns.map((col, i) => (
            <DataCol variant="body2" key={`${col.sortKey}-${i}`} align={col?.align}>
              {col.cell(summary, i)}
            </DataCol>
          ))}
        </DataRow>
      )}
      {groupIndex != null && groupIndex !== lastGroupIndex && (
        <Row>
          <DataCol />
        </Row>
      )}
    </TableGrid>
  )
}

const TableGrid = styled(Grid)``

const Row = styled('div')`
  display: grid;
  grid-template-columns: subgrid;
  grid-column: start / end;
  box-shadow: ${({ theme }) => `-1px 0 0 0 ${theme.colors.borderSecondary}, 1px 0 0 0 ${theme.colors.borderSecondary}`};
`

const HeaderRow = styled(Row)(
  css({
    backgroundColor: 'backgroundSecondary',
    borderStyle: 'solid',
    borderWidth: '1px 0',
    borderColor: 'borderSecondary',
  })
)

const DataRow = styled(Row)<any>`
  ${({ hoverable, as: comp }) =>
    css({
      width: '100%',
      borderBottomStyle: 'solid',
      borderBottomWidth: '1px',
      borderBottomColor: 'borderSecondary',
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
    })}
`

const DataCol = styled(Text)<{ align: Column['align'] }>`
  background: initial;
  border: none;
  padding: 8px 16px;
  display: flex;
  align-items: center;
  flex: 1;
  max-width: 100%;
  min-width: 0;
  overflow: hidden;
  white-space: nowrap;

  ${({ align }) => {
    switch (align) {
      case 'left':
        return css({
          justifyContent: 'flex-start',
        })
      case 'center':
        return css({
          justifyContent: 'center',
        })
      case 'right':
      default:
        return css({
          textAlign: 'right',
          justifyContent: 'flex-end',
        })
    }
  }}
`

const HeaderCol = styled(DataCol)`
  height: 32px;
  align-items: center;

  &:has(:focus-visible) {
    box-shadow: inset 0 0 0 3px var(--fabric-color-focus);
  }
`

export function SortableTableHeader({
  label,
  orderBy,
  onClick,
}: {
  label: string
  orderBy?: OrderBy
  onClick?: () => void
}) {
  return (
    <StyledHeader gap="4px" as="button" onClick={onClick}>
      {label}
      <Stack>
        {(orderBy === 'asc' || !orderBy) && <IconChevronUp size={14} style={{ marginBottom: !orderBy ? -3.5 : 0 }} />}
        {(orderBy === 'desc' || !orderBy) && <IconChevronDown size={14} style={{ marginTop: !orderBy ? -3.5 : 0 }} />}
      </Stack>
    </StyledHeader>
  )
}

const StyledHeader = styled(Shelf)`
  color: ${({ theme }) => theme.colors.textSecondary};
  cursor: pointer;
  appearance: none;
  border: none;
  background: transparent;

  &:hover,
  &:focus-visible {
    cursor: pointer;
    color: ${({ theme }) => theme.colors.textInteractiveHover};
  }
`
