import { Card, Shelf, Stack, Text } from '@centrifuge/fabric'
import css from '@styled-system/css'
import * as React from 'react'
import styled from 'styled-components'

type Props<T> = {
  data: Array<T>
  columns: Column[]
  keyField?: string
  onRowClicked?: (row: T) => void
}

export type OrderBy = 'asc' | 'desc'

export type Column = {
  header: string | ((orderBy: OrderBy) => React.ReactNode)
  cell: (row: any) => React.ReactNode
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

export const DataTable = <T extends Record<string, any>>({ data, columns, keyField, onRowClicked }: Props<T>) => {
  const [orderBy, setOrderBy] = React.useState<Record<string, OrderBy>>({})
  const [currentSortKey, setCurrentSortKey] = React.useState('')

  const updateSortOrder = (sortKey: Column['sortKey']) => {
    if (!sortKey) return
    const updatedOrderBy = orderBy[sortKey] === 'asc' ? 'desc' : 'asc'
    setOrderBy({ ...orderBy, [sortKey]: updatedOrderBy })
    setCurrentSortKey(sortKey)
  }

  const sortedData = React.useMemo(
    () => sorter(data, orderBy[currentSortKey], currentSortKey),
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
      <Card>
        {sortedData?.map((row, i) => (
          <Row
            as={onRowClicked ? 'button' : 'div'}
            key={keyField ? row[keyField] : i}
            onClick={onRowClicked && (() => onRowClicked(row))}
            tabIndex={onRowClicked ? 0 : undefined}
          >
            {columns.map((col) => (
              <DataCol style={{ flex: col.flex }} align={col?.align} key={`${col.header}-${i}`}>
                {col.cell(row)}
              </DataCol>
            ))}
          </Row>
        ))}
      </Card>
    </Stack>
  )
}

const Row = styled(Shelf)(
  css({
    width: '100%',
    minHeight: 56,
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
    '&:first-child': {
      borderTopLeftRadius: 'card',
      borderTopRightRadius: 'card',
    },
    '&:last-child': {
      borderBottomLeftRadius: 'card',
      borderBottomRightRadius: 'card',
    },
  })
)

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
    paddingright: '16px';
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
      case 'right':
      default:
        return css({
          textAlign: 'right',
          justifyContent: 'flex-end',
          // '$:last-of-type': {
          //   paddingRight: '24px',
          // },
          // paddingRight: '16px',
          // '&:last-of-type': {
          //   paddingRight: '24px',
          // },
          '&:last-child': {
            paddingRight: '16px',
          },
        })
    }
  }}
`

const HeaderCol = styled(DataCol)``
