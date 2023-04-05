import { Box, IconChevronDown, IconChevronRight, IconUser, Text } from '@centrifuge/fabric'
import * as React from 'react'
import { useRouteMatch } from 'react-router'
import styled, { useTheme } from 'styled-components'
import { baseButton, primaryButton } from './styles'

type IssuerMenuProps = {
  defaultOpen?: boolean
  poolIds?: string[]
  stacked?: boolean
  children?: React.ReactNode
}

const Toggle = styled(Text)<{ isActive?: boolean; stacked?: boolean }>`
  ${baseButton}
  ${primaryButton}
  width: 100%;
  grid-template-columns: ${({ stacked, theme }) =>
    stacked ? '1fr' : `${theme.sizes.iconSmall}px 1fr ${theme.sizes.iconSmall}px`};
`

export function IssuerMenu({ defaultOpen = false, poolIds = [], stacked, children }: IssuerMenuProps) {
  const match = useRouteMatch<{ pid: string }>('/issuer/:pid')
  const isActive = match && poolIds.includes(match.params.pid)
  const [open, setOpen] = React.useState(defaultOpen)
  const { space } = useTheme()
  const fullWidth = `calc(100vw - 2 * ${space[1]}px)`
  const offset = `calc(100% + 2 * ${space[1]}px)`
  const id = React.useId()

  return (
    <Box position={['static', 'static', 'relative', 'relative', 'static']}>
      {open && (
        <Box
          display={['block', 'block', 'block', 'block', 'none']}
          position="fixed"
          top="0"
          left="0"
          width="100%"
          height="100%"
          onClick={() => setOpen(false)}
        />
      )}

      <Toggle
        forwardedAs="button"
        variant="interactive1"
        id={`${id}-button`}
        aria-controls={`${id}-menu`}
        aria-label={open ? 'Hide menu' : 'Show menu'}
        onClick={() => setOpen(!open)}
        isActive={isActive}
        stacked={stacked}
      >
        <IconUser />
        Issuer
        {!stacked && (open ? <IconChevronDown /> : <IconChevronRight />)}
      </Toggle>

      <Box
        as="section"
        hidden={!open}
        id={`${id}-menu`}
        aria-labelledby={`${id}-button`}
        aria-expanded={!!open}
        position={['absolute', 'absolute', 'absolute', 'absolute', 'static']}
        top={['auto', 'auto', 0, 0, 'auto']}
        bottom={[offset, offset, 'auto']}
        left={[1, 1, offset, offset, 'auto']}
        width={[fullWidth, fullWidth, 150, 150, '100%']}
        mt={[0, 0, 0, 0, 1]}
      >
        {children}
      </Box>
    </Box>
  )
}
