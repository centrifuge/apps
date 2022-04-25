import { feeToApr, formatCurrencyAmount } from '@centrifuge/centrifuge-js'
import { Stack, Text } from '@centrifuge/fabric'
import { BN } from 'bn.js'
import * as React from 'react'
import { useParams } from 'react-router'
import { useTheme } from 'styled-components'
import { IssuerSection } from '../../../components/IssuerSection'
import { LoadBoundary } from '../../../components/LoadBoundary'
import { PageSummary } from '../../../components/PageSummary'
import { PageWithSideBar } from '../../../components/PageWithSideBar'
import { TokenListByPool } from '../../../components/TokenListByPool'
import { Tooltips } from '../../../components/Tooltips'
import { getAge } from '../../../utils/date'
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

  const valueLocked = React.useMemo(
    () =>
      pool?.tranches
        .reduce((prev, curr) => {
          return new BN(prev).add(
            new BN(curr.totalIssuance).mul(new BN(curr.tokenPrice)).div(new BN(10).pow(new BN(27)))
          )
        }, new BN('0'))
        .toString(),
    [pool]
  )

  const pageSummaryData = [
    { label: <Tooltips type="assetClass" />, value: metadata?.pool?.asset.class },
    { label: <Tooltips type="valueLocked" />, value: formatCurrencyAmount(valueLocked, pool?.currency) },
    { label: <Tooltips type="age" />, value: getAge(pool?.createdAt) },
    { label: <Tooltips type="averageAssetMaturity" />, value: avgMaturity },
  ]

  const tokens = pool?.tranches
    .map((tranche) => {
      return {
        apy: tranche?.interestPerSec ? feeToApr(tranche?.interestPerSec) : '',
        protection: tranche.ratio,
        name: tranche.name,
        symbol: metadata?.tranches?.find((_, index) => index === tranche.index)?.symbol || '',
        poolName: metadata?.pool?.name,
        index: tranche.index,
        poolId: pid,
      }
    })
    .reverse()

  return (
    <>
      <PageSummary data={pageSummaryData} />
      {tokens && tokens.length && (
        <Stack
          p="3"
          gap="2"
          as="section"
          style={{
            boxShadow: `0 1px 0 ${theme.colors.borderSecondary}`,
          }}
        >
          <Text variant="heading2">Investment Tokens</Text>
          <TokenListByPool tokens={tokens} />
        </Stack>
      )}
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
    </>
  )
}
