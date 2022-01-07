import { Shelf } from '@centrifuge/fabric'
import * as React from 'react'

type Props = {}

export const PageSummary: React.FC<Props> = ({ children }) => {
  return (
    <Shelf gap={6} alignItems="flex-start">
      {children}
    </Shelf>
  )
}
