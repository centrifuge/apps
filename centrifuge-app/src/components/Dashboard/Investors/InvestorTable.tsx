import { CurrencyBalance, FileType } from '@centrifuge/centrifuge-js'
import {
  NetworkIcon,
  formatBalance,
  useCentrifuge,
  useCentrifugeUtils,
  useGetNetworkName,
} from '@centrifuge/centrifuge-react'
import { Box, IconInfo, Shelf, Text, truncate } from '@centrifuge/fabric'
import { useState } from 'react'
import { useNavigate } from 'react-router'
import { useSearchParams } from 'react-router-dom'
import { useTheme } from 'styled-components'
import {
  Column,
  DataTable,
  FilterableTableHeader,
  SearchableTableHeader,
  SortableTableHeader,
} from '../../../components/DataTable'
import { useSelectedPools } from '../../../utils/contexts/SelectedPoolsContext'
import { copyToClipboard } from '../../../utils/copyToClipboard'
import { formatDate } from '../../../utils/date'
import { useFilters } from '../../../utils/useFilters'
import { useInvestorListMulti } from '../../../utils/usePools'
import { InvestorDrawer } from './InvestorDrawer'

export type InvestorTableRow = {
  investorId: string
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

export function InvestorTable() {
  const theme = useTheme()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const investorParam = searchParams.get('d_investor')
  const cent = useCentrifuge()
  const { poolsWithMetadata, selectedPoolIds } = useSelectedPools()
  const investors = useInvestorListMulti(poolsWithMetadata?.map((p) => p.id) ?? [])
  const getNetworkName = useGetNetworkName()
  const utils = useCentrifugeUtils()

  const data: InvestorTableRow[] =
    investors
      ?.map((investor) => {
        const tokenName = poolsWithMetadata
          ?.find((p) => p.tranches.find((t) => t.id === investor.trancheId))
          ?.tranches.find((t) => t.id === investor.trancheId)?.currency.displayName
        return {
          tokenName,
          trancheId: investor.trancheId,
          poolId: investor.poolId,
          poolIcon: poolsWithMetadata?.find((p) => p.id === investor.poolId)?.meta?.pool?.icon,
          poolCurrency: poolsWithMetadata?.find((p) => p.id === investor.poolId)?.currency.displayName,
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
      })
      .filter((i) => selectedPoolIds.includes(i.poolId)) ?? []

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
            <Box as="img" width="iconMedium" height="iconMedium" src={iconUri || ''} borderRadius={4} />
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
        <Text
          variant="body3"
          fontWeight="500"
          style={{ cursor: 'copy' }}
          onClick={() => copyToClipboard(row.wallet && utils.formatAddress(row.wallet))}
        >
          {truncate(row.wallet && utils.formatAddress(row.wallet))}
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
      {tableData.length === 0 ? (
        <Box
          display="flex"
          justifyContent="center"
          alignItems="center"
          height="100%"
          background={theme.colors.backgroundSecondary}
          borderRadius={4}
          p={2}
          border={`1px solid ${theme.colors.borderPrimary}`}
        >
          <IconInfo size={14} style={{ marginRight: 8 }} />
          <Text variant="body3" color="textSecondary">
            No investors found
          </Text>
        </Box>
      ) : (
        <DataTable
          data={tableData}
          columns={columns}
          hoverable
          defaultSortKey="poolTokenId"
          defaultSortOrder="asc"
          scrollable
          onRowClicked={(row) => `?d_investor=${row.wallet}-${row.trancheId}-${row.network}`}
        />
      )}
    </Box>
  )
}
