import { Card, IconArrowDown, Shelf, Stack, Text } from '@centrifuge/fabric'
import css from '@styled-system/css'
import * as React from 'react'
import styled from 'styled-components'

type GroupedProps = {
  groupIndex?: number
  lastGroupIndex?: number
}

type Props<T> = {
  data: Array<T>
  columns: Column[]
  keyField?: string
  onRowClicked?: (row: T) => void
  defaultSortKey?: string
  rounded?: boolean
  summary?: T
} & GroupedProps

export type OrderBy = 'asc' | 'desc'

export type Column = {
  header: string | (() => React.ReactElement)
  cell: (row: any, index: number) => React.ReactNode
  align?: string
  flex?: string
  sortKey?: string
}
const sorter = <T extends Record<string, any>>(data: Array<T>, order: OrderBy, sortKey?: string) => {
  if (!sortKey) return data
  if (order === 'asc') {
    return data.sort((a, b) => (a[sortKey] > b[sortKey] ? 1 : -1))
  }
  return data.sort((a, b) => (b[sortKey] > a[sortKey] ? 1 : -1))
}

export const DataTable = <T extends Record<string, any>>({
  data,
  columns,
  keyField,
  onRowClicked,
  defaultSortKey,
  rounded = true,
  summary,
  groupIndex,
  lastGroupIndex,
}: Props<T>) => {
  const [orderBy, setOrderBy] = React.useState<Record<string, OrderBy>>(
    defaultSortKey ? { [defaultSortKey]: 'desc' } : {}
  )
  const [currentSortKey, setCurrentSortKey] = React.useState(defaultSortKey || '')

  const updateSortOrder = (sortKey: Column['sortKey']) => {
    if (!sortKey) return
    const updatedOrderBy = orderBy[sortKey] === 'desc' ? 'asc' : 'desc'
    setOrderBy({ [sortKey]: updatedOrderBy })
    setCurrentSortKey(sortKey)
  }

  const sortedData = React.useMemo(
    () => sorter([...data], orderBy[currentSortKey], currentSortKey),
    [orderBy, data, currentSortKey]
  )

  const showHeader = groupIndex === 0 || !groupIndex
  return (
    <Stack as={rounded && !lastGroupIndex ? Card : Stack}>
      <Shelf>
        {showHeader &&
          columns.map((col, i) => (
            <HeaderCol
              key={`${col.header}-${i}`}
              style={{ flex: col.flex }}
              tabIndex={col?.sortKey ? 0 : undefined}
              as={col?.sortKey ? 'button' : 'div'}
              onClick={col?.sortKey ? () => updateSortOrder(col.sortKey) : () => undefined}
              align={col?.align}
            >
              <Text variant="label2">
                {col?.header && typeof col.header !== 'string' && col?.sortKey && React.isValidElement(col.header())
                  ? React.cloneElement(col.header(), { align: col?.align, orderBy: orderBy[col.sortKey] })
                  : col.header}
              </Text>
            </HeaderCol>
          ))}
      </Shelf>
      <Stack>
        {sortedData?.map((row, i) => (
          <Row
            rounded={rounded}
            as={onRowClicked ? 'button' : 'div'}
            key={keyField ? row[keyField] : i}
            onClick={onRowClicked && (() => onRowClicked(row))}
            tabIndex={onRowClicked ? 0 : undefined}
          >
            {columns.map((col) => (
              <DataCol style={{ flex: col.flex }} align={col?.align} key={`${col.header}-${i}`}>
                {col.cell(row, i)}
              </DataCol>
            ))}
          </Row>
        ))}
        {/* summary row is not included in sorting */}
        {summary && (
          <Row rounded={rounded && groupIndex === lastGroupIndex}>
            {columns.map((col, i) => (
              <DataCol key={`${col.sortKey}-${i}`} style={{ flex: col.flex }} align={col?.align}>
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
  ${({ rounded }) =>
    css({
      width: '100%',
      appearance: 'none',
      border: 'none',
      borderBottom: '1px solid',
      borderBottomColor: 'borderPrimary',
      backgroundColor: 'transparent',
      'button&:hover': {
        backgroundColor: 'backgroundSecondary',
        cursor: 'pointer',
      },
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

const DataCol = styled.div<{ align: Column['align'] }>`
  background: initial;
  border: none;
  padding: 8px 0 8px 16px;
  display: flex;
  flex: 1 1 160px;
  max-width: 100%;
  overflow: hidden;

  button&:hover {
    cursor: pointer;
  }
  &:first-child {
    padding-right: '16px';
  }
  ${({ align }) => {
    switch (align) {
      case 'left':
        return css({
          justifyContent: 'flex-start',
          '&:last-child': {
            paddingRight: '16px',
          },
        })
      case 'center':
        return css({
          justifyContent: 'center',
          '&:last-child': {
            paddingRight: '16px',
          },
        })
      case 'right':
      default:
        return css({
          textAlign: 'right',
          justifyContent: 'flex-end',

          '&:last-child': {
            paddingRight: '16px',
          },
        })
    }
  }}
`

const HeaderCol = styled(DataCol)``

export const SortableTableHeader: React.VFC<{ label: string; orderBy?: OrderBy; align?: Column['align'] }> = ({
  label,
  orderBy,
  align,
}) => {
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

const StyledHeader = styled(Shelf)`
  color: ${({ theme }) => theme.colors.textSecondary};

  &:hover,
  &:hover > svg {
    color: ${({ theme }) => theme.colors.textInteractiveHover};
  }
`
