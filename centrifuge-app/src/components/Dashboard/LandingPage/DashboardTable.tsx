import { computeMultisig, CurrencyBalance, Token } from '@centrifuge/centrifuge-js'
import { useCentrifuge, useCentrifugeQuery } from '@centrifuge/centrifuge-react'
import { Box, Button, Divider, Grid, IconSettings, IconUsers, IconWallet, Text } from '@centrifuge/fabric'
import Decimal from 'decimal.js-light'
import { useMemo, useState } from 'react'
import { combineLatest, map, of, take } from 'rxjs'
import { useTheme } from 'styled-components'
import { Dec } from '../../../../src/utils/Decimal'
import { formatBalance } from '../../../../src/utils/formatting'
import { useSelectedPools } from '../../../utils/contexts/SelectedPoolsContext'
import { DataTable, SortableTableHeader } from '../../DataTable'
import { calculateApyPerToken } from '../utils'
import { AccessDrawer } from './AccessDrawer'
import { PendingMultisigDrawer } from './PendingMultisigDrawer'
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
  const [pendingMultisigsDrawerOpen, setPendingMultisigsDrawerOpen] = useState(false)
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

  const [pendingMultisigs] = useCentrifugeQuery(
    ['pendingMultisig', selectedPoolsWithMetadata],
    () => {
      const poolsWithMultisig = selectedPoolsWithMetadata?.filter((pool) => pool.meta?.adminMultisig).slice(0, 4) || []

      if (!poolsWithMultisig.length) {
        return of([])
      }

      const queries = poolsWithMultisig.map((pool) => {
        const multisig = pool.meta.adminMultisig && computeMultisig(pool.meta.adminMultisig)
        const multiAddress = multisig?.address
        return multiAddress ? cent.multisig.getPendingTransactions([multiAddress]).pipe(take(1)) : of([])
      })

      return combineLatest(queries).pipe(map((results) => results.flat()))
    },
    { enabled: !!selectedPoolsWithMetadata }
  )

  if (!selectedPoolsWithMetadata.length) return <Text variant="heading4">No data available</Text>

  return (
    <Box>
      <Grid display="flex" justifyContent="flex-end" gap={2} mb={2}>
        {pendingMultisigs && pendingMultisigs.length > 0 && (
          <Button variant="primary" small icon={IconWallet} onClick={() => setPendingMultisigsDrawerOpen(true)}>
            Pending multisigs`
          </Button>
        )}
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
      <PoolConfigurationDrawer open={open} setOpen={setOpen} />
      <AccessDrawer isOpen={accessDrawerOpen} onClose={() => setAccessDrawerOpen(false)} />
      <PendingMultisigDrawer open={pendingMultisigsDrawerOpen} onClose={() => setPendingMultisigsDrawerOpen(false)} />
    </Box>
  )
}
