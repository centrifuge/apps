import { BorrowerTransaction } from '@centrifuge/centrifuge-js'
import { AnchorButton, IconDownload, IconExternalLink, Shelf, Stack, StatusChip, Text } from '@centrifuge/fabric'
import BN from 'bn.js'
import { formatDate } from '../../utils/date'
import { formatBalance } from '../../utils/formatting'
import { useAssetTransactions } from '../../utils/usePools'
import { DataTable, SortableTableHeader } from '../DataTable'
import { AnchorTextLink } from '../TextLink'

type Row = {
  type: string
  transactionDate: string
  assetId: string
  amount: number
  hash: string
}

const getTransactionTypeStatus = (type: string) => {
  if (type === 'Principal payment' || type === 'Repaid') return 'warning'
  if (type === 'Interest') return 'ok'
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
        {amount ? formatBalance(amount, 'USD', 2, 2) : '-'}
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

  const getLabelAndAmount = (transaction: BorrowerTransaction) => {
    if (transaction.type === 'BORROWED') {
      return {
        label: 'Purchase',
        amount: transaction.amount,
      }
    }
    if (transaction.type === 'REPAID' && !new BN(transaction.principalAmount || 0).isZero()) {
      return {
        label: 'Principal payment',
        amount: transaction.principalAmount,
      }
    }
    if (transaction.type === 'REPAID' && !new BN(transaction.interestAmount || 0).isZero()) {
      return {
        label: 'Interest',
        amount: transaction.interestAmount,
      }
    }

    return {
      label: 'Repaid',
      amount: transaction.amount,
    }
  }

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
        <AnchorButton href={''} download={''} variant="secondary" icon={IconDownload} small target="_blank">
          Download
        </AnchorButton>
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
