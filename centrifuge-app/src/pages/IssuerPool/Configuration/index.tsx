import { Stack } from '@centrifuge/fabric'
import * as React from 'react'
import { useParams } from 'react-router'
import { useDebugFlags } from '../../../components/DebugFlags'
import { LoadBoundary } from '../../../components/LoadBoundary'
import { PageWithSideBar } from '../../../components/PageWithSideBar'
import { useIsPoolAdmin } from '../../../utils/usePermissions'
import { IssuerPoolHeader } from '../Header'
import { Admins } from './Admins'
import { AssetTemplates } from './AssetTemplates'
import { Details } from './Details'
import { Epoch } from './Epoch'
import { Issuer } from './Issuer'
import { PoolConfig } from './PoolConfig'
import { RiskGroups } from './RiskGroups'
import { Tranches } from './Tranches'
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
          <Epoch />
          <Tranches />
          <RiskGroups />
          <WriteOffGroups />
          <Admins />
          <AssetTemplates />
          {editPoolConfig && <PoolConfig poolId={poolId} />}
        </>
      )}
    </Stack>
  )
}
