import { Pool } from '@centrifuge/centrifuge-js'
import * as React from 'react'
import { useParams } from 'react-router'
import { LoadBoundary } from '../../../components/LoadBoundary'
import { PageSection } from '../../../components/PageSection'
import { PageWithSideBar } from '../../../components/PageWithSideBar'
import { ReportComponent } from '../../../components/Report'
import { ReportContext, ReportContextProvider } from '../../../components/Report/ReportContext'
import { ReportFilter } from '../../../components/Report/ReportFilter'
import { Spinner } from '../../../components/Spinner'
import { formatDate } from '../../../utils/date'
import { usePool } from '../../../utils/usePools'
import { PoolDetailHeader } from '../Header'

export type GroupBy = 'day' | 'month'

export type Report = 'pool-balance' | 'asset-list' | 'investor-tx' | 'borrower-tx'

const titleByReport: { [key: string]: string } = {
  'pool-balance': 'Pool balance',
  'asset-list': 'Asset list',
  'investor-tx': 'Investor transactions',
  'borrower-tx': 'Borrower transactions',
}

export function PoolDetailReportingTab() {
  const { pid: poolId } = useParams<{ pid: string }>()
  const pool = usePool(poolId) as Pool

  return (
    <ReportContextProvider>
      <PageWithSideBar sidebar={pool && <ReportFilter pool={pool} />}>
        <PoolDetailHeader />

        <LoadBoundary>
          <PoolDetailReporting pool={pool} />
        </LoadBoundary>
      </PageWithSideBar>
    </ReportContextProvider>
  )
}

export function PoolDetailReporting({ pool }: { pool: Pool }) {
  if (!pool) {
    return <Spinner />
  }

  const { report, startDate, endDate } = React.useContext(ReportContext)

  return (
    <PageSection title={titleByReport[report]} titleAddition={`${formatDate(startDate)} - ${formatDate(endDate)}`}>
      <React.Suspense fallback={<Spinner />}>
        <ReportComponent pool={pool} />
      </React.Suspense>
    </PageSection>
  )
}
