import * as React from 'react'
import { LoadBoundary } from '../../../components/LoadBoundary'
import { PageWithSideBar } from '../../../components/PageWithSideBar'
import { PoolDetailHeader } from '../Header'

export const PoolDetailLiquidityTab: React.FC = () => {
  return (
    <PageWithSideBar sidebar>
      <PoolDetailHeader />
      <LoadBoundary>
        <PoolDetailLiquidity />
      </LoadBoundary>
    </PageWithSideBar>
  )
}

export const PoolDetailLiquidity: React.FC = () => {
  return <div>Liquidity</div>
}
