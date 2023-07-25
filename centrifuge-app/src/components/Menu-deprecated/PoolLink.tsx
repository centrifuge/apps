import type { Pool } from '@centrifuge/centrifuge-js'
import { Text } from '@centrifuge/fabric'
import { useRouteMatch } from 'react-router'
import { Link } from 'react-router-dom'
import styled from 'styled-components'
import { usePoolMetadata } from '../../utils/usePools'
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
}

export function PoolLink({ pool }: PoolLinkProps) {
  const match = useRouteMatch<{ pid: string }>('/issuer/:pid')
  const { data: metadata } = usePoolMetadata(pool)

  return (
    <Root
      forwardedAs={Link}
      to={`/issuer/${pool.id}`}
      variant="interactive1"
      isActive={match && pool.id === match.params.pid}
    >
      {metadata?.pool?.name ?? pool.id}
    </Root>
  )
}
