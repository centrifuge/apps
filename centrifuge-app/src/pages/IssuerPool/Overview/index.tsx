import { useParams } from 'react-router'
import { LoadBoundary } from '../../../components/LoadBoundary'
import { PageWithSideBar } from '../../../components/PageWithSideBar'
import { PendingMultisigs } from '../../../components/PendingMultisigs'
import { PoolDetailOverview } from '../../Pool/Overview'
import { IssuerPoolHeader } from '../Header'

export function IssuerPoolOverviewPage() {
  const { pid: poolId } = useParams<{ pid: string }>()
  return (
    <PageWithSideBar sidebar={<PendingMultisigs poolId={poolId} />}>
      <IssuerPoolHeader />
      <LoadBoundary>
        <PoolDetailOverview />
      </LoadBoundary>
    </PageWithSideBar>
  )
}
