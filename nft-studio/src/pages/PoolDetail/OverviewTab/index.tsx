import { Button, IconArrowRight, IconChevronLeft, Stack, Text } from '@centrifuge/fabric'
import * as React from 'react'
import { useHistory, useParams } from 'react-router'
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
import { useAddress } from '../../../utils/useAddress'
import { useAverageMaturity } from '../../../utils/useAverageMaturity'
import { useCentrifugeTransaction } from '../../../utils/useCentrifugeTransaction'
import { usePermissions } from '../../../utils/usePermissions'
import { usePool, usePoolMetadata } from '../../../utils/usePools'
import { PoolDetailHeader } from '../Header'

export const PoolDetailOverviewTab: React.FC = () => {
  const { pid: poolId } = useParams<{ pid: string }>()
  const pool = usePool(poolId)
  const address = useAddress()
  const permissions = usePermissions(address)
  const history = useHistory()

  const isPoolAdmin = React.useMemo(
    () => !!(address && permissions?.pools[poolId]?.roles.includes('PoolAdmin')),
    [poolId, address, permissions]
  )
  const { execute: closeEpochTx } = useCentrifugeTransaction('Close epoch', (cent) => cent.pools.closeEpoch, {
    onSuccess: () => {
      console.log('Epoch closed successfully')
    },
  })

  const closeEpoch = async () => {
    if (!pool) return
    closeEpochTx([pool.id])
  }

  return (
    <PageWithSideBar sidebar>
      <PoolDetailHeader
        actions={
          <>
            {isPoolAdmin && (
              <Button small variant="text" icon={<IconArrowRight width="16" />} onClick={closeEpoch} disabled={!pool}>
                Close epoch
              </Button>
            )}
            <Button onClick={() => history.push('/pools')} small icon={<IconChevronLeft width="16" />} variant="text">
              Pools
            </Button>
          </>
        }
      />
      <LoadBoundary>
        <PoolDetailOverview />
      </LoadBoundary>
    </PageWithSideBar>
  )
}

const PoolDetailOverview: React.FC = () => {
  const { pid: poolId } = useParams<{ pid: string }>()
  const pool = usePool(poolId)
  const { data: metadata } = usePoolMetadata(pool)
  const avgMaturity = useAverageMaturity(poolId)
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
