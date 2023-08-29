import { Card, Stack } from '@centrifuge/fabric'
import * as React from 'react'
import { DataTableProps } from './DataTable'

export function DataTableGroup({
  children,
  rounded = true,
}: {
  children: React.ReactElement<DataTableProps>[]
  rounded?: boolean
}) {
  return (
    <Stack as={rounded ? Card : undefined} gap="3">
      {React.Children.map(children, (child, index) => {
        return React.isValidElement(child)
          ? React.cloneElement(child, {
              groupIndex: index,
              lastGroupIndex: React.Children.count(children) - 1,
            })
          : null
      })}
    </Stack>
  )
}
