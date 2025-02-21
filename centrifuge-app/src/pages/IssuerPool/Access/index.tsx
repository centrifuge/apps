import { Stack } from '@centrifuge/fabric'
import { useParams } from 'react-router'
import { AccessDrawer } from '../../../components/Dashboard/AccessDrawer'
import { useDebugFlags } from '../../../components/DebugFlags'
import { LoadBoundary } from '../../../components/LoadBoundary'
import { PendingMultisigs } from '../../../components/PendingMultisigs'
import { usePoolAdmin } from '../../../utils/usePermissions'
import { Admins } from '../Configuration/Admins'
import { IssuerPoolHeader } from '../Header'
import { AssetOriginators } from './AssetOriginators'
import { PoolManagers } from './PoolManagers'

export function IssuerPoolAccessPage() {
  return (
    <>
      <IssuerPoolHeader />
      <LoadBoundary>
        <IssuerPoolAccess />
      </LoadBoundary>
    </>
  )
}

function IssuerPoolAccess() {
  const { pid: poolId } = useParams<{ pid: string }>()

  if (!poolId) throw new Error('Pool not found')

  const { editAdminConfig } = useDebugFlags()

  return (
    <Stack>
      <AccessDrawer isOpen onClose={() => {}} poolIds={[poolId]} />
      <PendingMultisigs poolId={poolId} />
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
