import { Stack } from '@centrifuge/fabric'
import * as React from 'react'
import { useParams } from 'react-router'
import { useDebugFlags } from '../../../components/DebugFlags'
import { LoadBoundary } from '../../../components/LoadBoundary'
import { PageWithSideBar } from '../../../components/PageWithSideBar'
import { useIsPoolAdmin } from '../../../utils/usePermissions'
import { IssuerPoolHeader } from '../Header'
import { Admins } from './Admins'
import { Details } from './Details'
import { EpochAndTranches } from './EpochAndTranches'
import { Issuer } from './Issuer'
import { LoanTemplates } from './LoanTemplates'
import { PoolConfig } from './PoolConfig'
import { RiskGroups } from './RiskGroups'
import { WriteOffGroups } from './WriteOffGroups'

export const IssuerPoolConfigurationPage: React.FC = () => {
  return (
    <PageWithSideBar>
      <IssuerPoolHeader />
      <LoadBoundary>
        <IssuerPoolConfiguration />
      </LoadBoundary>
    </PageWithSideBar>
  )
}

const IssuerPoolConfiguration: React.FC = () => {
  const { pid: poolId } = useParams<{ pid: string }>()
  const isPoolAdmin = useIsPoolAdmin(poolId)
  const { editPoolConfig } = useDebugFlags()

  return (
    <Stack>
      {isPoolAdmin && (
        <>
          <Details />
          <Issuer />
          <EpochAndTranches />
          <RiskGroups />
          <WriteOffGroups />
          <Admins />
          <LoanTemplates />
          {editPoolConfig && <PoolConfig poolId={poolId} />}
        </>
      )}
    </Stack>
  )
}
