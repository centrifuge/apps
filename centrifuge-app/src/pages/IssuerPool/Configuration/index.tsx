import { Stack } from '@centrifuge/fabric'
import { useParams } from 'react-router'
import { useDebugFlags } from '../../../components/DebugFlags'
import { LoadBoundary } from '../../../components/LoadBoundary'
import { PageWithSideBar } from '../../../components/PageWithSideBar'
import { useCanActAsPoolAdmin } from '../../../utils/usePermissions'
import { IssuerPoolHeader } from '../Header'
import { Admins } from './Admins'
import { Details } from './Details'
import { EpochAndTranches } from './EpochAndTranches'
import { Issuer } from './Issuer'
import { LoanTemplates } from './LoanTemplates'
import { PoolConfig } from './PoolConfig'
import { WriteOffGroups } from './WriteOffGroups'

export function IssuerPoolConfigurationPage() {
  return (
    <PageWithSideBar>
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
      {useCanActAsPoolAdmin(poolId) && (
        <>
          <Details />
          <Issuer />
          <EpochAndTranches />
          <WriteOffGroups />
          <Admins />
          <LoanTemplates />
          {editPoolConfig && <PoolConfig poolId={poolId} />}
        </>
      )}
    </Stack>
  )
}
