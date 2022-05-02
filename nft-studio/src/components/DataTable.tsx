import { Card, Shelf, Stack, Text } from '@centrifuge/fabric'
import css from '@styled-system/css'
import * as React from 'react'
import styled from 'styled-components'

type Props<T> = {
  data: Array<T>
  columns: Column[]
  keyField?: string
  onRowClicked?: (row: T) => void
  defaultSortKey?: string
  rounded?: boolean
}

export type OrderBy = 'asc' | 'desc'

export type Column = {
  header: string | ((orderBy: OrderBy) => React.ReactNode)
  cell: (row: any, index: number) => React.ReactNode
  align?: string
  flex?: string
  sortKey?: string
}
const sorter = <T extends Record<string, any>>(data: Array<T>, order: OrderBy, sortKey?: string) => {
  if (!sortKey) return data
  if (order === 'asc') {
    return data.sort((a, b) => a[sortKey] - b[sortKey])
  }
  return data.sort((a, b) => b[sortKey] - a[sortKey])
}

export const DataTable = <T extends Record<string, any>>({
  data,
  columns,
  keyField,
  onRowClicked,
  defaultSortKey,
  rounded = true,
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

  return (
    <Stack>
      <Shelf>
        {columns.map((col, i) => (
          <HeaderCol
            key={`${col.header}-${i}`}
            style={{ flex: col.flex }}
            tabIndex={col?.sortKey ? 0 : undefined}
            as={col?.sortKey ? 'button' : 'div'}
            onClick={col?.sortKey ? () => updateSortOrder(col.sortKey) : () => undefined}
            align={col?.align}
          >
            <Text variant="label2">
              {typeof col?.header !== 'string' && col?.sortKey ? col.header(orderBy[col.sortKey]) : col.header}
            </Text>
          </HeaderCol>
        ))}
      </Shelf>
      <Stack as={rounded ? Card : Stack}>
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
      </Stack>
    </Stack>
  )
}

const Row = styled(Shelf)<any>`
  ${({ rounded }) =>
    css({
      width: '100%',
      height: '48px',
      appearance: 'none',
      border: 'none',
      backgroundColor: 'transparent',
      '&:not(:last-child)': {
        borderWidth: '0 0 1px',
        borderStyle: 'solid',
        borderColor: 'borderPrimary',
      },
      'button&:hover': {
        backgroundColor: 'backgroundSecondary',
        cursor: 'pointer',
      },
      '&:focus-visible': {
        boxShadow: 'inset 0 0 0 3px var(--fabric-color-focus)',
      },
      '&:first-child': rounded
        ? {
            borderTopLeftRadius: 'card',
            borderTopRightRadius: 'card',
          }
        : {},
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
  padding: 16px 0 16px 16px;
  display: flex;
  flex: 1 1 160px;
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
