import type { Pool } from '@centrifuge/centrifuge-js'
import { Text } from '@centrifuge/fabric'
import * as React from 'react'
import { useLocation } from 'react-router'
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
  const { pathname } = useLocation()
  const { data: metadata, isLoading } = usePoolMetadata(pool)

  return (
    <Root forwardedAs={Link} to={`/issuer/${pool.id}`} variant="interactive1" isActive={pathname.includes(pool.id)}>
      {metadata?.pool?.name ?? pool.id}
    </Root>
  )
}
