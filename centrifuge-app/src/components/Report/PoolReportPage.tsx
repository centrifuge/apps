import { Pool } from '@centrifuge/centrifuge-js'
import * as React from 'react'
import { useLocation, useParams } from 'react-router'
import { ReportComponent } from '.'
import { usePool } from '../../utils/usePools'
import { LoadBoundary } from '../LoadBoundary'
import { Spinner } from '../Spinner'
import { DataFilter } from './DataFilter'
import { ReportContextProvider } from './ReportContext'
import { ReportFilter } from './ReportFilter'

export function PoolReportPage({ header }: { header: React.ReactNode }) {
  const params = useParams<{ pid: string; '*': string }>()
  const location = useLocation()
  const { pid: poolId } = params

  if (!poolId) throw new Error('Pool not found')

  const pool = usePool(poolId) as Pool

  return (
    <ReportContextProvider>
      {header}

      {pool && location.pathname.includes('reporting') ? <ReportFilter pool={pool} /> : <DataFilter pool={pool} />}

      <LoadBoundary>
        <PoolDetailReporting pool={pool} />
      </LoadBoundary>
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
