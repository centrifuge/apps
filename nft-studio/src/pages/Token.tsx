import { Button, IconChevronLeft, Shelf, Stack, Text, Thumbnail } from '@centrifuge/fabric'
import * as React from 'react'
import { useHistory, useParams } from 'react-router'
import { PageHeader } from '../components/PageHeader'
import { PageSummary } from '../components/PageSummary'
import { PageWithSideBar } from '../components/PageWithSideBar'
import { PoolCard } from '../components/PoolCard'
import { TextWithPlaceholder } from '../components/TextWithPlaceholder'
import { Tooltips } from '../components/Tooltips'
import { formatBalance, formatPercentage } from '../utils/formatting'
import { usePool, usePoolMetadata } from '../utils/usePools'

export const TokenDetailPage: React.FC = () => {
  return (
    <PageWithSideBar sidebar>
      <TokenDetail />
    </PageWithSideBar>
  )
}

const TokenDetail: React.FC = () => {
  const history = useHistory()
  const { pid: poolId, tid: trancheId } = useParams<{ pid: string; tid: string }>()
  const pool = usePool(poolId)
  const { data: metadata, isLoading: isMetadataLoading } = usePoolMetadata(pool)
  const tranche = pool?.tranches.find((t) => t.id === trancheId)
  const trancheMeta = tranche ? metadata?.tranches?.[tranche.seniority] : null

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
            {parseInt(trancheId, 10) > 0 ? (
              <Text>
                {formatPercentage(token?.ratio.toPercent() ?? 0)}{' '}
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
    [metadata, token, pool, trancheId, valueLocked]
  )

  return (
    <Stack gap={0} flex={1} mb="6">
      <PageHeader
        subtitle="Token"
        title={<TextWithPlaceholder isLoading={isMetadataLoading}> {trancheMeta?.name}</TextWithPlaceholder>}
        walletShown={false}
        icon={<Thumbnail size="large" label={trancheMeta?.symbol || ''} />}
        actions={
          <Button
            onClick={() => history.push(`/pools/${poolId}`)}
            small
            icon={<IconChevronLeft width="16" />}
            variant="text"
          >
            {metadata?.pool?.name}
          </Button>
        }
      />
      {pool ? (
        <>
          <PageSummary data={pageSummaryData} />
          <Stack m="3" gap="2" as="section">
            <Text variant="heading2">Token pool</Text>
            <PoolCard pool={pool} metadata={metadata} />
          </Stack>
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
