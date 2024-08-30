import { useRef } from 'react'
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

  // This is a bit hacky, but when deploying a pool to a domain, the user needs to switch networks
  // And when they're connected to the other network, they won't register as a pool admin anymore
  const wasAdminRef = useRef(isPoolAdmin)
  if (isPoolAdmin) {
    wasAdminRef.current = true
  }

  return (
    <>
      {canEditInvestors && <InvestorStatus />}
      {wasAdminRef.current && <LiquidityPools />}
    </>
  )
}
