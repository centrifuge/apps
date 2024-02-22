import { LayoutBase } from '../../../components/LayoutBase'
import { LoadBoundary } from '../../../components/LoadBoundary'
import { PoolDetailAssets } from '../../Pool/Assets'
import { IssuerPoolHeader } from '../Header'

export function IssuerPoolAssetPage() {
  return (
    <LayoutBase>
      <IssuerPoolHeader />
      <LoadBoundary>
        <PoolDetailAssets />
      </LoadBoundary>
    </LayoutBase>
  )
}
