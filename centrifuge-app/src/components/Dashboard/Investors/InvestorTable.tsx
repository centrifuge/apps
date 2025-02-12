import { CurrencyBalance, FileType, Pool } from '@centrifuge/centrifuge-js'
import { NetworkIcon, formatBalance, useCentrifuge, useGetNetworkName } from '@centrifuge/centrifuge-react'
import { Box, Shelf, Stack, Text, truncate } from '@centrifuge/fabric'
import { useState } from 'react'
import { useNavigate } from 'react-router'
import { useSearchParams } from 'react-router-dom'
import {
  Column,
  DataTable,
  FilterableTableHeader,
  SearchableTableHeader,
  SortableTableHeader,
} from '../../../components/DataTable'
import { copyToClipboard } from '../../../utils/copyToClipboard'
import { formatDate } from '../../../utils/date'
import { useFilters } from '../../../utils/useFilters'
import { useInvestorListMulti, usePoolMetadataMulti } from '../../../utils/usePools'
import { InvestorDrawer } from './InvestorDrawer'

export type InvestorTableRow = {
  tokenName: string | undefined
  trancheId: string
  poolIcon: FileType | null | undefined
  wallet: string
  network: number
  holdings: CurrencyBalance
  pendingInvestments: CurrencyBalance
  pendingRedemptions: CurrencyBalance
  investorSince: string
  poolCurrency: string | undefined
  poolId: string
  unrealizedProfit: CurrencyBalance
  realizedProfit: CurrencyBalance
}

export function InvestorTable({ pools }: { pools: Pool[] | undefined }) {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const investorParam = searchParams.get('d_investor')
  const cent = useCentrifuge()
  const poolMetadata = usePoolMetadataMulti(pools ?? [])
  const investors = useInvestorListMulti(pools?.map((p) => p.id) ?? [])
  const getNetworkName = useGetNetworkName()

  // const data = [
  //   {
  //     wallet: '0x423420Ae467df6e90291fd0252c0A8a637C1e03f',
  //     trancheId: '0xc4bbcd7f0ad814f2625b93561a6ca3c1',
  //     network: 11155111,
  //     poolId: '1464125771',
  //     tokenName: 'USDC',
  //     poolCurrency: 'USDC',
  //     poolIcon: null,
  //     holdings: new CurrencyBalance(100, 6),
  //     pendingInvestments: new CurrencyBalance(10000, 6),
  //     pendingRedemptions: new CurrencyBalance(100, 6),
  //     investorSince: '2025-02-12',
  //     unrealizedProfit: new CurrencyBalance(100, 6),
  //     realizedProfit: new CurrencyBalance(100, 6),
  //     investorId: '0x423420Ae467df6e90291fd0252c0A8a637C1e03f-0xc4bbcd7f0ad814f2625b93561a6ca3c1-11155111',
  //   },
  // ]
  const data: InvestorTableRow[] =
    investors?.map((investor) => {
      // match metadata to pool by trancheId since poolId doesnt exist in metadata
      const metadata = poolMetadata.find((p) => Object.keys(p.data?.tranches ?? {}).includes(investor.trancheId))
      const tokenName = pools
        ?.find((p) => p.tranches.find((t) => t.id === investor.trancheId))
        ?.tranches.find((t) => t.id === investor.trancheId)?.currency.displayName
      const poolCurrency = pools?.find((p) => p.id === investor.poolId)?.currency.displayName
      return {
        tokenName,
        trancheId: investor.trancheId,
        poolId: investor.poolId,
        poolIcon: metadata?.data?.pool?.icon,
        poolCurrency,
        wallet: investor?.evmAddress || investor.accountId || '',
        network: investor.chainId,
        holdings: investor.balance,
        pendingInvestments: investor.pendingInvestCurrency,
        pendingRedemptions: investor.pendingRedeemTrancheTokens,
        investorSince: investor.initialisedAt,
        unrealizedProfit: investor.unrealizedProfit,
        realizedProfit: investor.sumClaimedCurrency,
        investorId: `${investor.evmAddress || investor.accountId}-${investor.trancheId}-${investor.chainId}`,
      }
    }) ?? []
  const filters = useFilters({ data })
  const [searchValue, setSearchValue] = useState('')

  const columns: Column[] = [
    {
      header: <SortableTableHeader label="Pool token" />,
      align: 'left',
      sortKey: 'poolTokenId',
      cell: (row: InvestorTableRow) => {
        const iconUri = row.poolIcon?.uri && cent.metadata.parseMetadataUrl(row.poolIcon?.uri)
        return (
          <Shelf gap={1}>
            <Box as="img" width="iconMedium" height="iconMedium" src={iconUri} borderRadius={4} />
            <Text variant="body3" fontWeight="500">
              {row.tokenName}
            </Text>
          </Shelf>
        )
      },
    },
    {
      header: <SearchableTableHeader label="Wallet" value={searchValue} onSubmit={setSearchValue} />,
      align: 'left',
      cell: (row: InvestorTableRow) => (
        <Text variant="body3" fontWeight="500" style={{ cursor: 'copy' }} onClick={() => copyToClipboard(row.wallet)}>
          {truncate(row.wallet)}
        </Text>
      ),
    },
    {
      header: (
        <FilterableTableHeader
          label="Network"
          filterKey="network"
          options={Object.fromEntries(
            data.map((investor) => [
              investor.network,
              <Shelf gap={1}>
                <NetworkIcon size="iconMedium" network={investor.network || 'centrifuge'} />
                <Text variant="body3" fontWeight="500">
                  {getNetworkName(investor.network || 'centrifuge')}
                </Text>
              </Shelf>,
            ])
          )}
          filters={filters}
        />
      ),
      align: 'left',
      sortKey: 'network',
      cell: (row: InvestorTableRow) => <NetworkIcon size="iconMedium" network={row.network || 'centrifuge'} />,
    },
    {
      header: <SortableTableHeader label="Holdings" />,
      align: 'left',
      sortKey: 'holdings',
      cell: (row: InvestorTableRow) => (
        <Text variant="body3" fontWeight="500">
          {formatBalance(row.holdings, row.tokenName, 2)}
        </Text>
      ),
    },
    {
      header: <SortableTableHeader label="Pending investments" />,
      align: 'left',
      sortKey: 'pendingInvestments',
      cell: (row: InvestorTableRow) => (
        <Text variant="body3" fontWeight="500">
          {formatBalance(row.pendingInvestments, row.poolCurrency, 2)}
        </Text>
      ),
    },
    {
      header: <SortableTableHeader label="Pending redemptions" />,
      align: 'left',
      sortKey: 'pendingRedemptions',
      cell: (row: InvestorTableRow) => (
        <Text variant="body3" fontWeight="500">
          {formatBalance(row.pendingRedemptions, row.poolCurrency, 2)}
        </Text>
      ),
    },
    {
      header: <SortableTableHeader label="Investor since" />,
      align: 'left',
      sortKey: 'investorSince',
      cell: (row: InvestorTableRow) => (
        <Text variant="body3" fontWeight="500">
          {formatDate(row.investorSince)}
        </Text>
      ),
    },
  ]
  const tableData = filters.data.filter((i) => (searchValue ? i.wallet.includes(searchValue) : true))
  return (
    <Box>
      {filters.data?.find((i) => `${i.wallet}-${i.trancheId}-${i.network}` === investorParam) && (
        <InvestorDrawer
          isOpen={!!investorParam}
          onClose={() => {
            navigate('/dashboard/investors')
          }}
          investor={filters.data.find((i) => `${i.wallet}-${i.trancheId}-${i.network}` === investorParam)!}
        />
      )}
      <DataTable
        data={tableData}
        columns={columns}
        hoverable
        defaultSortKey="poolTokenId"
        defaultSortOrder="asc"
        scrollable
        onRowClicked={(row) => `?d_investor=${row.wallet}-${row.trancheId}-${row.network}`}
      />
      {tableData.length === 0 && (
        <Stack width="100%" alignItems="center">
          <Text variant="body2" color="textSecondary">
            No investors found
          </Text>
        </Stack>
      )}
    </Box>
  )
}
