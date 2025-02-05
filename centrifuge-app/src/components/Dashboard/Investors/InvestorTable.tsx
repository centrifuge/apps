import { CurrencyBalance, FileType, Pool } from '@centrifuge/centrifuge-js'
import { NetworkIcon, formatBalance, useCentrifuge, useGetNetworkName } from '@centrifuge/centrifuge-react'
import { Box, Shelf, Text, truncate } from '@centrifuge/fabric'
import { useNavigate } from 'react-router'
import { useSearchParams } from 'react-router-dom'
import { Column, DataTable, FilterableTableHeader, SortableTableHeader } from '../../../components/DataTable'
import { copyToClipboard } from '../../../utils/copyToClipboard'
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
}

export function InvestorTable({ pools }: { pools: Pool[] | undefined }) {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const investorParam = searchParams.get('d_investor')
  const cent = useCentrifuge()
  const poolMetadata = usePoolMetadataMulti(pools ?? [])
  const investors = useInvestorListMulti(pools?.map((p) => p.id) ?? [])
  const getNetworkName = useGetNetworkName()

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
        investorSince: '', // TODO: get investorSince
        investorId: `${investor.evmAddress || investor.accountId}-${investor.trancheId}-${investor.chainId}`,
      }
    }) ?? []
  const filters = useFilters({ data })

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
            <Text fontWeight="500">{row.tokenName}</Text>
          </Shelf>
        )
      },
    },
    {
      header: 'Wallet', // TODO: make this searchable
      align: 'left',
      cell: (row: InvestorTableRow) => (
        <Text style={{ cursor: 'copy' }} onClick={() => copyToClipboard(row.wallet)}>
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
                <Text>{getNetworkName(investor.network || 'centrifuge')}</Text>
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
      cell: (row: InvestorTableRow) => <Text>{formatBalance(row.holdings, row.tokenName, 2)}</Text>,
    },
    {
      header: <SortableTableHeader label="Pending investments" />,
      align: 'left',
      sortKey: 'pendingInvestments',
      cell: (row: InvestorTableRow) => <Text>{formatBalance(row.pendingInvestments, row.poolCurrency, 2)}</Text>,
    },
    {
      header: <SortableTableHeader label="Pending redemptions" />,
      align: 'left',
      sortKey: 'pendingRedemptions',
      cell: (row: InvestorTableRow) => <Text>{formatBalance(row.pendingRedemptions, row.poolCurrency, 2)}</Text>,
    },
    {
      header: <SortableTableHeader label="Investor since" />,
      align: 'left',
      sortKey: 'investorSince',
      cell: (row: InvestorTableRow) => <Text>{row.investorSince}</Text>,
    },
  ]
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
        data={filters.data}
        columns={columns}
        hoverable
        defaultSortKey="poolTokenId"
        defaultSortOrder="asc"
        scrollable
        onRowClicked={(row) => `?d_investor=${row.wallet}-${row.trancheId}-${row.network}`}
      />
    </Box>
  )
}
