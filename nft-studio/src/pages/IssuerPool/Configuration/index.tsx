import { Stack } from '@centrifuge/fabric'
import * as React from 'react'
import { useParams } from 'react-router'
import { useDebugFlags } from '../../../components/DebugFlags'
import { LoadBoundary } from '../../../components/LoadBoundary'
import { PageWithSideBar } from '../../../components/PageWithSideBar'
import { useAddress } from '../../../utils/useAddress'
import { usePermissions } from '../../../utils/usePermissions'
import { IssuerPoolHeader } from '../Header'
import { Admins } from './Admins'
import { PoolConfig } from './PoolConfig'

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
  const address = useAddress()
  const permissions = usePermissions(address)
  const isPoolAdmin = address && permissions?.pools[poolId]?.roles.includes('PoolAdmin')
  const { editPoolConfig } = useDebugFlags()

  return (
    <Stack>
      {isPoolAdmin && (
        <>
          <Admins />
          {editPoolConfig && <PoolConfig poolId={poolId} />}
        </>
      )}
    </Stack>
  )
}
