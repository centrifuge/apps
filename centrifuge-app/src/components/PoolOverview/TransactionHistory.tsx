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
  activeAssetId?: string
  assetId: string
  assetName: string
  fromAssetId?: string
  fromAssetName?: string
  toAssetId?: string
  toAssetName?: string
  amount: CurrencyBalance | undefined
  hash: string
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
    header: 'Asset',
    cell: ({ activeAssetId, assetId, assetName, fromAssetId, fromAssetName, toAssetId, toAssetName }: Row) => {
      return fromAssetId && toAssetId && activeAssetId == fromAssetId.split('-')[1] ? (
        <Text as="span" variant="body3">
          {fromAssetName} &rarr;{' '}
          <AnchorTextLink target="_self" href={`/pools/${toAssetId?.split('-')[0]}/assets/${toAssetId?.split('-')[1]}`}>
            {toAssetName}
          </AnchorTextLink>
        </Text>
      ) : fromAssetId && toAssetId && activeAssetId == toAssetId.split('-')[1] ? (
        <Text as="span" variant="body3">
          <AnchorTextLink
            target="_self"
            href={`/pools/${fromAssetId?.split('-')[0]}/assets/${fromAssetId?.split('-')[1]}`}
          >
            {fromAssetName}
          </AnchorTextLink>{' '}
          &rarr; {toAssetName}
        </Text>
      ) : fromAssetId && toAssetId ? (
        <Text as="span" variant="body3">
          <AnchorTextLink
            target="_self"
            href={`/pools/${fromAssetId?.split('-')[0]}/assets/${fromAssetId?.split('-')[1]}`}
          >
            {fromAssetName}
          </AnchorTextLink>{' '}
          &rarr;{' '}
          <AnchorTextLink target="_self" href={`/pools/${toAssetId?.split('-')[0]}/assets/${toAssetId?.split('-')[1]}`}>
            {toAssetName}
          </AnchorTextLink>
        </Text>
      ) : activeAssetId != assetId?.split('-')[1] ? (
        <Text as="span" variant="body3">
          <AnchorTextLink target="_self" href={`/pools/${assetId?.split('-')[0]}/assets/${assetId?.split('-')[1]}`}>
            {assetName || `Asset ${assetId?.split('-')[1]}`}
          </AnchorTextLink>
        </Text>
      ) : (
        <Text as="span" variant="body3">
          {assetName || `Asset ${assetId?.split('-')[1]}`}
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

export const TransactionHistory = ({
  poolId,
  activeAssetId,
  preview = true,
}: {
  poolId: string
  activeAssetId?: string
  preview?: boolean
}) => {
  const transactions = useAssetTransactions(poolId, new Date(0))
  return (
    <TransactionHistoryTable
      transactions={transactions ?? []}
      preview={preview}
      poolId={poolId}
      activeAssetId={activeAssetId}
    />
  )
}

export const TransactionHistoryTable = ({
  transactions,
  poolId,
  activeAssetId,
  preview = true,
}: {
  poolId: string
  transactions: any[]
  activeAssetId?: string
  preview?: boolean
}) => {
  const getLabelAndAmount = (transaction: AssetTransaction) => {
    if (transaction.type === 'CASH_TRANSFER') {
      return {
        label: 'Cash transfer',
        amount: transaction.amount,
      }
    }

    if (transaction.type === 'DEPOSIT_FROM_INVESTMENTS') {
      return {
        label: 'Deposit from investments',
        amount: transaction.amount,
      }
    }

    if (transaction.type === 'WITHDRAWAL_FOR_REDEMPTIONS') {
      return {
        label: 'Withdrawal for redemptions',
        amount: transaction.amount,
      }
    }

    if (transaction.type === 'WITHDRAWAL_FOR_FEES') {
      return {
        label: 'Withdrawal for fees',
        amount: transaction.amount,
      }
    }

    if (transaction.type === 'BORROWED') {
      return {
        label: 'Purchase',
        amount: transaction.amount,
      }
    }

    // TODO: ideally, if both principalAmount and interestAmount are non-zero, there should be 2 separate transactions
    if (
      transaction.type === 'REPAID' &&
      !new BN(transaction.interestAmount || 0).isZero() &&
      !new BN(transaction.principalAmount || 0).isZero()
    ) {
      return {
        label: 'Principal & interest payment',
        amount: new CurrencyBalance(
          new BN(transaction.principalAmount || 0).add(new BN(transaction.interestAmount || 0)),
          transaction.principalAmount!.decimals
        ),
      }
    }

    if (
      transaction.type === 'REPAID' &&
      !new BN(transaction.interestAmount || 0).isZero() &&
      new BN(transaction.principalAmount || 0).isZero()
    ) {
      return {
        label: 'Interest payment',
        amount: transaction.interestAmount,
      }
    }

    return {
      label: 'Principal payment',
      amount: transaction.principalAmount,
    }
  }

  const transformedTransactions =
    transactions
      ?.filter(
        (transaction) =>
          transaction.type !== 'CREATED' && transaction.type !== 'CLOSED' && transaction.type !== 'PRICED'
      )
      .sort((a, b) => (a.timestamp > b.timestamp ? -1 : 1)) || []

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
        transaction.type === 'CASH_TRANSFER'
          ? transaction.fromAsset?.id.endsWith('0')
            ? `${transaction.fromAsset?.name} > ${transaction.toAsset?.name}`
            : `${transaction.fromAsset?.name} > ${transaction.toAsset?.name}`
          : transaction.asset?.name || `Asset ${id}`,
      Amount: amount ? `"${formatBalance(amount, 'USD', 2, 2)}"` : '-',
      Transaction: `${import.meta.env.REACT_APP_SUBSCAN_URL}/extrinsic/${transaction.hash}`,
    }
  })

  const csvUrl = csvData?.length ? getCSVDownloadUrl(csvData) : ''

  const tableData =
    transformedTransactions.slice(0, preview ? 8 : Infinity).map((transaction) => {
      const { label, amount } = getLabelAndAmount(transaction)
      return {
        activeAssetId,
        type: label,
        transactionDate: transaction.timestamp,
        assetId: transaction.asset.id,
        assetName: transaction.asset.name,
        fromAssetId: transaction.fromAsset?.id,
        fromAssetName: transaction.fromAsset?.name,
        toAssetId: transaction.toAsset?.id,
        toAssetName: transaction.toAsset?.name,
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
      <DataTable data={tableData} columns={columns} />
      {transactions?.length! > 8 && preview && (
        <Text variant="body2" color="textSecondary">
          <AnchorTextLink href={`/pools/${poolId}/transactions`}>View all</AnchorTextLink>
        </Text>
      )}
    </Stack>
  )
}
