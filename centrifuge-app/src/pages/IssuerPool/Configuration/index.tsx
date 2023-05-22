import { Stack } from '@centrifuge/fabric'
import { useParams } from 'react-router'
import { useDebugFlags } from '../../../components/DebugFlags'
import { LoadBoundary } from '../../../components/LoadBoundary'
import { PageWithSideBar } from '../../../components/PageWithSideBar'
import { PendingMultisigs } from '../../../components/PendingMultisigs'
import { usePoolAdmin } from '../../../utils/usePermissions'
import { IssuerPoolHeader } from '../Header'
import { Details } from './Details'
import { EpochAndTranches } from './EpochAndTranches'
import { Issuer } from './Issuer'
import { LoanTemplates } from './LoanTemplates'
import { OnboardingConfig } from './OnboardingConfig'
import { PoolConfig } from './PoolConfig'
import { WriteOffGroups } from './WriteOffGroups'

export function IssuerPoolConfigurationPage() {
  const { pid: poolId } = useParams<{ pid: string }>()
  return (
    <PageWithSideBar sidebar={<PendingMultisigs poolId={poolId} />}>
      <IssuerPoolHeader />
      <LoadBoundary>
        <IssuerPoolConfiguration />
      </LoadBoundary>
    </PageWithSideBar>
  )
}

function IssuerPoolConfiguration() {
  const { pid: poolId } = useParams<{ pid: string }>()
  const { editPoolConfig } = useDebugFlags()

  return (
    <Stack>
      {!!usePoolAdmin(poolId) && (
        <>
          <Details />
          <Issuer />
          <EpochAndTranches />
          <WriteOffGroups />
          <LoanTemplates />
          <OnboardingConfig />
          {editPoolConfig && <PoolConfig poolId={poolId} />}
        </>
      )}
    </Stack>
  )
}
