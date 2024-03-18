import { LayoutBase } from '../../../components/LayoutBase'
import { LoadBoundary } from '../../../components/LoadBoundary'
import { PoolFees } from '../../../components/PoolFees'
import { IssuerPoolHeader } from '../Header'

export function IssuerPoolFeesPage() {
  return (
    <LayoutBase>
      <IssuerPoolHeader />
      <LoadBoundary>
        <PoolFees />
      </LoadBoundary>
    </LayoutBase>
  )
}
