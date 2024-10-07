import { Shelf } from '@centrifuge/fabric'
import * as React from 'react'

type HeaderProps = {
  children?: React.ReactNode
}

export function Header({ children }: HeaderProps) {
  return (
    <Shelf as="header" justifyContent="space-between" gap={2} p={3}>
      <Shelf alignItems="center" gap={3}>
        {children}
      </Shelf>
    </Shelf>
  )
}
