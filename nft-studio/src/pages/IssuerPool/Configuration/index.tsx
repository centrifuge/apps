import { Stack } from '@centrifuge/fabric'
import * as React from 'react'
import { useParams } from 'react-router'
import { LoadBoundary } from '../../../components/LoadBoundary'
import { PageWithSideBar } from '../../../components/PageWithSideBar'
import { useIsPoolAdmin } from '../../../utils/usePermissions'
import { IssuerPoolHeader } from '../Header'
import { Admins } from './Admins'

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

  return <Stack>{isPoolAdmin && <Admins />}</Stack>
}
