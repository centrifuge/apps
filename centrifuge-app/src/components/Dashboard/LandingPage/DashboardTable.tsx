import { CurrencyBalance, Pool, Token } from '@centrifuge/centrifuge-js'
import { useCentrifuge } from '@centrifuge/centrifuge-react'
import { Box, Button, Divider, Grid, IconSettings, IconUsers, Text } from '@centrifuge/fabric'
import Decimal from 'decimal.js-light'
import { useMemo, useState } from 'react'
import { useTheme } from 'styled-components'
import { Dec } from '../../../../src/utils/Decimal'
import { formatBalance } from '../../../../src/utils/formatting'
import { DataTable, SortableTableHeader } from '../../DataTable'
import { AccessDrawer } from '../AccessDrawer'
import { calculateApyPerToken, useGetPoolsMetadata } from '../utils'
import { PoolConfigurationDrawer } from './PoolConfigurationDrawer'

export type Row = {
  poolIcon: string
  poolName: string
  trancheToken: string
  apy: string
  navPerToken: CurrencyBalance
  valueLocked: Decimal
  poolId: string
}

export function DashboardTable({ filteredPools }: { filteredPools: Pool[] }) {
  const [open, setOpen] = useState(false)
  const [accessDrawerOpen, setAccessDrawerOpen] = useState(false)
  const theme = useTheme()
  const cent = useCentrifuge()
  const pools = useGetPoolsMetadata(filteredPools || [])

  const data = useMemo(() => {
    return pools.flatMap((pool) =>
      pool.tranches.map((token: Token) => ({
        poolIcon: cent.metadata.parseMetadataUrl(pool.meta?.pool?.icon?.uri),
        poolName: pool.meta?.pool?.name,
        trancheToken: token.currency.displayName,
        apy: calculateApyPerToken(token, pool),
        navPerToken: token.tokenPrice,
        valueLocked: token?.tokenPrice ? token.totalIssuance.toDecimal().mul(token.tokenPrice.toDecimal()) : Dec(0),
        poolId: pool.id,
        rawAPY: Number(calculateApyPerToken(token, pool).split('%')[0]),
      }))
    )
  }, [selectedPoolsWithMetadata])

  const columns = [
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
      sortKey: 'tranchetoken',
      cell: ({ trancheToken }: Row) => <Text variant="body3">{trancheToken}</Text>,
    },
    {
      header: <SortableTableHeader label="APY" />,
      sortKey: 'rawAPY',
      cell: ({ apy }: Row) => <Text variant="body3">{apy}</Text>,
    },
    {
      header: <SortableTableHeader label="NAV (USDC)" />,
      sortKey: 'valueLocked',
      cell: ({ valueLocked }: Row) => <Text variant="body3">{valueLocked ? formatBalance(valueLocked) : '-'}</Text>,
    },
    {
      header: <SortableTableHeader label="Token price" />,
      sortKey: 'navPerToken',
      cell: ({ navPerToken }: Row) => (
        <Text variant="body3">{navPerToken ? formatBalance(navPerToken, '', 6) : '-'}</Text>
      ),
    },
  ]

  if (!pools.length) return <Text variant="heading4">No data available</Text>

  return (
    <Box>
      <Grid display="flex" justifyContent="flex-end" gap={2} mb={2}>
        <Button variant="inverted" small icon={IconUsers} onClick={() => setAccessDrawerOpen(true)}>
          Access
        </Button>
        <Button variant="inverted" small icon={IconSettings} onClick={() => setOpen(true)}>
          Configuration
        </Button>
      </Grid>
      <DataTable
        data={data || []}
        columns={columns}
        scrollable
        hideBorder
        hideHeader
        defaultSortKey="valueLocked"
        defaultSortOrder="desc"
      />
      <Divider color={theme.colors.backgroundSecondary} />
      <PoolConfigurationDrawer open={open} setOpen={setOpen} pools={pools} />
      <AccessDrawer
        isOpen={accessDrawerOpen}
        onClose={() => setAccessDrawerOpen(false)}
        poolIds={filteredPools.map((pool) => pool.id)}
      />
    </Box>
  )
}
