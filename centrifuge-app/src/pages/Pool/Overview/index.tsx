import * as React from 'react'
import { useParams } from 'react-router'
import { IssuerSection } from '../../../components/IssuerSection'
import { LoadBoundary } from '../../../components/LoadBoundary'
import { PageSection } from '../../../components/PageSection'
import { PageSummary } from '../../../components/PageSummary'
import { PageWithSideBar } from '../../../components/PageWithSideBar'
import RiskGroupList from '../../../components/RiskGroupList'
import { Spinner } from '../../../components/Spinner'
import { TokenListByPool } from '../../../components/TokenListByPool'
import { Tooltips } from '../../../components/Tooltips'
import { formatDate, getAge } from '../../../utils/date'
import { formatBalance } from '../../../utils/formatting'
import { useAverageMaturity } from '../../../utils/useAverageMaturity'
import { usePool, usePoolMetadata } from '../../../utils/usePools'
import { PoolDetailHeader } from '../Header'

const PoolAssetReserveChart = React.lazy(() => import('../../../components/Charts/PoolAssetReserveChart'))

export const PoolDetailOverviewTab: React.FC = () => {
  return (
    <PageWithSideBar>
      <PoolDetailHeader />
      <LoadBoundary>
        <PoolDetailOverview />
      </LoadBoundary>
    </PageWithSideBar>
  )
}

export const PoolDetailOverview: React.FC = () => {
  const { pid: poolId } = useParams<{ pid: string }>()
  const pool = usePool(poolId)
  const { data: metadata } = usePoolMetadata(pool)
  const avgMaturity = useAverageMaturity(poolId)

  const pageSummaryData = [
    { label: <Tooltips type="assetClass" />, value: metadata?.pool?.asset.class },
    { label: <Tooltips type="valueLocked" />, value: formatBalance(pool?.value || 0, pool?.currency) },
    { label: <Tooltips type="age" />, value: getAge(pool?.createdAt) },
    { label: <Tooltips type="averageAssetMaturity" />, value: avgMaturity },
  ]

  return (
    <>
      <PageSummary data={pageSummaryData} />
      <PageSection title="Pool value, asset value & reserve" titleAddition={formatDate(new Date().toString())}>
        <React.Suspense fallback={<Spinner />}>
          <PoolAssetReserveChart />
        </React.Suspense>
      </PageSection>
      <PageSection title="Investment Tokens">
        <TokenListByPool />
      </PageSection>
      <PageSection title="Issuer">
        <IssuerSection metadata={metadata} />
      </PageSection>
      <PageSection title=" Asset portfolio" titleAddition="By risk groups">
        <RiskGroupList />
      </PageSection>
    </>
  )
}
