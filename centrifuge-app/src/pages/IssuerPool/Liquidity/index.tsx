import * as React from 'react'
import { useParams } from 'react-router'
import { LoadBoundary } from '../../../components/LoadBoundary'
import { MaxReserveForm } from '../../../components/MaxReserveForm'
import { PageWithSideBar } from '../../../components/PageWithSideBar'
import { useLiquidityAdmin } from '../../../utils/usePermissions'
import { PoolDetailLiquidity } from '../../PoolDetail/LiquidityTab'
import { IssuerPoolHeader } from '../Header'

export const IssuerPoolLiquidityPage: React.FC = () => {
  const { pid: poolId } = useParams<{ pid: string }>()
  const isLiquidityAdmin = useLiquidityAdmin(poolId)

  return (
    <PageWithSideBar sidebar={isLiquidityAdmin ? <MaxReserveForm poolId={poolId} /> : true}>
      <IssuerPoolHeader />
      <LoadBoundary>
        <PoolDetailLiquidity />
      </LoadBoundary>
    </PageWithSideBar>
  )
}
