import { LoadBoundary } from '../../../components/LoadBoundary'
import { PoolFees } from '../../../components/PoolFees'
import { PoolDetailHeader } from '../Header'

export function PoolFeesTab() {
  return (
    <>
      <PoolDetailHeader />
      <LoadBoundary>
        <PoolFees />
      </LoadBoundary>
    </>
  )
}
