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
  const isReportingTab = location.pathname.includes('reporting')
  const { pid: poolId } = params

  if (!poolId) throw new Error('Pool not found')

  return (
    <ReportContextProvider>
      {header}

      {isReportingTab ? <ReportFilter poolId={poolId} /> : <DataFilter poolId={poolId} />}

      <LoadBoundary>
        <PoolDetailReporting poolId={poolId} isReportingTab={isReportingTab} />
      </LoadBoundary>
    </ReportContextProvider>
  )
}

function PoolDetailReporting({ poolId, isReportingTab }: { poolId: string; isReportingTab: boolean }) {
  const pool = usePool(poolId) as Pool
  const contentWrapperRef = React.useRef<HTMLDivElement>(null)

  if (!poolId || !pool) {
    return <Spinner mt={2} />
  }

  // We want to scroll within the table and not the page,
  // this way we can keep the filters on top of the page while scrolling on the table
  React.useEffect(() => {
    const contentWrapper = document.getElementById('content-wrapper')

    if (contentWrapper && !isReportingTab) {
      contentWrapper.style.overflow = 'hidden'
    }

    return () => {
      if (contentWrapper) {
        contentWrapper.style.overflow = ''
      }
    }
  }, [isReportingTab])

  return (
    <div ref={contentWrapperRef}>
      <React.Suspense fallback={<Spinner mt={2} />}>
        <ReportComponent pool={pool} />
      </React.Suspense>
    </div>
  )
}
