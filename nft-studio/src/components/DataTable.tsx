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

type Column = {
  header: React.ReactNode
  cell: (row: any) => React.ReactNode
  align?: string
  flex?: string
}

export const DataTable: React.VFC<Props> = ({ data, columns, keyField, onRowClicked }) => {
  return (
    <Stack>
      <Shelf>
        {columns.map((col, i) =>
          col.align === 'left' ? (
            <HeaderColLeft key={`${col.header}-${i}`} style={{ flex: col.flex }}>
              <Text variant="label1">{col.header}</Text>
            </HeaderColLeft>
          ) : (
            <HeaderCol key={`${col.header}-${i}`} style={{ flex: col.flex }}>
              <Text variant="label1">{col.header}</Text>
            </HeaderCol>
          )
        )}
      </Shelf>
      <Card>
        {data.map((row: any, i) => {
          return (
            <Row
              as={onRowClicked ? 'button' : 'div'}
              key={keyField ? row[keyField] : i}
              onClick={onRowClicked && (() => onRowClicked(row))}
              tabIndex={onRowClicked ? 0 : undefined}
            >
              {columns.map((col) =>
                col.align === 'left' ? (
                  <React.Fragment key={`${col.header}-${i}`}>
                    <DataColLeft style={{ flex: col.flex }}>{col.cell(row)}</DataColLeft>
                  </React.Fragment>
                ) : (
                  <React.Fragment key={`${col.header}-${i}`}>
                    <DataCol style={{ flex: col.flex }}>{col.cell(row)}</DataCol>
                  </React.Fragment>
                )
              )}
            </Row>
          )
        })}
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

const DataCol = styled.div`
  flex: 1 1 160px;
  padding: 8px 24px;
  display: flex;
  justify-content: flex-end;
`

const DataColLeft = styled.div`
  flex: 1 1 160px;
  padding: 16px 12px 16px 24px;
  display: flex;
  justify-content: flex-start;
`

const HeaderCol = styled(DataCol)``

const HeaderColLeft = styled(DataColLeft)``
