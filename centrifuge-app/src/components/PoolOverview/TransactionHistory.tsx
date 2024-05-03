import { AssetTransaction, AssetTransactionType, AssetType, CurrencyBalance } from '@centrifuge/centrifuge-js'
import { AnchorButton, Box, IconDownload, IconExternalLink, Shelf, Stack, StatusChip, Text } from '@centrifuge/fabric'
import BN from 'bn.js'
import { nftMetadataSchema } from '../../schemas'
import { formatDate } from '../../utils/date'
import { formatBalance } from '../../utils/formatting'
import { getCSVDownloadUrl } from '../../utils/getCSVDownloadUrl'
import { useMetadataMulti } from '../../utils/useMetadata'
import { useAssetTransactions } from '../../utils/usePools'
import { DataTable, SortableTableHeader } from '../DataTable'
import { AnchorTextLink } from '../TextLink'

type Row = {
  type: string
  transactionDate: string
  assetId: string
  amount: CurrencyBalance | undefined
  hash: string
  assetName: string
}

const getTransactionTypeStatus = (type: string): 'default' | 'info' | 'ok' | 'warning' | 'critical' => {
  return 'default'
}

export const columns = [
  {
    align: 'left',
    header: 'Type',
    cell: ({ type }: Row) => <StatusChip status={getTransactionTypeStatus(type)}>{type}</StatusChip>,
  },
  {
    align: 'left',
    header: <SortableTableHeader label="Transaction date" />,
    cell: ({ transactionDate }: Row) => (
      <Text as="span" variant="body3">
        {formatDate(transactionDate)}
      </Text>
    ),
    sortKey: 'transactionDate',
  },
  {
    align: 'left',
    header: 'Asset name',
    cell: ({ assetId, assetName }: Row) => {
      const [poolId, id] = assetId.split('-')
      return (
        <Text as="span" variant="body3">
          <AnchorTextLink href={`/pools/${poolId}/assets/${id}`}>{assetName}</AnchorTextLink>
        </Text>
      )
    },
  },
  {
    align: 'right',
    header: <SortableTableHeader label="Amount" />,
    cell: ({ amount }: Row) => (
      <Text as="span" variant="body3">
        {amount ? formatBalance(amount, 'USD', 2, 2) : ''}
      </Text>
    ),
    sortKey: 'amount',
  },
  {
    align: 'right',
    header: 'View transaction',
    cell: ({ hash }: Row) => {
      return (
        <Stack
          as="a"
          href={`${import.meta.env.REACT_APP_SUBSCAN_URL}/extrinsic/${hash}`}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Transaction on Subscan.io"
        >
          <IconExternalLink size="iconSmall" color="textPrimary" />
        </Stack>
      )
    },
  },
]

export const TransactionHistory = ({ poolId, preview = true }: { poolId: string; preview?: boolean }) => {
  const transactions = useAssetTransactions(poolId, new Date(0))

  const assetMetadata = useMetadataMulti(
    [...new Set(transactions?.map((transaction) => transaction.asset.metadata))] || [],
    nftMetadataSchema
  )

  const getLabelAndAmount = (
    transaction: Omit<AssetTransaction, 'type'> & { type: AssetTransactionType | 'SETTLED' }
  ) => {
    if (transaction.asset.type == AssetType.OffchainCash) {
      return {
        label: 'Cash transfer',
        amount: transaction.amount,
      }
    }

    if (transaction.type === 'BORROWED' || transaction.type === 'SETTLED') {
      return {
        label: 'Purchase',
        amount: transaction.amount,
      }
    }
    if (transaction.type === 'REPAID' && !new BN(transaction.interestAmount || 0).isZero()) {
      return {
        label: 'Interest',
        amount: transaction.interestAmount,
      }
    }

    return {
      label: 'Principal payment',
      amount: transaction.principalAmount,
    }
  }

  const settlements = transactions?.reduce((acc, transaction, index) => {
    if (transaction.hash === transactions[index + 1]?.hash) {
      acc[transaction.hash] = { ...transaction, type: 'SETTLED' }
    }

    return acc
  }, {} as Record<string, Omit<AssetTransaction, 'type'> & { type: AssetTransactionType | 'SETTLED' }>)

  const transformedTransactions = [
    ...(transactions?.filter((transaction) => !settlements?.[transaction.hash]) || []),
    ...Object.values(settlements || []),
  ]
    .filter(
      (transaction) => transaction.type !== 'CREATED' && transaction.type !== 'CLOSED' && transaction.type !== 'PRICED'
    )
    .sort((a, b) => (a.timestamp > b.timestamp ? -1 : 1))

  const csvData = transformedTransactions.map((transaction) => {
    const { label, amount } = getLabelAndAmount(transaction)
    const [, id] = transaction.asset.id.split('-')
    return {
      Type: label,
      'Transaction Date': `"${formatDate(transaction.timestamp, {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: 'numeric',
        minute: 'numeric',
        second: 'numeric',
        timeZoneName: 'short',
      })}"`,
      'Asset Name':
        transaction.asset.type == AssetType.OffchainCash
          ? transaction.type === 'BORROWED'
            ? `Onchain reserve > Settlement Account`
            : `Settlement Account > onchain reserve`
          : transaction.type === 'SETTLED'
          ? `Settlement Account > ${assetMetadata[Number(id) - 1].data?.name || '-'}`
          : assetMetadata[Number(id) - 1].data?.name || '-',
      Amount: amount ? `"${formatBalance(amount, 'USD', 2, 2)}"` : '-',
      Transaction: `${import.meta.env.REACT_APP_SUBSCAN_URL}/extrinsic/${transaction.hash}`,
    }
  })

  const csvUrl = csvData?.length ? getCSVDownloadUrl(csvData) : ''

  const tableData =
    transformedTransactions.slice(0, preview ? 8 : Infinity).map((transaction) => {
      const [, id] = transaction.asset.id.split('-')
      const { label, amount } = getLabelAndAmount(transaction)
      return {
        type: label,
        transactionDate: transaction.timestamp,
        assetId: transaction.asset.id,
        assetName:
          transaction.asset.type == AssetType.OffchainCash
            ? transaction.type === 'BORROWED'
              ? `Onchain reserve > Settlement account`
              : `Settlement account > onchain reserve`
            : transaction.type === 'SETTLED'
            ? `${assetMetadata[Number(id) - 1].data?.name || '-'}`
            : assetMetadata[Number(id) - 1].data?.name || '-',
        amount: amount || 0,
        hash: transaction.hash,
      }
    }) || []

  return (
    <Stack gap={2}>
      <Shelf justifyContent="space-between">
        <Text fontSize="18px" fontWeight="500">
          Transaction history
        </Text>
        {transactions?.length && (
          <AnchorButton
            href={csvUrl}
            download={`pool-transaction-history-${poolId}.csv`}
            variant="secondary"
            icon={IconDownload}
            small
            target="_blank"
          >
            Download
          </AnchorButton>
        )}
      </Shelf>
      <Box overflowX="auto" width="100%">
        <DataTable data={tableData} columns={columns} />
      </Box>
      {transactions?.length! > 8 && preview && (
        <Text variant="body2" color="textSecondary">
          <AnchorTextLink href={`/pools/${poolId}/transactions`}>View all</AnchorTextLink>
        </Text>
      )}
    </Stack>
  )
}
