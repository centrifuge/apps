import { LayoutBase } from '../../../components/LayoutBase'
import { LoadBoundary } from '../../../components/LoadBoundary'
import { PoolFees } from '../../../components/PoolFees'
import { PoolDetailHeader } from '../Header'

export function PoolFeesTab() {
  return (
    <LayoutBase>
      <PoolDetailHeader />
      <LoadBoundary>
        <PoolFees />
      </LoadBoundary>
    </LayoutBase>
  )
}
