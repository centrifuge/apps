import { Pool } from '@centrifuge/centrifuge-js'
import * as React from 'react'
import { useLocation, useParams } from 'react-router'
import { ReportComponent } from '.'
import { usePool } from '../../../src/utils/usePools'
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

  return (
    <ReportContextProvider>
      {header}

      {location.pathname.includes('reporting') ? <ReportFilter poolId={poolId} /> : <DataFilter poolId={poolId} />}

      <LoadBoundary>
        <PoolDetailReporting poolId={poolId} />
      </LoadBoundary>
    </ReportContextProvider>
  )
}

function PoolDetailReporting({ poolId }: { poolId: string }) {
  const pool = usePool(poolId) as Pool
  if (!poolId || !pool) {
    return <Spinner mt={2} />
  }

  return (
    <React.Suspense fallback={<Spinner mt={2} />}>
      <ReportComponent pool={pool} />
    </React.Suspense>
  )
}
