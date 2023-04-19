import { Stack } from '@centrifuge/fabric'
import * as React from 'react'
import { useParams } from 'react-router'
import { useDebugFlags } from '../../../components/DebugFlags'
import { LoadBoundary } from '../../../components/LoadBoundary'
import { PageWithSideBar } from '../../../components/PageWithSideBar'
import { usePoolAdmin } from '../../../utils/usePermissions'
import { Admins } from '../Configuration/Admins'
import { IssuerPoolHeader } from '../Header'
import { AssetOriginators } from './AssetOriginators'
import { PoolManagers } from './PoolManagers'

export const IssuerPoolAccessPage: React.FC = () => {
  return (
    <PageWithSideBar>
      <IssuerPoolHeader />
      <LoadBoundary>
        <IssuerPoolAccess />
      </LoadBoundary>
    </PageWithSideBar>
  )
}

const IssuerPoolAccess: React.FC = () => {
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
