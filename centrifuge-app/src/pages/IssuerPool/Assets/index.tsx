import { Stack } from '@centrifuge/fabric'
import * as React from 'react'
import { useParams } from 'react-router'
import { LoadBoundary } from '../../../components/LoadBoundary'
import { PageWithSideBar } from '../../../components/PageWithSideBar'
import { RouterLinkButton } from '../../../components/RouterLinkButton'
import { config } from '../../../config'
import { useAddress } from '../../../utils/useAddress'
import { usePermissions } from '../../../utils/usePermissions'
import { PoolDetailAssets } from '../../Pool/Assets'
import { IssuerPoolHeader } from '../Header'

export const IssuerPoolAssetPage: React.FC = () => {
  return (
    <PageWithSideBar sidebar={<PoolDetailAssetsSideBar />}>
      <IssuerPoolHeader />
      <LoadBoundary>
        <PoolDetailAssets />
      </LoadBoundary>
    </PageWithSideBar>
  )
}

const PoolDetailAssetsSideBar: React.FC = () => {
  const { pid } = useParams<{ pid: string }>()
  const address = useAddress()
  const permissions = usePermissions(address)
  const borrowerPermission = permissions?.pools[pid]?.roles.includes('Borrower')

  return (
    <Stack px={8}>
      {borrowerPermission && config.useDocumentNfts && (
        <RouterLinkButton to={{ pathname: `/issuer/create-asset`, state: { pid } }} variant="secondary" small>
          Create Asset
        </RouterLinkButton>
      )}
    </Stack>
  )
}
