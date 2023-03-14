import { Stack } from '@centrifuge/fabric'
import * as React from 'react'

type ContentProps = {
  children: React.ReactNode
}

export function Content({ children }: ContentProps) {
  return <Stack gap={5}>{children}</Stack>
}
