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

export const ContextActions: React.FC<Props> = ({ actions, parent }) => {
  return (
    <ButtonGroup variant="small">
      {actions && (
        <Box display={['none', 'block']}>
          <Shelf gap={1}>{actions}</Shelf>
        </Box>
      )}
      {parent && (
        <RouterLinkButton to={parent.to} small icon={<IconChevronLeft width="16" />} variant="tertiary">
          {parent.label}
        </RouterLinkButton>
      )}
    </ButtonGroup>
  )
}
