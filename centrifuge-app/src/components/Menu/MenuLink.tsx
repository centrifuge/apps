import { Text } from '@centrifuge/fabric'
import { useLocation } from 'react-router'
import { Link } from 'react-router-dom'
import styled from 'styled-components'
import { prefetchRoute } from '../Root'
import { baseButton } from './styles'

const Root = styled(Text)`
  ${baseButton}
  display: block;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  border-radius: ${({ theme }) => theme.radii.input}px;
  color: ${({ isActive, theme }) => (isActive ? theme.colors.textGold : theme.colors.textInverted)};
  &:hover {
    color: ${({ isActive, theme }) => (isActive ? theme.colors.textGold : theme.colors.textGold)};
  }
`

type MenuLinkProps = {
  path?: string
  name?: string
  matchingPath: string
}

export function MenuLink({ path = 'dashboard', name, matchingPath }: MenuLinkProps) {
  const location = useLocation()
  const match = location.pathname.includes(matchingPath)
  return (
    <Root
      forwardedAs={Link}
      to={`/dashboard/${path}`}
      variant="body2"
      isActive={match}
      onMouseOver={() => prefetchRoute('/dashboard')}
    >
      {name}
    </Root>
  )
}
