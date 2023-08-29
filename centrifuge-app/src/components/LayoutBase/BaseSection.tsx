import { Box, BoxProps } from '@centrifuge/fabric'
import * as React from 'react'
import { config } from './config'

type BaseSectionProps = BoxProps & {
  children: React.ReactNode
}

export function BaseSection({ children, ...boxProps }: BaseSectionProps) {
  return (
    <Box px={config.PADDING_MAIN} {...boxProps}>
      <Box maxWidth={config.LAYOUT_MAX_WIDTH}>{children}</Box>
    </Box>
  )
}
