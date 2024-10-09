import {
  Box,
  IconChevronDown,
  IconChevronRight,
  IconExternalLink,
  IconGovernance,
  MenuItemGroup,
  Menu as Panel,
  Stack,
  Text,
} from '@centrifuge/fabric'
import * as React from 'react'
import styled, { useTheme } from 'styled-components'
import { useIsAboveBreakpoint } from '../../utils/useIsAboveBreakpoint'
import { Toggle } from './Toggle'
import { baseButton } from './styles'

const ExternalLink = styled(Text)`
  ${baseButton}
  display: flex;
  justify-content: space-between;
  gap: ${({ theme }) => theme.space[1]}px;
  white-space: nowrap;
  color: ${({ theme }) => theme.colors.textInverted};
  &:hover {
    color: ${({ theme }) => theme.colors.textGold};
  }
`

export function GovernanceMenu() {
  const [open, setOpen] = React.useState(false)
  const { space } = useTheme()
  const fullWidth = `calc(100vw - 2 * ${space[1]}px)`
  const offset = `calc(100% + 2 * ${space[1]}px)`
  const id = React.useId()
  const isLarge = useIsAboveBreakpoint('L')
  const isMedium = useIsAboveBreakpoint('M')
  const theme = useTheme()

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
        stacked={!isLarge}
        isMedium={isMedium}
      >
        <IconGovernance size={['iconMedium', 'iconMedium', 'iconSmall']} />
        Governance
        {isLarge &&
          (open ? (
            <IconChevronDown size={['iconMedium', 'iconMedium', 'iconSmall']} />
          ) : (
            <IconChevronRight size={['iconMedium', 'iconMedium', 'iconSmall']} />
          ))}
      </Toggle>

      <Box
        as="section"
        hidden={!open}
        id={`${id}-menu`}
        aria-labelledby={`${id}-button`}
        aria-expanded={!!open}
        position={['absolute', 'absolute', 'absolute', 'static']}
        top={['auto', 'auto', 0, 'auto']}
        bottom={[offset, offset, 'auto']}
        left={[1, 1, offset, offset, 'auto']}
        width={[fullWidth, fullWidth, 200, '100%']}
        mt={[0, 0, 0, 1]}
      >
        {isLarge ? (
          <Stack as="ul" gap={1}>
            {links.map(({ href, label }) => (
              <Box as="li" paddingX={4} key={href}>
                <Link href={href} stacked={!isLarge}>
                  {label}
                </Link>
              </Box>
            ))}
          </Stack>
        ) : (
          <Panel backgroundColor={theme.colors.backgroundInverted}>
            {links.map(({ href, label }) => (
              <MenuItemGroup key={href}>
                <Box px={2} py={1}>
                  <Link href={href} stacked={!isLarge}>
                    {label}
                  </Link>
                </Box>
              </MenuItemGroup>
            ))}
          </Panel>
        )}
      </Box>
    </Box>
  )
}

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

function Link({ href, stacked, children }: { href: string; stacked: boolean; children: React.ReactNode }) {
  return (
    <ExternalLink
      variant="interactive1"
      forwardedAs="a"
      target="_blank"
      rel="noopener noreferrer"
      href={href}
      stacked={stacked}
    >
      {children} <IconExternalLink size={['iconMedium', 'iconMedium', 'iconSmall']} />
    </ExternalLink>
  )
}
