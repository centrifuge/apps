import { Stack } from '@centrifuge/fabric'
import * as React from 'react'
import { DataTableProps } from './DataTable'

export function DataTableGroup({ children }: { children: React.ReactElement<DataTableProps>[] }) {
  return (
    <Stack>
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
