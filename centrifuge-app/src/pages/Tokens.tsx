import { IconChevronRight, Shelf, Stack, Text, TextWithPlaceholder } from '@centrifuge/fabric'
import * as React from 'react'
import { DataTable } from '../components/DataTable'
import { MenuSwitch } from '../components/MenuSwitch'
import { PageHeader } from '../components/PageHeader'
import { PageSummary } from '../components/PageSummary'
import { PageWithSideBar } from '../components/PageWithSideBar'
import { TokenList, TokenTableData } from '../components/TokenList'
import { Tooltips } from '../components/Tooltips'
import { config } from '../config'
import { Dec } from '../utils/Decimal'
import { formatBalance } from '../utils/formatting'
import { useListedPools } from '../utils/useListedPools'
import { usePools } from '../utils/usePools'

export const TokenOverviewPage: React.FC = () => {
  return (
    <PageWithSideBar sidebar>
      <TokenOverview />
    </PageWithSideBar>
  )
}

const TokenOverview: React.FC = () => {
  const pools = usePools()

  const [listedPools, listedTokens] = useListedPools()

  const tokens: TokenTableData[] | undefined = React.useMemo(
    () =>
      listedTokens
        ?.map((tranche) => {
          return {
            ...tranche,
            poolId: tranche.poolId,
            poolMetadata: tranche.poolMetadata,
            poolCurrency: tranche.poolCurrency.symbol,
            // feeToApr is a temporary solution for calculating yield
            // bc we don't have a way to query for historical token prices yet
            // Use this formula when prices can be fetched: https://docs.centrifuge.io/learn/terms/#30d-drop-yield
            yield: tranche.interestRatePerSec ? tranche.interestRatePerSec.toAprPercent().toNumber() : null,
            protection: tranche.minRiskBuffer?.toPercent().toNumber() || 0,
            capacity: tranche.capacity
              .toDecimal()
              .mul(tranche.tokenPrice?.toDecimal() ?? Dec(0))
              .toNumber(),
            valueLocked: tranche.totalIssuance
              .toDecimal()
              .mul(tranche.tokenPrice?.toDecimal() ?? Dec(0))
              .toNumber(),
          }
        })
        .flat() || [],
    [listedTokens]
  )

  const totalValueLocked = React.useMemo(() => {
    return (
      listedTokens
        ?.map((tranche) => ({
          valueLocked: tranche.totalIssuance
            .toDecimal()
            .mul(tranche.tokenPrice?.toDecimal() ?? Dec(0))
            .toNumber(),
        }))
        .reduce((prev, curr) => prev.add(curr.valueLocked), Dec(0)) ?? Dec(0)
    )
  }, [listedTokens])

  const pageSummaryData = [
    {
      label: <Tooltips type="tvl" />,
      value: formatBalance(Dec(totalValueLocked || 0), config.baseCurrency),
    },
    { label: 'Pools', value: listedPools?.length || 0 },
    { label: <Tooltips type="tokens" />, value: tokens?.length || 0 },
  ]

  return (
    <Stack gap={0} flex={1} mb="6">
      <PageHeader
        subtitle={`Pools and tokens${config.network === 'centrifuge' ? ' of real-world assets' : ''}`}
        title="Pools"
        actions={<MenuSwitch />}
      />
      {tokens?.length ? (
        <>
          <PageSummary data={pageSummaryData} />
          <TokenList tokens={tokens} />
        </>
      ) : pools?.length ? (
        <>
          <PageSummary data={pageSummaryData} />
          <DataTable
            rounded={false}
            data={[{}]}
            columns={[
              {
                align: 'left',
                header: 'Token',
                cell: () => <TextWithPlaceholder isLoading />,
                flex: '9',
              },
              {
                align: 'left',
                header: 'Asset class',
                cell: () => <TextWithPlaceholder isLoading />,
                flex: '6',
              },
              {
                header: 'Yield',
                cell: () => <TextWithPlaceholder isLoading width={4} />,
                flex: '4',
                sortKey: 'yield',
              },
              {
                header: 'Protection',
                cell: () => <TextWithPlaceholder isLoading width={4} />,
                flex: '4',
              },
              {
                header: 'Value locked',
                cell: () => <TextWithPlaceholder isLoading width={6} />,
                flex: '4',
                sortKey: 'valueLocked',
              },
              {
                header: 'Capacity',
                cell: () => <TextWithPlaceholder isLoading width={6} />,
                flex: '4',
              },

              {
                header: '',
                cell: () => <IconChevronRight size={24} color="textPrimary" />,
                flex: '0 1 52px',
              },
            ]}
          />
        </>
      ) : (
        <Shelf p={4} justifyContent="center" textAlign="center">
          <Text variant="heading2" color="textSecondary">
            There are no tokens yet
          </Text>
        </Shelf>
      )}
    </Stack>
  )
}
