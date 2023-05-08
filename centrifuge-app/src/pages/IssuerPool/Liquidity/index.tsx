import * as React from 'react'
import { useParams } from 'react-router'
import { LoadBoundary } from '../../../components/LoadBoundary'
import { MaxReserveForm } from '../../../components/MaxReserveForm'
import { PageWithSideBar } from '../../../components/PageWithSideBar'
import { PoolDetailLiquidity } from '../../Pool/Liquidity'
import { IssuerPoolHeader } from '../Header'

export const IssuerPoolLiquidityPage: React.FC = () => {
  const { pid: poolId } = useParams<{ pid: string }>()

  return (
    <PageWithSideBar sidebar={<MaxReserveForm poolId={poolId} />}>
      <IssuerPoolHeader />
      <LoadBoundary>
        <PoolDetailLiquidity />
      </LoadBoundary>
    </PageWithSideBar>
  )
}
