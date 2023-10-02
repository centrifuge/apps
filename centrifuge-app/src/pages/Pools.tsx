import * as React from 'react'
import { LayoutBase } from '../components/LayoutBase'
import { PoolList } from '../components/PoolList'
import { PoolsTokensShared } from '../components/PoolsTokensShared'

export function PoolsPage() {
  return (
    <LayoutBase>
      <PoolsTokensShared title="Pools">
        <PoolList />
      </PoolsTokensShared>
    </LayoutBase>
  )
}
