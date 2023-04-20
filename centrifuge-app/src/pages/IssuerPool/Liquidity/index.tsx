import { useParams } from 'react-router'
import { LoadBoundary } from '../../../components/LoadBoundary'
import { MaxReserveForm } from '../../../components/MaxReserveForm'
import { PageWithSideBar } from '../../../components/PageWithSideBar'
import { PendingMultisigs } from '../../../components/PendingMultisigs'
import { useSuitableAccounts } from '../../../utils/usePermissions'
import { PoolDetailLiquidity } from '../../Pool/Liquidity'
import { IssuerPoolHeader } from '../Header'

export function IssuerPoolLiquidityPage() {
  const { pid: poolId } = useParams<{ pid: string }>()
  const isLiquidityAdmin = useSuitableAccounts({ poolId, poolRole: ['LiquidityAdmin'] }).length > 0

  return (
    <PageWithSideBar
      sidebar={
        <>
          {isLiquidityAdmin ? <MaxReserveForm poolId={poolId} /> : true}
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
