import { LayoutBase } from '../../../components/LayoutBase'
import { LoadBoundary } from '../../../components/LoadBoundary'
import { PoolDetailOverview } from '../../Pool/Overview'
import { IssuerPoolHeader } from '../Header'

export function IssuerPoolOverviewPage() {
  return (
    <LayoutBase>
      <IssuerPoolHeader />
      <LoadBoundary>
        <PoolDetailOverview />
      </LoadBoundary>
    </LayoutBase>
  )
}
