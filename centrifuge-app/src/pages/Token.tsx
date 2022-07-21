import { Shelf, Stack, Text, Thumbnail } from '@centrifuge/fabric'
import * as React from 'react'
import { useParams } from 'react-router'
import { InvestRedeem } from '../components/InvestRedeem'
import { PageHeader } from '../components/PageHeader'
import { PageSection } from '../components/PageSection'
import { PageSummary } from '../components/PageSummary'
import { PageWithSideBar } from '../components/PageWithSideBar'
import { PoolCard } from '../components/PoolCard'
import { Tooltips } from '../components/Tooltips'
import { formatBalance, formatPercentage } from '../utils/formatting'
import { usePool, usePoolMetadata } from '../utils/usePools'

export const TokenDetailPage: React.FC = () => {
  const { pid, tid } = useParams<{ pid: string; tid: string }>()
  return (
    <PageWithSideBar sidebar={<InvestRedeem poolId={pid} trancheId={tid} />}>
      <TokenDetail />
    </PageWithSideBar>
  )
}

const TokenDetail: React.FC = () => {
  const { pid: poolId, tid: trancheId } = useParams<{ pid: string; tid: string }>()
  const pool = usePool(poolId)
  const { data: metadata } = usePoolMetadata(pool)
  const tranche = pool?.tranches.find((t) => t.id === trancheId)
  const trancheMeta = tranche ? metadata?.tranches?.[tranche.id] : null

  const token = React.useMemo(() => pool?.tranches.find((token) => token.id === trancheId), [pool, trancheId])

  const valueLocked = React.useMemo(
    () => (token?.tokenPrice ? token.totalIssuance.toDecimal().mul(token.tokenPrice.toDecimal()) : 0),
    [token]
  )

  const pageSummaryData = React.useMemo(
    () => [
      {
        label: <Tooltips type="assetClass" />,
        value: metadata?.pool?.asset.class,
      },
      {
        label: <Tooltips type="apy" />,
        value: (
          <Text variant="heading3">
            {formatPercentage(token?.interestRatePerSec?.toAprPercent() ?? 0)} <Text variant="body3">target</Text>
          </Text>
        ),
      },
      {
        label: <Tooltips type="protection" />,
        value: (
          <Text variant="heading3">
            {tranche?.seniority! > 0 ? (
              <Text>
                {formatPercentage(token?.currentRiskBuffer ?? 0)}{' '}
                <Text variant="body3">minimum {formatPercentage(token?.minRiskBuffer?.toPercent() ?? 0)}</Text>
              </Text>
            ) : (
              '0%'
            )}
          </Text>
        ),
      },
      { label: <Tooltips type="valueLocked" />, value: `${formatBalance(valueLocked, pool?.currency)}` },
    ],
    [metadata, token, pool, valueLocked, tranche?.seniority]
  )

  return (
    <Stack gap={0} flex={1} mb="6">
      <PageHeader
        subtitle="Token"
        title={
          <Text>
            {metadata?.pool?.name} {trancheMeta?.name}
          </Text>
        }
        icon={<Thumbnail size="large" label={trancheMeta?.symbol || ''} />}
        parent={{ to: `/investments/tokens`, label: 'Tokens' }}
      />
      {pool ? (
        <>
          <PageSummary data={pageSummaryData} />
          <PageSection title="Token pool">
            <PoolCard pool={pool} metadata={metadata} />
          </PageSection>
        </>
      ) : (
        <Shelf justifyContent="center" textAlign="center">
          <Text variant="heading2" color="textSecondary">
            Token does not exist
          </Text>
        </Shelf>
      )}
    </Stack>
  )
}
