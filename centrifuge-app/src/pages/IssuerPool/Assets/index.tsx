import { LoadBoundary } from '../../../components/LoadBoundary'
import { PoolDetailAssets } from '../../Pool/Assets'
import { IssuerPoolHeader } from '../Header'

export function IssuerPoolAssetPage() {
  return (
    <>
      <IssuerPoolHeader />
      <LoadBoundary>
        <PoolDetailAssets />
      </LoadBoundary>
    </>
  )
}
