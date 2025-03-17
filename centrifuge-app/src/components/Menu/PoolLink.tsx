import type { Pool } from '@centrifuge/centrifuge-js'
import { Text } from '@centrifuge/fabric'
import { useMatch } from 'react-router'
import { Link } from 'react-router-dom'
import styled from 'styled-components'
import { usePoolMetadata } from '../../utils/usePools'
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

type PoolLinkProps = {
  pool: Pool
  path?: string
}

export function PoolLink({ pool, path = 'pools' }: PoolLinkProps) {
  const match = useMatch(`/${path}/:pid/*`)
  const { data: metadata } = usePoolMetadata(pool)
  const to = `/${path}/${pool.id}`
  return (
    <Root
      forwardedAs={Link}
      to={to}
      variant="body2"
      isActive={match && pool.id === match.params.pid}
      onMouseOver={() => prefetchRoute(to)}
    >
      {metadata?.pool?.name ?? pool.id}
    </Root>
  )
}
