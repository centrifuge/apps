import { Box, IconDashboard, Stack } from '@centrifuge/fabric'
import { useIsAboveBreakpoint } from '../../utils/useIsAboveBreakpoint'
import { MenuLink } from './MenuLink'
import { PageLink } from './PageLink'

const pages = [
  { label: 'Account', href: 'account', match: 'dashboard/account' },
  { label: 'Assets', href: 'assets', match: 'dashboard/assets' },
  { label: 'Investors', href: 'investors', match: 'dashboard/investors' },
]

export function DashboardMenu() {
  const isLarge = useIsAboveBreakpoint('L')
  const isSmall = useIsAboveBreakpoint('S')
  const isMedium = useIsAboveBreakpoint('M')

  const isLargeOrSmall = (isLarge || isSmall) && !isMedium
  return (
    <>
      {isMedium ? (
        <Box width="100%">
          <PageLink to="/dashboard" exact>
            <IconDashboard size={['iconMedium', 'iconSmall', 'iconMedium', 'iconSmall']} />
            Dashboard
          </PageLink>
        </Box>
      ) : (
        pages.map(({ href, label }) => (
          <Box width="100%" key={href}>
            <PageLink to={`/dashboard/${href}`}>
              <IconDashboard size={['iconMedium', 'iconSmall', 'iconMedium', 'iconSmall']} />
              {label}
            </PageLink>
          </Box>
        ))
      )}
      {isMedium ? (
        <Box width="100%" pl={4}>
          <Stack as="ul" gap={1}>
            {pages.map(({ href, label, match }) => (
              <MenuLink path={href} name={label} matchingPath={match} />
            ))}
          </Stack>
        </Box>
      ) : null}
    </>
  )
}
