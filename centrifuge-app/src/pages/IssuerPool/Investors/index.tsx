import * as React from 'react'
import { useParams } from 'react-router'
import { LayoutBase } from '../../../components/LayoutBase'
import { LoadBoundary } from '../../../components/LoadBoundary'
import { useSuitableAccounts } from '../../../utils/usePermissions'
import { IssuerPoolHeader } from '../Header'
import { InvestorStatus } from './InvestorStatus'
import { LiquidityPools } from './LiquidityPools'
import { OnboardingSettings } from './OnboardingSettings'

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
  const canEditInvestors = useSuitableAccounts({ poolId, poolRole: ['InvestorAdmin'] }).length > 0
  const isPoolAdmin = useSuitableAccounts({ poolId, poolRole: ['PoolAdmin'] }).length > 0

  return (
    <>
      {<InvestorStatus />}
      {<LiquidityPools />}
      {isPoolAdmin && <OnboardingSettings />}
    </>
  )
}
