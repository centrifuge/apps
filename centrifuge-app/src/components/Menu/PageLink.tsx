import { Text } from '@centrifuge/fabric'
import { useLocation, Link, LinkProps } from 'react-router-dom'
import styled from 'styled-components'
import { useIsAboveBreakpoint } from '../../utils/useIsAboveBreakpoint'
import { prefetchRoute } from '../Root'
import { baseButton, primaryButton } from './styles'

const Root = styled(Text)<{ isActive?: boolean; stacked?: boolean }>`
  ${baseButton}
  ${primaryButton}
  grid-template-columns: ${({ stacked, theme }) => (stacked ? '1fr' : `${theme.sizes.iconSmall}px 1fr`)};
  color: ${({ isActive }) => (isActive ? 'blue' : 'black')}; /* Example styling */
`

type PageLinkProps = LinkProps & {
  stacked?: boolean
}

export function PageLink({ stacked = false, to, children }: PageLinkProps) {
  const location = useLocation()
  const isMedium = useIsAboveBreakpoint('M')

  const isActive = location.pathname.startsWith(to as string)

  return (
    <Root
      as={Link}
      to={to}
      variant="interactive1"
      isActive={isActive}
      stacked={stacked}
      onMouseOver={() => prefetchRoute(to)}
      isMedium={isMedium}
    >
      {children}
    </Root>
  )
}
