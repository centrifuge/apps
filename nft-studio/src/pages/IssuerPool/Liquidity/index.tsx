import * as React from 'react'
import { LoadBoundary } from '../../../components/LoadBoundary'
import { PageWithSideBar } from '../../../components/PageWithSideBar'
import { PoolDetailLiquidity } from '../../PoolDetail/LiquidityTab'
import { IssuerPoolHeader } from '../Header'

export const IssuerPoolLiquidityPage: React.FC = () => {
  return (
    <PageWithSideBar>
      <IssuerPoolHeader />
      <LoadBoundary>
        <PoolDetailLiquidity />
      </LoadBoundary>
    </PageWithSideBar>
  )
}
