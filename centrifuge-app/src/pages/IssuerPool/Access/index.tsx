import { Stack } from '@centrifuge/fabric'
import { useParams } from 'react-router'
import { useDebugFlags } from '../../../components/DebugFlags'
import { LayoutBase } from '../../../components/LayoutBase'
import { LoadBoundary } from '../../../components/LoadBoundary'
import { PendingMultisigs } from '../../../components/PendingMultisigs'
import { usePoolAdmin } from '../../../utils/usePermissions'
import { Admins } from '../Configuration/Admins'
import { IssuerPoolHeader } from '../Header'
import { AssetOriginators } from './AssetOriginators'
import { PoolManagers } from './PoolManagers'

export function IssuerPoolAccessPage() {
  return (
    <LayoutBase>
      <IssuerPoolHeader />
      <LoadBoundary>
        <IssuerPoolAccess />
      </LoadBoundary>
    </LayoutBase>
  )
}

function IssuerPoolAccess() {
  const { pid: poolId } = useParams<{ pid: string }>()
  const { editAdminConfig } = useDebugFlags()

  return (
    <Stack>
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
