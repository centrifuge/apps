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
  return (
    <>
      {isLarge ? (
        <PageLink to="/dashboard" stacked={!isLarge} exact>
          <IconDashboard size={['iconMedium', 'iconMedium', 'iconSmall']} />
          Dashboard
        </PageLink>
      ) : (
        pages.map(({ href, label }) => (
          <Box width="100%">
            <PageLink to={`/dashboard/${href}`} stacked={!isLarge}>
              <IconDashboard size={['iconMedium', 'iconMedium', 'iconSmall']} />
              {label}
            </PageLink>
          </Box>
        ))
      )}
      {isLarge && (
        <Box pl={4}>
          <Stack as="ul" gap={1}>
            {pages.map(({ href, label, match }) => (
              <MenuLink path={href} name={label} matchingPath={match} />
            ))}
          </Stack>
        </Box>
      )}
    </>
  )
}
