import { useParams } from 'react-router'
import { LoadBoundary } from '../../../components/LoadBoundary'
import { MaxReserveForm } from '../../../components/MaxReserveForm'
import { PageWithSideBar } from '../../../components/PageWithSideBar'
import { PendingMultisigs } from '../../../components/PendingMultisigs'
import { PoolDetailLiquidity } from '../../Pool/Liquidity'
import { IssuerPoolHeader } from '../Header'

export function IssuerPoolLiquidityPage() {
  const { pid: poolId } = useParams<{ pid: string }>()

  return (
    <PageWithSideBar
      sidebar={
        <>
          <MaxReserveForm poolId={poolId} />
          <PendingMultisigs poolId={poolId} />
        </>
      }
    >
      <IssuerPoolHeader />
      <LoadBoundary>
        <PoolDetailLiquidity />
      </LoadBoundary>
    </PageWithSideBar>
  )
}
