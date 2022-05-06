import { Stack, Text } from '@centrifuge/fabric'
import * as React from 'react'
import { useParams } from 'react-router'
import { useTheme } from 'styled-components'
import { IssuerSection } from '../../../components/IssuerSection'
import { LoadBoundary } from '../../../components/LoadBoundary'
import { PageSummary } from '../../../components/PageSummary'
import { PageWithSideBar } from '../../../components/PageWithSideBar'
import { ReserveChart } from '../../../components/ReserveChart'
import { RiskGroupList } from '../../../components/RiskGroupList'
import { TokenListByPool } from '../../../components/TokenListByPool'
import { Tooltips } from '../../../components/Tooltips'
import { getAge } from '../../../utils/date'
import { formatBalance } from '../../../utils/formatting'
import { useAverageMaturity } from '../../../utils/useAverageMaturity'
import { usePool, usePoolMetadata } from '../../../utils/usePools'
import { PoolDetailHeader } from '../Header'

export const PoolDetailOverviewTab: React.FC = () => {
  return (
    <PageWithSideBar sidebar>
      <PoolDetailHeader />
      <LoadBoundary>
        <PoolDetailOverview />
      </LoadBoundary>
    </PageWithSideBar>
  )
}

const PoolDetailOverview: React.FC = () => {
  const { pid } = useParams<{ pid: string }>()
  const pool = usePool(pid)
  const { data: metadata } = usePoolMetadata(pool)
  const avgMaturity = useAverageMaturity(pid)
  const theme = useTheme()

  const pageSummaryData = [
    { label: <Tooltips type="assetClass" />, value: metadata?.pool?.asset.class },
    { label: <Tooltips type="valueLocked" />, value: formatBalance(pool?.value || 0, pool?.currency) },
    { label: <Tooltips type="age" />, value: getAge(pool?.createdAt) },
    { label: <Tooltips type="averageAssetMaturity" />, value: avgMaturity },
  ]

  return (
    <>
      <PageSummary data={pageSummaryData} />
      <Stack
        p="3"
        gap="2"
        as="section"
        style={{
          boxShadow: `0 1px 0 ${theme.colors.borderSecondary}`,
        }}
      >
        <Text variant="heading2">Pool value, asset value & reserve</Text>
        <ReserveChart />
      </Stack>
      <Stack
        p="3"
        gap="2"
        as="section"
        style={{
          boxShadow: `0 1px 0 ${theme.colors.borderSecondary}`,
        }}
      >
        <Text variant="heading2">Investment Tokens</Text>
        <TokenListByPool />
      </Stack>
      <Stack
        p="3"
        gap="1"
        as="section"
        style={{
          boxShadow: `0 1px 0 ${theme.colors.borderSecondary}`,
        }}
      >
        <Text variant="heading2">Issuer</Text>
        <IssuerSection metadata={metadata} p="3" />
      </Stack>
      <Stack
        p="3"
        gap="1"
        as="section"
        style={{
          boxShadow: `0 1px 0 ${theme.colors.borderSecondary}`,
        }}
      >
        <Text variant="heading2">
          Asset portfolio <Text variant="body3">By risk groups</Text>
        </Text>
        <RiskGroupList />
      </Stack>
    </>
  )
}
