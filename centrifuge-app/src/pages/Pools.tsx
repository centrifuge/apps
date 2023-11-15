import * as React from 'react'
import { LayoutBase } from '../components/LayoutBase'
import { PoolList } from '../components/PoolList'
import { PoolsTokensShared } from '../components/PoolsTokensShared'
import { prefetchRoute } from '../components/Root'

export default function PoolsPage() {
  React.useEffect(() => {
    prefetchRoute('/pools/1')
    prefetchRoute('/pools/tokens')
  }, [])
  return (
    <LayoutBase>
      <PoolsTokensShared title="Pools">
        <PoolList />
      </PoolsTokensShared>
    </LayoutBase>
  )
}
