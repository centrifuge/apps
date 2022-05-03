import { feeToApr, formatCurrencyAmount } from '@centrifuge/centrifuge-js'
import { Shelf, Stack, Text } from '@centrifuge/fabric'
import { BN } from 'bn.js'
import * as React from 'react'
import { PageHeader } from '../components/PageHeader'
import { PageSummary } from '../components/PageSummary'
import { PageWithSideBar } from '../components/PageWithSideBar'
import { Token, TokenList } from '../components/TokenList'
import { Tooltips } from '../components/Tooltips'
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

  const tokens: Token[] | undefined = React.useMemo(
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
            yield: tranche?.interestPerSec ? feeToApr(tranche?.interestPerSec) : '',
            // for now proctection is being calculated as a percentage of the ratio
            // replace with proper protection calculation when token prices are available
            protection: tranche.ratio,
            valueLocked: tranche.tokenPrice
              ? new BN(tranche.tokenIssuance)
                  .mul(new BN(tranche.tokenPrice))
                  .div(new BN(10).pow(new BN(27)))
                  .toString()
              : '0',
          }
        })
        .flat() || [],
    [dataTokens]
  )

  // TODO: convert everything to one currency, USD?
  const totalValueLocked = React.useMemo(
    () => tokens?.reduce((prev, curr) => new BN(prev).add(new BN(curr?.valueLocked as any)), new BN(0)),
    [tokens]
  )

  const pageSummaryData = [
    { label: <Tooltips type="tvl" />, value: formatCurrencyAmount(totalValueLocked, 'USD') },
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
        <Shelf justifyContent="center" textAlign="center">
          <Text variant="heading2" color="textSecondary">
            There are no tokens yet
          </Text>
        </Shelf>
      )}
    </Stack>
  )
}
