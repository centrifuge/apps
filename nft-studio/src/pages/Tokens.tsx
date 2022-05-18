import { Perquintill } from '@centrifuge/centrifuge-js'
import { Shelf, Stack, Text } from '@centrifuge/fabric'
import * as React from 'react'
import { PageHeader } from '../components/PageHeader'
import { PageSummary } from '../components/PageSummary'
import { PageWithSideBar } from '../components/PageWithSideBar'
import { TokenList, TokenTableData } from '../components/TokenList'
import { Tooltips } from '../components/Tooltips'
import { Dec } from '../utils/Decimal'
import { formatBalance } from '../utils/formatting'
import { useTokens } from '../utils/usePools'

export const TokenOverviewPage: React.FC = () => {
  return (
    <PageWithSideBar sidebar>
      <TokenOverview />
    </PageWithSideBar>
  )
}

const TokenOverview: React.FC = () => {
  const dataTokens = useTokens()

  const tokens: TokenTableData[] | undefined = React.useMemo(
    () =>
      dataTokens
        ?.map((tranche) => {
          return {
            ...tranche,
            poolId: tranche.poolId,
            poolMetadata: tranche.poolMetadata,
            // feeToApr is a temporary solution for calculating yield
            // bc we don't have a way to query for historical token prices yet
            // Use this formula when prices can be fetched: https://docs.centrifuge.io/learn/terms/#30d-drop-yield
            yield: tranche.interestRatePerSec ? tranche.interestRatePerSec.toAprPercent() : null,
            protection: tranche.minRiskBuffer?.toPercent() || new Perquintill(0).toPercent(),
            valueLocked: tranche.tokenIssuance.toDecimal().mul(tranche.tokenPrice.toDecimal()),
          }
        })
        .flat() || [],
    [dataTokens]
  )

  const totalValueLocked = React.useMemo(
    () => tokens?.reduce((prev, curr) => prev.add(curr.valueLocked), Dec(0)),
    [tokens]
  )

  const pageSummaryData = [
    // TODO: sort out currency for TVL (kUSD vs AIR vs ...), assuming everything uses the same currency
    { label: <Tooltips type="tvl" />, value: formatBalance(totalValueLocked, tokens[0]?.currency) },
    { label: <Tooltips type="tokens" />, value: tokens?.length || 0 },
  ]

  return (
    <Stack gap={0} flex={1} mb="6">
      <PageHeader subtitle="Art NFTs" title="Investment tokens" walletShown={false} />
      {tokens?.length ? (
        <>
          <PageSummary data={pageSummaryData} />
          <TokenList tokens={tokens} />
        </>
      ) : (
        <Shelf p="4" justifyContent="center" textAlign="center">
          <Text variant="heading2" color="textSecondary">
            There are no tokens yet
          </Text>
        </Shelf>
      )}
    </Stack>
  )
}
