import { CurrencyBalance, FileType } from '@centrifuge/centrifuge-js'
import { NetworkIcon, formatBalance, useCentrifuge, useGetNetworkName } from '@centrifuge/centrifuge-react'
import { Box, Button, Checkbox, Shelf, Stack, Text } from '@centrifuge/fabric'
import { useState } from 'react'
import { Column, DataTable, FilterableTableHeader, SortableTableHeader } from '../../components/DataTable'
import { CopyToClipboard } from '../../utils/copyToClipboard'
import { useFilters } from '../../utils/useFilters'
import { useInvestorListMulti, usePoolMetadataMulti, usePools } from '../../utils/usePools'

type Row = {
  tokenName: string | undefined
  poolIcon: FileType | null | undefined
  wallet: string
  network: number
  holdings: CurrencyBalance
  pendingInvestments: CurrencyBalance
  pendingRedemptions: CurrencyBalance
  investorSince: string
  poolCurrency: string | undefined
}

export default function InvestorsPage() {
  const pools = usePools()?.slice(0, 3)
  const getNetworkName = useGetNetworkName()
  const [selectedPools, setSelectedPools] = useState<string[]>(pools?.map((p) => p.id) ?? [])
  const cent = useCentrifuge()
  const poolMetadata = usePoolMetadataMulti(pools ?? [])
  const investors = useInvestorListMulti(selectedPools)
  const data: Row[] =
    investors?.map((investor) => {
      // match metadata to pool by trancheId since poolId doesnt exist in metadata
      const metadata = poolMetadata.find((p) => Object.keys(p.data?.tranches ?? {}).includes(investor.trancheId))
      const tokenName = pools?.find((p) => p.tranches.find((t) => t.id === investor.trancheId))?.tranches[0].currency
        .displayName
      const poolCurrency = pools?.find((p) => p.id === investor.poolId)?.tranches[0].currency.displayName
      return {
        tokenName,
        poolIcon: metadata?.data?.pool?.icon,
        poolCurrency,
        wallet: investor?.evmAddress || investor.accountId || '',
        network: investor.chainId,
        holdings: investor.balance,
        pendingInvestments: investor.pendingInvestCurrency,
        pendingRedemptions: investor.pendingRedeemTrancheTokens,
        investorSince: '', // TODO: get investorSince
      }
    }) ?? []

  const filters = useFilters({ data })

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
      header: (
        <FilterableTableHeader
          label="Network"
          filterKey="network"
          options={Object.fromEntries(
            data.map((investor) => [
              investor.network,
              investor.network === 0 ? 'Centrifuge' : getNetworkName(investor.network),
            ])
          )}
          filters={filters}
        />
      ),
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
      cell: (row: Row) => <Text>{formatBalance(row.pendingInvestments, row.poolCurrency, 2)}</Text>,
    },
    {
      header: <SortableTableHeader label="Pending redemptions" />,
      align: 'left',
      sortKey: 'pendingRedemptions',
      cell: (row: Row) => <Text>{formatBalance(row.pendingRedemptions, row.poolCurrency, 2)}</Text>,
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
      <Shelf gap={1}>
        {pools?.map((p) => (
          <Checkbox
            key={p.id}
            label={p.id}
            checked={selectedPools.includes(p.id)}
            onChange={() => {
              setSelectedPools((prev) => {
                if (prev.includes(p.id)) {
                  return prev.filter((id) => id !== p.id)
                }
                return [...prev, p.id]
              })
            }}
          />
        ))}
      </Shelf>
      <Shelf justifyContent="space-between">
        <Shelf gap={1}>
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
        <DataTable
          data={filters.data}
          columns={columns}
          hoverable
          defaultSortKey="poolTokenId"
          defaultSortOrder="asc"
          scrollable
        />
      </Box>
    </Stack>
  )
}
