import { Stack } from '@centrifuge/fabric'
import { useParams } from 'react-router'
import { useDebugFlags } from '../../../components/DebugFlags'
import { LoadBoundary } from '../../../components/LoadBoundary'
import { PageWithSideBar } from '../../../components/PageWithSideBar'
import { PendingMultisigs } from '../../../components/PendingMultisigs'
import { usePoolAdmin } from '../../../utils/usePermissions'
import { Admins } from '../Configuration/Admins'
import { IssuerPoolHeader } from '../Header'
import { AssetOriginators } from './AssetOriginators'
import { PoolManagers } from './PoolManagers'

export function IssuerPoolAccessPage() {
  const { pid: poolId } = useParams<{ pid: string }>()
  return (
    <PageWithSideBar sidebar={<PendingMultisigs poolId={poolId} />}>
      <IssuerPoolHeader />
      <LoadBoundary>
        <IssuerPoolAccess />
      </LoadBoundary>
    </PageWithSideBar>
  )
}

function IssuerPoolAccess() {
  const { pid: poolId } = useParams<{ pid: string }>()
  const { editAdminConfig } = useDebugFlags()

  return (
    <Stack>
      {!!usePoolAdmin(poolId) && (
        <>
          <PoolManagers poolId={poolId} />
          <AssetOriginators poolId={poolId} />
          {editAdminConfig && <Admins poolId={poolId} />}
        </>
      )}
    </Stack>
  )
}
