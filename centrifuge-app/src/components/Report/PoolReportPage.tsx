import { Pool } from '@centrifuge/centrifuge-js'
import * as React from 'react'
import { useParams } from 'react-router'
import { ReportComponent } from '.'
import { usePool } from '../../utils/usePools'
import { LoadBoundary } from '../LoadBoundary'
import { PageWithSideBar } from '../PageWithSideBar'
import { Spinner } from '../Spinner'
import { ReportContextProvider } from './ReportContext'
import { ReportFilter } from './ReportFilter'

export function PoolReportPage({ header }: { header: React.ReactNode }) {
  const { pid: poolId } = useParams<{ pid: string }>()
  const pool = usePool(poolId) as Pool

  return (
    <ReportContextProvider>
      <PageWithSideBar>
        {header}

        {pool && <ReportFilter pool={pool} />}

        <LoadBoundary>
          <PoolDetailReporting pool={pool} />
        </LoadBoundary>
      </PageWithSideBar>
    </ReportContextProvider>
  )
}

function PoolDetailReporting({ pool }: { pool: Pool }) {
  if (!pool) {
    return <Spinner mt={2} />
  }

  return (
    <React.Suspense fallback={<Spinner mt={2} />}>
      <ReportComponent pool={pool} />
    </React.Suspense>
  )
}
