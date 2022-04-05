import { Card, Shelf, Stack, Text } from '@centrifuge/fabric'
import css from '@styled-system/css'
import * as React from 'react'
import styled from 'styled-components'

type Props = {
  data: Array<any>
  columns: Column[]
  keyField?: string
  onRowClicked?: (row: any) => void
}

export type OrderBy = 'asc' | 'desc'

export type Column = {
  header: string | ((orderBy: OrderBy) => React.ReactNode)
  cell: (row: any) => React.ReactNode
  align?: string
  flex?: string
  sortKey?: string
}
const sorter = (data: Array<any>, order: OrderBy, sortKey?: string) => {
  if (!sortKey) return data
  if (order === 'asc') {
    return data.sort((a, b) => a[sortKey] - b[sortKey])
  }
  return data.sort((a, b) => b[sortKey] - a[sortKey])
}

export const DataTable: React.VFC<Props> = ({ data: initialData, columns, keyField, onRowClicked }) => {
  const [data, setData] = React.useState(initialData)
  const [orderBy, setOrderBy] = React.useState<Record<string, OrderBy>>({})

  const sortData = (column: Column) => {
    if (column?.sortKey) {
      const updatedOrderBy = orderBy[column.sortKey] === 'asc' ? 'desc' : 'asc'
      const sortedData = sorter(data, updatedOrderBy, column?.sortKey)
      setOrderBy({ ...orderBy, [column.sortKey]: updatedOrderBy })
      setData(sortedData)
    }
  }

  return (
    <Stack>
      <Shelf>
        {columns.map((col: any, i) => (
          <HeaderCol
            key={`${col.header}-${i}`}
            style={{ flex: col.flex }}
            tabIndex={col?.sortKey ? 0 : undefined}
            as={col?.sortKey ? 'button' : 'div'}
            onClick={col?.sortKey && (() => sortData(col))}
            align={col?.align}
          >
            <Text variant="label1">
              {typeof col?.header !== 'string' && col?.sortKey ? col.header(orderBy[col.sortKey]) : col.header}
            </Text>
          </HeaderCol>
        ))}
      </Shelf>
      <Card>
        {data.map((row: any, i) => (
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
  ${({ align }) => {
    switch (align) {
      case 'left':
        return css({
          flex: '1 1 160px',
          padding: '16px 12px 16px 24px',
          display: 'flex',
          justifyContent: 'flex-start',
        })
      case 'right':
      default:
        return css({
          flex: '1 1 160px',
          padding: '8px 24px',
          display: 'flex',
          justifyContent: 'flex-end',
        })
    }
  }}
`

const HeaderCol = styled(DataCol)``
