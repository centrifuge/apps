import { Text } from '@centrifuge/fabric'
import { Link, LinkProps, useLocation } from 'react-router-dom'
import styled from 'styled-components'
import { useIsAboveBreakpoint } from '../../utils/useIsAboveBreakpoint'
import { prefetchRoute } from '../Root'
import { LIGHT_BACKGROUND } from './Toggle'
import { baseButton, primaryButton } from './styles'

const Root = styled(Text)<{ isActive?: boolean; stacked?: boolean }>`
  ${baseButton}
  ${primaryButton}
  grid-template-columns: ${({ stacked, theme }) => (stacked ? '1fr' : `${theme.sizes.iconSmall}px 1fr`)};
  color: ${({ isActive, theme }) => (isActive ? theme.colors.textGold : theme.colors.textInverted)};
  font-size: 14px;
  font-weight: 500;
  background-color: ${({ isActive }) => (isActive ? LIGHT_BACKGROUND : 'transparent')};
  border-radius: 4px;
  &:hover {
    color: ${({ theme }) => theme.colors.textGold};
    background-color: rgba(145, 150, 155, 0.13);
  }
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
      as={Link as any}
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
