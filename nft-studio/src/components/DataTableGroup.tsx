import { Card, Stack } from '@centrifuge/fabric'
import * as React from 'react'

export const DataTableGroup: React.FC = ({ children }) => {
  return (
    <Stack as={Card} gap="3">
      {React.Children.map(children, (child, index) => {
        return React.isValidElement(child)
          ? React.cloneElement(child, {
              groupIndex: index,
              lastIndex: React.Children.count(children) - 1,
            })
          : null
      })}
    </Stack>
  )
}
