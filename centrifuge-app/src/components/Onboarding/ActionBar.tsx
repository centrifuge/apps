import { Shelf } from '@centrifuge/fabric'
import * as React from 'react'

type ActionBarProps = {
  children: React.ReactNode
}

export function ActionBar({ children }: ActionBarProps) {
  return <Shelf gap={3}>{children}</Shelf>
}
