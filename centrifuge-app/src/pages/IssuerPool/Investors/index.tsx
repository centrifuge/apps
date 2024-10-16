import { useParams } from 'react-router'
import { LoadBoundary } from '../../../components/LoadBoundary'
import { useSuitableAccounts } from '../../../utils/usePermissions'
import { IssuerPoolHeader } from '../Header'
import { InvestorStatus } from './InvestorStatus'
import { LiquidityPools } from './LiquidityPools'

export function IssuerPoolInvestorsPage() {
  return (
    <>
      <IssuerPoolHeader />
      <LoadBoundary>
        <IssuerPoolInvestors />
      </LoadBoundary>
    </>
  )
}

function IssuerPoolInvestors() {
  const { pid: poolId } = useParams<{ pid: string }>()

  if (!poolId) throw new Error('Pool not found')

  const canEditInvestors = useSuitableAccounts({ poolId, poolRole: ['InvestorAdmin'] }).length > 0

  return (
    <>
      {canEditInvestors && <InvestorStatus />}
      {/* 
        Always render the Liquidity Pools section, because the admin needs to do actions with an EVM wallet and 
        won't be able to see it if we check for admin permissions.
       */}
      <LiquidityPools />
    </>
  )
}
