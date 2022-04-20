import { feeToApr, formatCurrencyAmount, formatPercentage } from '@centrifuge/centrifuge-js'
import { Avatar, Shelf, Stack, Text } from '@centrifuge/fabric'
import BN from 'bn.js'
import * as React from 'react'
import { useRouteMatch } from 'react-router'
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
  const {
    params: { pid: poolId, tid: trancheId },
  } = useRouteMatch<{ pid: string; tid: string }>()
  const pool = usePool(poolId)
  const token = pool?.tranches.find((token) => token.index === parseInt(trancheId, 10))
  const { data: metadata } = usePoolMetadata(pool)

  const valueLocked = token?.tokenPrice
    ? new BN(token.totalIssuance)
        .mul(new BN(token.tokenPrice))
        .div(new BN(10).pow(new BN(27)))
        .toString()
    : '0'

  const pageSummaryData = [
    {
      label: <Tooltips type="assetClass" />,
      value: metadata?.pool?.asset.class,
    },
    {
      label: <Tooltips type="apy" />,
      value: (
        <Text variant="heading3">
          {feeToApr(token?.interestPerSec || '')}% <Text variant="body3">target</Text>
        </Text>
      ),
    },
    {
      label: <Tooltips type="protection" />,
      value: (
        <Text variant="heading3">
          {parseInt(trancheId) > 0 ? (
            <Text>
              {formatPercentage(new BN(token?.ratio || ''), new BN(10).pow(new BN(27)))}{' '}
              <Text variant="body3">minimun 15%</Text>
            </Text>
          ) : (
            '0%'
          )}
        </Text>
      ),
    },
    { label: <Tooltips type="valueLocked" />, value: `${formatCurrencyAmount(valueLocked, pool?.currency)}` },
  ]

  return (
    <Stack gap={0} flex={1} mb="6">
      <PageHeader
        subtitle="Token"
        title={`${metadata?.pool?.name} ${token?.name}`}
        walletShown={false}
        icon={
          <Avatar
            size="large"
            label={metadata?.tranches?.find((_, index) => index === parseInt(trancheId))?.symbol || ''}
          />
        }
      />
      {pool ? (
        <>
          <PageSummary data={pageSummaryData} />
          <PoolCard pool={pool} metadata={metadata} />
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
