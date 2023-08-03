import { IconChevronRight, Shelf, Text, TextWithPlaceholder } from '@centrifuge/fabric'
import * as React from 'react'
import { DataTable } from '../components/DataTable'
import { LayoutBase } from '../components/LayoutBase'
import { PoolsTokensShared } from '../components/PoolsTokensShared'
import { TokenList, TokenTableData } from '../components/TokenList'
import { Dec } from '../utils/Decimal'
import { useListedPools } from '../utils/useListedPools'
import { usePools } from '../utils/usePools'

export function TokenOverviewPage() {
  return (
    <LayoutBase>
      <PoolsTokensShared title="Tokens">
        <TokenOverview />
      </PoolsTokensShared>
    </LayoutBase>
  )
}

function TokenOverview() {
  const pools = usePools()

  const [, listedTokens] = useListedPools()

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
            tokenPrice: tranche.tokenPrice?.toFloat() ?? 0,
          }
        })
        .flat() || [],
    [listedTokens]
  )

  return tokens?.length ? (
    <TokenList tokens={tokens} />
  ) : pools?.length ? (
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
          header: 'Token Price',
          cell: () => <TextWithPlaceholder isLoading width={4} />,
          flex: '4',
          sortKey: 'tokenPrice',
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
  ) : (
    <Shelf p={4} justifyContent="center" textAlign="center">
      <Text variant="heading2" color="textSecondary">
        There are no tokens yet
      </Text>
    </Shelf>
  )
}
