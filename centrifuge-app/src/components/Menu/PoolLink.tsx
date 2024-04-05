import type { Pool } from '@centrifuge/centrifuge-js'
import { Text } from '@centrifuge/fabric'
import { useRouteMatch } from 'react-router'
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
`

type PoolLinkProps = {
  pool: Pool
  path?: string
}

export function PoolLink({ pool, path = 'issuer' }: PoolLinkProps) {
  const match = useRouteMatch<{ pid: string }>(`/${path}/:pid`)
  const { data: metadata } = usePoolMetadata(pool)
  const to = `/${path}/${pool.id}`
  return (
    <Root
      forwardedAs={Link}
      to={to}
      variant="interactive1"
      isActive={match && pool.id === match.params.pid}
      onMouseOver={() => prefetchRoute(to)}
    >
      {metadata?.pool?.name ?? pool.id}
    </Root>
  )
}
