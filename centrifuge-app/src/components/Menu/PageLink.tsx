import { Text } from '@centrifuge/fabric'
import { Link, LinkProps, useLocation } from 'react-router-dom'
import styled from 'styled-components'
import { useIsAboveBreakpoint } from '../../utils/useIsAboveBreakpoint'
import { prefetchRoute } from '../Root'
import { LIGHT_BACKGROUND } from './Toggle'
import { baseButton, primaryButton } from './styles'

const Root = styled(Text)<{
  isActive?: boolean
  stacked?: boolean
  isMedium?: boolean
  isSmall?: boolean
}>`
  ${baseButton}
  ${primaryButton}
  display: flex;
  align-items: center;
  justify-content: 'flex-start';
  flex-direction: ${({ stacked }) => (stacked ? 'column' : 'row')};
  color: ${({ isActive, theme }) => (isActive ? theme.colors.textGold : theme.colors.textInverted)};
  font-weight: 500;
  background-color: ${({ isActive }) => (isActive ? LIGHT_BACKGROUND : 'transparent')};
  border-radius: 4px;
  font-size: ${({ stacked }) => (stacked ? '10px' : '16px')};
  &:hover {
    color: ${({ theme }) => theme.colors.textGold};
    background-color: rgba(145, 150, 155, 0.13);
  }
`

type PageLinkProps = LinkProps & {
  stacked?: boolean
  exact?: boolean
}

export function PageLink({ stacked = false, to, children, exact = false }: PageLinkProps) {
  const location = useLocation()
  const isMedium = useIsAboveBreakpoint('M')
  const isLarge = useIsAboveBreakpoint('L')

  let isActive = false
  if (exact) {
    isActive = location.pathname === to
  } else {
    isActive = location.pathname.startsWith(to as string)
  }

  return (
    <Root
      as={Link as any}
      to={to}
      variant="interactive1"
      isActive={isActive}
      onMouseOver={() => prefetchRoute(to)}
      isMedium={isMedium}
      stacked={isMedium && !isLarge}
    >
      {children}
    </Root>
  )
}
