import { Pool } from '@centrifuge/centrifuge-js'
import * as React from 'react'
import { useParams } from 'react-router'
import { LoadBoundary } from '../../../components/LoadBoundary'
import { PageWithSideBar } from '../../../components/PageWithSideBar'
import { ReportComponent } from '../../../components/Report'
import { ReportContextProvider } from '../../../components/Report/ReportContext'
import { ReportFilter } from '../../../components/Report/ReportFilter'
import { Spinner } from '../../../components/Spinner'
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
      <PageWithSideBar>
        <PoolDetailHeader />

        {pool && <ReportFilter pool={pool} />}

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

  return (
    <React.Suspense fallback={<Spinner />}>
      <ReportComponent pool={pool} />
    </React.Suspense>
  )
}
