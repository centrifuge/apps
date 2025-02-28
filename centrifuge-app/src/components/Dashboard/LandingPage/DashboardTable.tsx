import { CurrencyBalance, Token } from '@centrifuge/centrifuge-js'
import { useCentrifuge } from '@centrifuge/centrifuge-react'
import { Box, Button, Divider, Grid, IconSettings, IconUsers, Text } from '@centrifuge/fabric'
import Decimal from 'decimal.js-light'
import { useMemo, useState } from 'react'
import { useTheme } from 'styled-components'
import { Dec } from '../../../../src/utils/Decimal'
import { formatBalance } from '../../../../src/utils/formatting'
import { useSelectedPools } from '../../../utils/contexts/SelectedPoolsContext'
import { DataTable, SortableTableHeader } from '../../DataTable'
import { calculateApyPerToken } from '../utils'
import { AccessDrawer } from './AccessDrawer'
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

export function DashboardTable() {
  const [open, setOpen] = useState(false)
  const [accessDrawerOpen, setAccessDrawerOpen] = useState(false)
  const theme = useTheme()
  const cent = useCentrifuge()
  const { selectedPoolsWithMetadata } = useSelectedPools()

  const data = useMemo(() => {
    return selectedPoolsWithMetadata.flatMap((pool) =>
      pool.tranches.map((token: Token) => ({
        poolIcon: cent.metadata.parseMetadataUrl(pool.meta?.pool?.icon?.uri || ''),
        poolName: pool.meta?.pool?.name,
        trancheToken: token.currency.displayName,
        apy: calculateApyPerToken(token, pool),
        navPerToken: token.tokenPrice,
        valueLocked: token?.tokenPrice ? token.totalIssuance.toDecimal().mul(token.tokenPrice.toDecimal()) : Dec(0),
        poolId: pool.id,
      }))
    )
  }, [selectedPoolsWithMetadata, cent.metadata])

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
      sortKey: 'apy',
      cell: ({ apy }: Row) => <Text variant="body3">{apy}</Text>,
    },
    {
      header: <SortableTableHeader label="NAV (USDC)" />,
      sortKey: 'valueLocked',
      cell: ({ valueLocked }: Row) => <Text variant="body3">{valueLocked ? formatBalance(valueLocked) : '-'}</Text>,
    },
    {
      header: <SortableTableHeader label="NAV per share" />,
      sortKey: 'navPerToken',
      cell: ({ navPerToken }: Row) => <Text variant="body3">{navPerToken ? formatBalance(navPerToken) : '-'}</Text>,
    },
  ]

  if (!selectedPoolsWithMetadata.length) return <Text variant="heading4">No data available</Text>

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
        onRowClicked={(row) => `/pools/${row.poolId}`}
      />
      <Divider color={theme.colors.backgroundSecondary} />
      <PoolConfigurationDrawer open={open} setOpen={setOpen} />
      <AccessDrawer isOpen={accessDrawerOpen} onClose={() => setAccessDrawerOpen(false)} />
    </Box>
  )
}
