import { CurrencyBalance, FileType } from '@centrifuge/centrifuge-js'
import { NetworkIcon, formatBalance, useCentrifuge } from '@centrifuge/centrifuge-react'
import { Box, Button, Shelf, Stack, Text } from '@centrifuge/fabric'
import { Column, DataTable, FilterableTableHeader, SortableTableHeader } from '../../components/DataTable'
import { CopyToClipboard } from '../../utils/copyToClipboard'
import { useFilters } from '../../utils/useFilters'
import { useInvestorList, usePool, usePoolMetadata } from '../../utils/usePools'

type Row = {
  tokenName: string | undefined
  poolIcon: FileType | null | undefined
  wallet: string
  network: number
  holdings: CurrencyBalance
  pendingInvestments: CurrencyBalance
  pendingRedemptions: CurrencyBalance
  investorSince: string
}

export default function InvestorsPage() {
  const filters = useFilters({ data: [] })
  const cent = useCentrifuge()
  const pool = usePool('4139607887')
  const { data: poolMetadata } = usePoolMetadata(pool)
  const investors = useInvestorList('4139607887')
  const data: Row[] =
    investors?.map((investor) => {
      const tokenName = pool.tranches.find((t) => t.id === investor.trancheId)?.currency.displayName
      return {
        tokenName,
        poolIcon: poolMetadata?.pool?.icon,
        wallet: investor?.evmAddress || '',
        network: investor.chainId,
        holdings: investor.balance,
        pendingInvestments: investor.pendingInvestCurrency,
        pendingRedemptions: investor.pendingRedeemTrancheTokens,
        investorSince: '', // TODO: get investorSince
      }
    }) ?? []

  const columns: Column[] = [
    {
      header: <SortableTableHeader label="Pool token" />,
      align: 'left',
      sortKey: 'poolTokenId',
      cell: (row: Row) => {
        const iconUri = row.poolIcon?.uri && cent.metadata.parseMetadataUrl(row.poolIcon?.uri)
        return (
          <Shelf gap={1}>
            <Box as="img" width="iconMedium" height="iconMedium" src={iconUri} borderRadius={4} />
            <Text fontWeight="500">{row.tokenName}</Text>
          </Shelf>
        )
      },
    },
    {
      header: 'Wallet', // TODO: make this searchable
      align: 'left',
      cell: (row: Row) => (row?.wallet ? <CopyToClipboard address={row.wallet} /> : <Text>-</Text>),
    },
    {
      header: <FilterableTableHeader label="Network" filterKey="network" options={[]} filters={filters} />,
      align: 'left',
      sortKey: 'network',
      cell: (row: Row) => <NetworkIcon size="iconMedium" network={row.network || 'centrifuge'} />,
    },
    {
      header: <SortableTableHeader label="Holdings" />,
      align: 'left',
      sortKey: 'holdings',
      cell: (row: Row) => <Text>{formatBalance(row.holdings, row.tokenName, 2)}</Text>,
    },
    {
      header: <SortableTableHeader label="Pending investments" />,
      align: 'left',
      sortKey: 'pendingInvestments',
      cell: (row: Row) => <Text>{formatBalance(row.pendingInvestments, pool.currency.symbol, 2)}</Text>,
    },
    {
      header: <SortableTableHeader label="Pending redemptions" />,
      align: 'left',
      sortKey: 'pendingRedemptions',
      cell: (row: Row) => <Text>{formatBalance(row.pendingRedemptions, pool.currency.symbol, 2)}</Text>,
    },
    {
      header: <SortableTableHeader label="Investor since" />,
      align: 'left',
      sortKey: 'investorSince',
      cell: (row: Row) => <Text>{row.investorSince}</Text>,
    },
  ]
  return (
    <Stack gap={3} py={3} px={3}>
      <Text variant="heading1">Dashboard</Text>
      <Shelf justifyContent="space-between">
        <Shelf>
          <Box backgroundColor="backgroundTertiary" borderRadius={100} padding="2px 4px">
            <Text variant="body2" fontWeight="600">
              {investors?.length ?? 1 - 1}
            </Text>
          </Box>
          <Text variant="body2" fontWeight="700">
            Investors
          </Text>
        </Shelf>
        <Shelf gap={1}>
          <Button variant="inverted" small>
            Supported networks
          </Button>
          <Button variant="inverted" small>
            Onboarding settings
          </Button>
          <Button variant="secondary" small>
            Add new investor
          </Button>
        </Shelf>
      </Shelf>
      <Box>
        <DataTable data={data} columns={columns} hoverable defaultSortKey="value[3]" scrollable />
      </Box>
    </Stack>
  )
}
