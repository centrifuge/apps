import { useParams } from 'react-router'
import { LayoutBase } from '../../../components/LayoutBase'
import { LoadBoundary } from '../../../components/LoadBoundary'
import { useSuitableAccounts } from '../../../utils/usePermissions'
import { IssuerPoolHeader } from '../Header'
import { InvestorStatus } from './InvestorStatus'
import { LiquidityPools } from './LiquidityPools'

export function IssuerPoolInvestorsPage() {
  return (
    <LayoutBase>
      <IssuerPoolHeader />
      <LoadBoundary>
        <IssuerPoolInvestors />
      </LoadBoundary>
    </LayoutBase>
  )
}

function IssuerPoolInvestors() {
  const { pid: poolId } = useParams<{ pid: string }>()

  if (!poolId) throw new Error('Pool not found')

  const canEditInvestors = useSuitableAccounts({ poolId, poolRole: ['InvestorAdmin'] }).length > 0
  const isPoolAdmin = useSuitableAccounts({ poolId, poolRole: ['PoolAdmin'] }).length > 0

  return (
    <>
      {canEditInvestors && <InvestorStatus />}
      {isPoolAdmin && <LiquidityPools />}
    </>
  )
}
