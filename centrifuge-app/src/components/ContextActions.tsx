import { Box, IconChevronLeft, Shelf } from '@centrifuge/fabric'
import * as React from 'react'
import { ButtonGroup } from './ButtonGroup'
import { RouterLinkButton } from './RouterLinkButton'

type Props = {
  actions?: React.ReactNode
  parent?: {
    to: string
    label: string
  }
}

export function ContextActions({ actions, parent }: Props) {
  return (
    <ButtonGroup variant="small">
      {actions && (
        <Box display={['none', 'block']}>
          <Shelf gap={1}>{actions}</Shelf>
        </Box>
      )}
      {parent && (
        <RouterLinkButton to={parent.to} small icon={IconChevronLeft} variant="tertiary">
          {parent.label}
        </RouterLinkButton>
      )}
    </ButtonGroup>
  )
}
