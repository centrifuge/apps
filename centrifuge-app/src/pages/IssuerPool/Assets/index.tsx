import { Stack } from '@centrifuge/fabric'
import * as React from 'react'
import { useParams } from 'react-router'
import { LoadBoundary } from '../../../components/LoadBoundary'
import { PageWithSideBar } from '../../../components/PageWithSideBar'
import { RouterLinkButton } from '../../../components/RouterLinkButton'
import { config } from '../../../config'
import { useSuitableAccounts } from '../../../utils/usePermissions'
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

  const suitableAccounts = useSuitableAccounts({ poolId: pid, poolRole: ['Borrower'], proxyType: ['PodAuth'] })

  return (
    <Stack px={8}>
      {suitableAccounts.length > 0 && config.useDocumentNfts && (
        <RouterLinkButton to={`/issuer/${pid}/assets/create`} small>
          Create asset
        </RouterLinkButton>
      )}
    </Stack>
  )
}
