import { Box, IconChevronDown, IconChevronRight, Stack, Text } from '@centrifuge/fabric'
import * as React from 'react'
import { Link } from 'react-router-dom'
import styled, { useTheme } from 'styled-components'
import { StyledRouterButton } from '.'
import { useIsAboveBreakpoint } from '../../utils/useIsAboveBreakpoint'
import { Toggle } from './Toggle'

const RouterButton = styled(Text)`
  padding: 6px;
  margin-left: 28px;
  color: white;
  font-size: 14px;
  border-radius: 4px;
  &:hover {
    color: ${({ theme }) => theme.colors.textGold};
    background-color: rgba(145, 150, 155, 0.13);
  }
`

const links = [
  {
    href: 'https://centrifuge.subsquare.io/democracy/referenda',
    label: 'Onchain voting',
  },
  {
    href: 'https://voting.opensquare.io/space/centrifuge',
    label: 'Offchain voting',
  },
  {
    href: 'https://gov.centrifuge.io/',
    label: 'Governance forum',
  },
]

export function ToggleMenu({
  label,
  icon,
  withToggle = false,
  open,
  setOpen,
}: {
  label: string
  icon: React.ReactNode
  withToggle?: boolean
  open: boolean
  setOpen: (open: boolean) => void
}) {
  return (
    <Box position="relative">
      <Toggle
        forwardedAs="button"
        variant="interactive1"
        id={`${label}-button`}
        aria-controls={`${label}-menu`}
        aria-label={open ? 'Hide menu' : 'Show menu'}
        onClick={() => setOpen(!open)}
      >
        {icon}
        {label}
        {open ? (
          <IconChevronDown size={['iconMedium', 'iconMedium', 'iconSmall']} />
        ) : (
          <IconChevronRight size={['iconMedium', 'iconMedium', 'iconSmall']} />
        )}
      </Toggle>
      <Box position="absolute" top={0} left={0} width="100%" height="100%" backgroundColor="backgroundInverted">
        {open && (
          <Box>
            {links.map((link) => (
              <Text as={Link} color="white">
                {link}
              </Text>
            ))}
          </Box>
        )}
      </Box>
    </Box>
  )
}

export function SubMenu({
  links,
  withToggle = false,
  label,
  icon,
}: {
  links: string[]
  withToggle?: boolean
  label: string
  icon: React.ReactNode
}) {
  const theme = useTheme()
  const [open, setOpen] = React.useState(false)
  const fullWidth = `calc(100vw - 2 * ${theme.space[1]}px)`
  const offset = `calc(100% + 2 * ${theme.space[1]}px)`
  const id = React.useId()
  const aboveM = useIsAboveBreakpoint('M')
  const aboveL = useIsAboveBreakpoint('L')
  const isIpad = aboveM && !aboveL

  return (
    <Box>
      {isIpad ? (
        <ToggleMenu links={links} />
      ) : (
        <Stack>
          {withToggle ? (
            <ToggleMenu label={label} icon={icon} withToggle={withToggle} open={open} setOpen={setOpen} links={links} />
          ) : (
            <StyledRouterButton as={Link} color="white">
              {icon}
              <Text color="white" variant={isIpad ? 'body3' : 'body2'} style={{ marginLeft: 8 }}>
                {label}
              </Text>
            </StyledRouterButton>
          )}
          {links.map((link) => (
            <RouterButton as={Link} color="white">
              {link}
            </RouterButton>
          ))}
        </Stack>
      )}
    </Box>
  )
}
