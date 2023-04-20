import { Stack } from '@centrifuge/fabric'
import { useParams } from 'react-router'
import { LoadBoundary } from '../../../components/LoadBoundary'
import { PageWithSideBar } from '../../../components/PageWithSideBar'
import { PendingMultisigs } from '../../../components/PendingMultisigs'
import { RouterLinkButton } from '../../../components/RouterLinkButton'
import { config } from '../../../config'
import { useSuitableAccounts } from '../../../utils/usePermissions'
import { PoolDetailAssets } from '../../Pool/Assets'
import { IssuerPoolHeader } from '../Header'

export function IssuerPoolAssetPage() {
  const { pid: poolId } = useParams<{ pid: string }>()
  return (
    <PageWithSideBar
      sidebar={
        <>
          <PoolDetailAssetsSideBar />
          <PendingMultisigs poolId={poolId} />
        </>
      }
    >
      <IssuerPoolHeader />
      <LoadBoundary>
        <PoolDetailAssets />
      </LoadBoundary>
    </PageWithSideBar>
  )
}

function PoolDetailAssetsSideBar() {
  const { pid } = useParams<{ pid: string }>()

  const canCreateAssets =
    useSuitableAccounts({ poolId: pid, poolRole: ['Borrower'], proxyType: ['PodAuth'] }).length > 0

  return (
    <Stack px={8}>
      {canCreateAssets && config.useDocumentNfts && (
        <RouterLinkButton to={`/issuer/${pid}/assets/create`} small>
          Create asset
        </RouterLinkButton>
      )}
    </Stack>
  )
}
