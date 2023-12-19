import { BoxProps, Stack } from '@centrifuge/fabric'
import * as React from 'react'

type BaseSectionProps = BoxProps & {
  children: React.ReactNode
}

export const BASE_PADDING = [2, 2, 3, 3, 5]

export function BasePadding({ children, ...boxProps }: BaseSectionProps) {
  return (
    <Stack px={BASE_PADDING} {...boxProps}>
      {children}
    </Stack>
  )
}
