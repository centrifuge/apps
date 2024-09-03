import { LoadBoundary } from '../../../components/LoadBoundary'
import { PoolDetailOverview } from '../../Pool/Overview'
import { IssuerPoolHeader } from '../Header'

export function IssuerPoolOverviewPage() {
  return (
    <>
      <IssuerPoolHeader />
      <LoadBoundary>
        <PoolDetailOverview />
      </LoadBoundary>
    </>
  )
}
