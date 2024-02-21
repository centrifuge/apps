import { AssetTransaction, CurrencyBalance } from '@centrifuge/centrifuge-js'
import { AnchorButton, IconDownload, IconExternalLink, Shelf, Stack, StatusChip, Text } from '@centrifuge/fabric'
import BN from 'bn.js'
import { formatDate } from '../../utils/date'
import { formatBalance } from '../../utils/formatting'
import { getCSVDownloadUrl } from '../../utils/getCSVDownloadUrl'
import { useAssetTransactions } from '../../utils/usePools'
import { DataTable, SortableTableHeader } from '../DataTable'
import { AnchorTextLink } from '../TextLink'

type Row = {
  type: string
  transactionDate: string
  assetId: string
  amount: string | CurrencyBalance | null
  hash: string
}

const getTransactionTypeStatus = (type: string) => {
  if (type === 'Principal payment' || type === 'Repaid') return 'warning'
  if (type === 'Interest') return 'ok'
  return 'default'
}

const getAmount = (amount: string | CurrencyBalance | null) => {
  if (typeof amount === 'string') return formatBalance(new CurrencyBalance(amount, 6), 'USD', 2, 2)
  if (amount) return formatBalance(amount, 'USD', 2, 2)
  return '-'
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
    header: 'Asset ID',
    cell: ({ assetId }: Row) => (
      <Text as="span" variant="body3">
        {assetId}
      </Text>
    ),
  },
  {
    align: 'left',
    header: <SortableTableHeader label="Amount" />,
    cell: ({ amount }: Row) => (
      <Text as="span" variant="body3">
        {getAmount(amount)}
      </Text>
    ),
    sortKey: 'amount',
  },
  {
    align: 'right',
    header: '',
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

  const getLabelAndAmount = (transaction: AssetTransaction) => {
    if (transaction.type === 'BORROWED') {
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

  const csvData = transactions
    ?.filter(
      (transaction) => transaction.type !== 'CREATED' && transaction.type !== 'CLOSED' && transaction.type !== 'PRICED'
    )
    .map((transaction) => {
      const { label, amount } = getLabelAndAmount(transaction)
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
        'Asset ID': transaction.assetId,
        Amount: amount ? `"${getAmount(amount)}"` : '-',
        Transaction: `${import.meta.env.REACT_APP_SUBSCAN_URL}/extrinsic/${transaction.hash}`,
      }
    })

  const csvUrl = csvData?.length ? getCSVDownloadUrl(csvData) : ''

  const tableData =
    transactions
      ?.filter(
        (transaction) =>
          transaction.type !== 'CREATED' && transaction.type !== 'CLOSED' && transaction.type !== 'PRICED'
      )
      .sort((a, b) => (a.timestamp > b.timestamp ? -1 : 1))
      .slice(0, preview ? 8 : Infinity)
      .map((transaction) => {
        const { label, amount } = getLabelAndAmount(transaction)
        return {
          type: label,
          transactionDate: transaction.timestamp,
          assetId: transaction.assetId,
          amount: amount,
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
      <DataTable data={tableData} columns={columns} />
      {transactions?.length! > 8 && preview && (
        <Text variant="body2" color="textSecondary">
          <AnchorTextLink href={`/pools/${poolId}/transactions`}>View all</AnchorTextLink>
        </Text>
      )}
    </Stack>
  )
}
