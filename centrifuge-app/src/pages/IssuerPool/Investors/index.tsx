import * as React from 'react'
import { useParams } from 'react-router'
import { LoadBoundary } from '../../../components/LoadBoundary'
import { PageWithSideBar } from '../../../components/PageWithSideBar'
import { PendingMultisigs } from '../../../components/PendingMultisigs'
import { useSuitableAccounts } from '../../../utils/usePermissions'
import { IssuerPoolHeader } from '../Header'
import { InvestorStatus } from './InvestorStatus'
import { OnboardingSettings } from './OnboardingSettings'

export function IssuerPoolInvestorsPage() {
  const { pid: poolId } = useParams<{ pid: string }>()
  return (
    <PageWithSideBar sidebar={<PendingMultisigs poolId={poolId} />}>
      <IssuerPoolHeader />
      <LoadBoundary>
        <IssuerPoolInvestors />
      </LoadBoundary>
    </PageWithSideBar>
  )
}

function IssuerPoolInvestors() {
  const { pid: poolId } = useParams<{ pid: string }>()
  const canEditInvestors = useSuitableAccounts({ poolId, poolRole: ['InvestorAdmin'] }).length > 0
  const isPoolAdmin = useSuitableAccounts({ poolId, poolRole: ['PoolAdmin'] }).length > 0

  return (
    <>
      {canEditInvestors && <InvestorStatus />}
      {isPoolAdmin && <OnboardingSettings />}
    </>
  )
}
