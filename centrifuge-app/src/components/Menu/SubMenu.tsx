import { Grid, IconChevronDown, IconChevronRight, Stack, Text } from '@centrifuge/fabric'
import * as React from 'react'
import { Link } from 'react-router-dom'
import styled from 'styled-components'
import { StyledRouterButton } from '.'
import { useIsAboveBreakpoint } from '../../utils/useIsAboveBreakpoint'
import { AnchorTextLink } from '../TextLink'
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

const onchainVoting = [
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
  open,
  setOpen,
  links,
}: {
  label: string
  icon: React.ReactNode
  withToggle?: boolean
  open: boolean
  setOpen: (open: boolean) => void
  links: string[]
}) {
  return (
    <>
      <Toggle
        forwardedAs="button"
        variant="interactive1"
        id={`${label}-button`}
        aria-controls={`${label}-menu`}
        aria-label={open ? 'Hide menu' : 'Show menu'}
        onClick={() => setOpen(!open)}
      >
        {icon}
        <Text color="white">{label}</Text>
        {open ? (
          <IconChevronDown size={['iconMedium', 'iconMedium', 'iconSmall']} />
        ) : (
          <IconChevronRight size={['iconMedium', 'iconMedium', 'iconSmall']} />
        )}
      </Toggle>
      {open && (
        <Grid display="flex" flexDirection="column" mt={1}>
          {links.map((link) => (
            <RouterButton
              as={AnchorTextLink}
              color="white"
              href={onchainVoting.find((l) => l.label === link)?.href}
              target="_blank"
              style={{ textDecoration: 'none' }}
            >
              {link}
            </RouterButton>
          ))}
        </Grid>
      )}
    </>
  )
}

export function SubMenu({
  links,
  withToggle = false,
  label,
  icon,
}: {
  links: string[]
  withToggle: boolean
  label: string
  icon: React.ReactNode
}) {
  const [open, setOpen] = React.useState(false)
  const isLarge = useIsAboveBreakpoint('L')
  return (
    <>
      <Stack>
        {withToggle ? (
          <ToggleMenu label={label} icon={icon} open={open} setOpen={setOpen} links={links} />
        ) : (
          <>
            {isLarge ? (
              <>
                <StyledRouterButton as={Link} color="white" to={`/${label.toLowerCase()}`}>
                  {icon}
                  <Text color="white" variant="body2" style={{ marginLeft: 8 }}>
                    {label}
                  </Text>
                </StyledRouterButton>
                {links.map((link) => (
                  <RouterButton key={link} as={Link} color="white" to={`/${label.toLowerCase()}/${link.toLowerCase()}`}>
                    {link}
                  </RouterButton>
                ))}
              </>
            ) : (
              <Stack>
                <StyledRouterButton as={Link} color="white" to={`/${label.toLowerCase()}`}>
                  {icon}
                  <Text color="white" variant="body2" style={{ marginLeft: 8 }}>
                    {label}
                  </Text>
                </StyledRouterButton>
                {links.map((link) => (
                  <RouterButton key={link} as={Link} color="white" to={`/${label.toLowerCase()}/${link.toLowerCase()}`}>
                    {link}
                  </RouterButton>
                ))}
              </Stack>
            )}
          </>
        )}
      </Stack>
    </>
  )
}
