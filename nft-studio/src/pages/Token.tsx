import { feeToApr, formatCurrencyAmount, formatPercentage } from '@centrifuge/centrifuge-js'
import { Shelf, Stack, Text, Thumbnail } from '@centrifuge/fabric'
import BN from 'bn.js'
import * as React from 'react'
import { useParams } from 'react-router'
import { PageHeader } from '../components/PageHeader'
import { PageSummary } from '../components/PageSummary'
import { PageWithSideBar } from '../components/PageWithSideBar'
import { PoolCard } from '../components/PoolCard'
import { Tooltips } from '../components/Tooltips'
import { usePool, usePoolMetadata } from '../utils/usePools'

export const TokenDetailPage: React.FC = () => {
  return (
    <PageWithSideBar sidebar>
      <TokenDetail />
    </PageWithSideBar>
  )
}

const TokenDetail: React.FC = () => {
  const { pid: poolId, tid: trancheId } = useParams<{ pid: string; tid: string }>()
  const pool = usePool(poolId)
  const { data: metadata } = usePoolMetadata(pool)

  const token = React.useMemo(
    () => pool?.tranches.find((token) => token.index === parseInt(trancheId, 10)),
    [pool, trancheId]
  )

  const valueLocked = React.useMemo(
    () =>
      token?.tokenPrice
        ? new BN(token.totalIssuance)
            .mul(new BN(token.tokenPrice))
            .div(new BN(10).pow(new BN(27)))
            .toString()
        : '0',
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
            {feeToApr(token?.interestPerSec || new BN(0))}% <Text variant="body3">target</Text>
          </Text>
        ),
      },
      {
        label: <Tooltips type="protection" />,
        value: (
          <Text variant="heading3">
            {parseInt(trancheId, 10) > 0 ? (
              <Text>
                {formatPercentage(new BN(token?.ratio || ''), new BN(10).pow(new BN(27)))}{' '}
                <Text variant="body3">
                  minimum {formatPercentage(new BN(token?.minRiskBuffer || ''), new BN(10).pow(new BN(27)))}
                </Text>
              </Text>
            ) : (
              '0%'
            )}
          </Text>
        ),
      },
      { label: <Tooltips type="valueLocked" />, value: `${formatCurrencyAmount(valueLocked, pool?.currency)}` },
    ],
    [metadata, token, pool, trancheId, valueLocked]
  )

  return (
    <Stack gap={0} flex={1} mb="6">
      <PageHeader
        subtitle="Token"
        title={`${metadata?.pool?.name} ${token?.name}`}
        walletShown={false}
        icon={
          <Thumbnail
            size="large"
            label={metadata?.tranches?.find((_, index) => index === parseInt(trancheId, 10))?.symbol || ''}
          />
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
