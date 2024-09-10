import { LoadBoundary } from '../../../components/LoadBoundary'
import { PoolFees } from '../../../components/PoolFees'
import { IssuerPoolHeader } from '../Header'

export function IssuerPoolFeesPage() {
  return (
    <>
      <IssuerPoolHeader />
      <LoadBoundary>
        <PoolFees />
      </LoadBoundary>
    </>
  )
}
