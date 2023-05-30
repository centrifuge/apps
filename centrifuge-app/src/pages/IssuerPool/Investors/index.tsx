import * as React from 'react'
import { useParams } from 'react-router'
import { LoadBoundary } from '../../../components/LoadBoundary'
import { PageWithSideBar } from '../../../components/PageWithSideBar'
import { useAddress } from '../../../utils/useAddress'
import { usePermissions } from '../../../utils/usePermissions'
import { IssuerPoolHeader } from '../Header'
import { InvestorStatus } from './InvestorStatus'
import { OnboardingSettings } from './OnboardingSettings'

export const IssuerPoolInvestorsPage: React.FC = () => {
  return (
    <PageWithSideBar>
      <IssuerPoolHeader />
      <LoadBoundary>
        <IssuerPoolInvestors />
      </LoadBoundary>
    </PageWithSideBar>
  )
}

const IssuerPoolInvestors: React.FC = () => {
  const { pid: poolId } = useParams<{ pid: string }>()
  const address = useAddress('substrate')
  const permissions = usePermissions(address)
  const canEditInvestors = address && permissions?.pools[poolId]?.roles.includes('MemberListAdmin')
  const isPoolAdmin = address && permissions?.pools[poolId]?.roles.includes('PoolAdmin')

  return (
    <>
      {canEditInvestors && <InvestorStatus />}
      {isPoolAdmin && <OnboardingSettings />}
    </>
  )
}
