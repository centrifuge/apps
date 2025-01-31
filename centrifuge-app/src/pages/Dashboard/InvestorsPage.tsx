import { CurrencyBalance, FileType } from '@centrifuge/centrifuge-js'
import { NetworkIcon, formatBalance, useCentrifuge, useGetNetworkName } from '@centrifuge/centrifuge-react'
import {
  Box,
  Button,
  Checkbox,
  Divider,
  Drawer,
  IconCopy,
  IconExternalLink,
  IconMoreVertical,
  Menu,
  MenuItem,
  Popover,
  Shelf,
  Stack,
  Text,
  truncate,
} from '@centrifuge/fabric'
import { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Column, DataTable, FilterableTableHeader, SortableTableHeader } from '../../components/DataTable'
import { CopyToClipboard } from '../../utils/copyToClipboard'
import { useFilters } from '../../utils/useFilters'
import {
  useInvestorListMulti,
  usePool,
  usePoolMetadataMulti,
  usePools,
  useTransactionsByAddress,
} from '../../utils/usePools'

type Row = {
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

export default function InvestorsPage() {
  const pools = usePools()?.slice(0, 3)
  const navigate = useNavigate()
  const [selectedPools, setSelectedPools] = useState<string[]>(pools?.map((p) => p.id) ?? [])
  const [searchParams] = useSearchParams()
  const investorParam = searchParams.get('d_investor')
  const cent = useCentrifuge()
  const poolMetadata = usePoolMetadataMulti(pools ?? [])
  const investors = useInvestorListMulti(selectedPools)
  const getNetworkName = useGetNetworkName()
  const data: Row[] =
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
      cell: (row: Row) => <CopyToClipboard address={row.wallet} />,
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
    <Stack gap={4} py={3} px={3}>
      {filters.data?.find((i) => `${i.wallet}-${i.trancheId}-${i.network}` === investorParam) && (
        <InvestorDrawer
          isOpen={!!investorParam}
          onClose={() => {
            navigate('/dashboard/investors')
          }}
          investor={filters.data.find((i) => `${i.wallet}-${i.trancheId}-${i.network}` === investorParam)!}
        />
      )}
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
          onRowClicked={(row) => `?d_investor=${row.wallet}-${row.trancheId}-${row.network}`}
        />
      </Box>
    </Stack>
  )
}

function InvestorDrawer({ isOpen, onClose, investor }: { isOpen: boolean; onClose: () => void; investor: Row }) {
  const cent = useCentrifuge()
  const pool = usePool(investor.poolId)
  const getNetworkName = useGetNetworkName()
  const columns: Column[] = [
    {
      header: '1. Wallet',
      align: 'left',
      cell: (row) => (
        <Text variant="body3" fontWeight="400">
          {row.firstColumn}
        </Text>
      ),
      width: '40%',
    },
    {
      header: truncate(investor.wallet),
      align: 'left',
      cell: (row) => (
        <Text variant="body3" fontWeight="600">
          {row.secondColumn}
        </Text>
      ),
      width: '40%',
    },
    {
      header: (
        <Popover
          renderTrigger={(props, ref) => (
            <Box ref={ref}>
              <Button
                {...props}
                variant="tertiary"
                onClick={(event) => {
                  console.log('clicked')
                  props?.onClick?.(event)
                }}
                small
                icon={<IconMoreVertical size="iconSmall" />}
              />
            </Box>
          )}
          renderContent={(props, ref) => (
            <Box ref={ref} {...props} width="200px">
              <Menu backgroundColor="white">
                <MenuItem label="Disable" onClick={() => console.log('Action 1')} />
                <MenuItem label="Freeze" onClick={() => console.log('Action 2')} />
                <Divider />
                <Shelf gap={1} justifyContent="space-between" paddingRight="12px">
                  <MenuItem label="Copy" onClick={() => console.log('Action 3')} />
                  <IconCopy size="iconMedium" />
                </Shelf>
              </Menu>
            </Box>
          )}
        ></Popover>
      ),
      align: 'right',
      cell: () => '',
    },
  ]
  const data = [
    {
      firstColumn: 'Network',
      secondColumn: (
        <Shelf gap="4px">
          <NetworkIcon size="iconSmall" network={investor.network || 'centrifuge'} />
          <Text>{getNetworkName(investor.network || 'centrifuge')}</Text>
        </Shelf>
      ),
    },
    {
      firstColumn: 'Investment position',
      secondColumn: formatBalance(investor.holdings, investor.tokenName, 2),
    },
    {
      firstColumn: 'Pending investments',
      secondColumn: formatBalance(investor.pendingInvestments, investor.poolCurrency, 2),
    },
    {
      firstColumn: 'Pending redemptions',
      secondColumn: formatBalance(investor.pendingRedemptions, investor.poolCurrency, 2),
    },
  ]
  if (!investor) return null
  const iconUri = investor.poolIcon?.uri && cent.metadata.parseMetadataUrl(investor.poolIcon?.uri)
  return (
    <Drawer isOpen={isOpen} onClose={onClose} width="37%" innerPaddingTop={2}>
      <Stack gap="18px">
        <Shelf gap={1}>
          <Box as="img" width="iconMedium" height="iconMedium" src={iconUri} borderRadius={1} />
          <Text variant="body2" fontWeight="500">
            {investor.tokenName}
          </Text>
        </Shelf>
        <Divider />
        <Shelf gap={1}>
          <Stack>
            <Text variant="body2" color="textSecondary">
              Realized P&L ({pool.currency.displayName})
            </Text>
            <Text variant="body2" color="textPrimary" fontWeight="600">
              {/* // TODO: get realized P&L */}
              {formatBalance(investor.holdings, undefined, 2)}
            </Text>
          </Stack>
          <Stack>
            <Text variant="body2" color="textSecondary">
              Unrealized P&L ({pool.currency.displayName})
            </Text>
            <Text variant="body2" color="textPrimary" fontWeight="600">
              {/* // TODO: get unrealized P&L */}
              {formatBalance(investor.holdings, undefined, 2)}
            </Text>
          </Stack>
          <Stack>
            <Text variant="body2" color="textSecondary">
              Investor since
            </Text>
            <Text variant="body2" color="textPrimary" fontWeight="600">
              {/* // TODO: get investor since */}
              {investor.investorSince || 'today'}
            </Text>
          </Stack>
        </Shelf>
        <Divider />
        <Text variant="body2" fontWeight="700">
          Wallet
        </Text>
        <DataTable data={data} columns={columns} />
        <Shelf justifyContent="space-between">
          <Text variant="body2" fontWeight="700">
            Transaction history
          </Text>
          <Button variant="tertiary" small>
            View all
          </Button>
        </Shelf>
        <MiniTransactionHistoryTable poolId={investor.poolId} investor={investor} />
        <Text variant="body2">Network: {investor.network}</Text>
        <Text variant="body2">Holdings: {investor.holdings.toString()}</Text>
        <Text variant="body2">Pending investments: {investor.pendingInvestments.toString()}</Text>
        <Text variant="body2">Pending redemptions: {investor.pendingRedemptions.toString()}</Text>
        <Text variant="body2">Investor since: {investor.investorSince}</Text>
      </Stack>
    </Drawer>
  )
}

const MiniTransactionHistoryTable = ({ poolId, wallet }: { poolId: string; wallet: string }) => {
  const transactions = useTransactionsByAddress('0x30d3bbae8623d0e9c0db5c27b82dcda39de40997')
  const columns: Column[] = [
    {
      header: 'Action',
      align: 'left',
      cell: (row) => <Text>{row.action}</Text>,
    },
    {
      header: 'Token',
      align: 'left',
      cell: (row) => (
        <Stack>
          <Text>{row.tokenName}</Text>
        </Stack>
      ),
    },
    {
      header: 'Amount',
      align: 'left',
      cell: (row) => <Text>{formatBalance(row.amount, row.tokenName, 2)}</Text>,
    },
    {
      header: '',
      align: 'left',
      cell: (row) => <IconExternalLink size="iconSmall" />,
    },
  ]

  const data =
    transactions.data?.investorTransactions.map((t) => ({
      date: t.timestamp,
      action: 'Some action',
      tokenName: 'Some token',
      tokenPrice: t.tokenPrice,
      amount: t.currencyAmount,
    })) ?? []

  return <DataTable data={data} columns={columns} />
}
