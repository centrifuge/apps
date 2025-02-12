import { CurrencyBalance, Pool, Token } from '@centrifuge/centrifuge-js'
import { useCentrifuge } from '@centrifuge/centrifuge-react'
import { Box, Divider, Grid, Text } from '@centrifuge/fabric'
import Decimal from 'decimal.js-light'
import { useMemo } from 'react'
import { useTheme } from 'styled-components'
import { Dec } from '../../../src/utils/Decimal'
import { formatBalance } from '../../../src/utils/formatting'
import { DataTable, SortableTableHeader } from '../DataTable'
import { useGetPoolsMetadata } from './assets/utils'
import { calculateApyPerToken } from './utils'

export type Row = {
  poolIcon: string
  poolName: string
  tranches: {
    tranchetoken: string
    apy: string
    navPerToken: CurrencyBalance
    valueLocked: Decimal
  }[]
}

export function DashboardTable({ filteredPools }: { filteredPools: Pool[] }) {
  const theme = useTheme()
  const cent = useCentrifuge()
  const pools = useGetPoolsMetadata(filteredPools || [])

  const data = useMemo(() => {
    return pools.map((pool) => {
      return {
        poolIcon: cent.metadata.parseMetadataUrl(pool.meta?.pool?.icon?.uri),
        poolName: pool.meta?.pool?.name,
        tranches: pool.tranches.map((token: Token) => ({
          tranchetoken: token.currency.displayName,
          apy: calculateApyPerToken(token, pool),
          navPerToken: token.tokenPrice,
          valueLocked: token?.tokenPrice ? token.totalIssuance.toDecimal().mul(token.tokenPrice.toDecimal()) : Dec(0),
        })),
      }
    })
  }, [pools])

  const columns = useMemo(() => {
    return [
      {
        header: 'Pool',
        align: 'left',
        cell: ({ poolName, poolIcon }: Row) => {
          return (
            <Box display="flex" alignItems="center">
              {poolIcon && <Box as="img" src={poolIcon} alt="" height={24} width={24} borderRadius={4} mr={1} />}
              <Text style={{ fontWeight: 500 }} variant="body3">
                {poolName}
              </Text>
            </Box>
          )
        },
      },
      {
        header: 'Tranche',
        cell: ({ tranches }: Row) => {
          return (
            <Grid gap={2}>
              {tranches.map((tranche, index) => (
                <Box key={index}>
                  <Text variant="body3">{tranche.tranchetoken}</Text>
                </Box>
              ))}
            </Grid>
          )
        },
      },
      {
        header: <SortableTableHeader label="APY" />,
        sortKey: 'tranches.apy',
        cell: ({ tranches }: Row) => {
          return (
            <Grid gap={2}>
              {tranches.map((tranche, index) => (
                <Box key={index}>
                  <Text variant="body3">{tranche.apy}</Text>
                </Box>
              ))}
            </Grid>
          )
        },
      },
      {
        header: <SortableTableHeader label="NAV (USDC)" />,
        sortKey: 'tranches.valueLocked',
        cell: ({ tranches }: Row) => {
          return (
            <Grid gap={2}>
              {tranches.map((tranche, index) => (
                <Box key={index}>
                  <Text variant="body3">{tranche.valueLocked ? formatBalance(tranche.valueLocked) : '-'}</Text>
                </Box>
              ))}
            </Grid>
          )
        },
      },
      {
        header: <SortableTableHeader label="NAV per share" />,
        sortKey: 'tranches.navPerToken',
        cell: ({ tranches }: Row) => {
          return (
            <Grid gap={2}>
              {tranches.map((tranche, index) => (
                <Box key={index}>
                  <Text variant="body3">{tranche.navPerToken ? formatBalance(tranche.navPerToken) : '-'}</Text>
                </Box>
              ))}
            </Grid>
          )
        },
      },
    ]
  }, [pools])

  if (!pools.length) return <Text variant="heading4">No data available</Text>

  return (
    <Box>
      <DataTable data={data || []} columns={columns} scrollable hideBorder hideHeader />
      <Divider color={theme.colors.backgroundSecondary} />
    </Box>
  )
}
