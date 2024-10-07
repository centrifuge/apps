import { AssetTransaction, CurrencyBalance } from '@centrifuge/centrifuge-js'
import { AnchorButton, IconDownload, IconExternalLink, Shelf, Stack, Text } from '@centrifuge/fabric'
import BN from 'bn.js'
import { formatDate } from '../../utils/date'
import { formatBalance } from '../../utils/formatting'
import { getCSVDownloadUrl } from '../../utils/getCSVDownloadUrl'
import { useBasePath } from '../../utils/useBasePath'
import { useAssetTransactions } from '../../utils/usePools'
import { DataTable, SortableTableHeader } from '../DataTable'
import { RouterTextLink } from '../TextLink'

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
  netFlow?: 'positive' | 'negative' | 'neutral'
  label: string
}

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
  const basePath = useBasePath('/pools')
  const getLabelAndAmount = (transaction: AssetTransaction) => {
    const netFlow = activeAssetId
      ? activeAssetId === transaction.toAsset?.id.split('-')[1]
        ? 'positive'
        : 'negative'
      : 'neutral'

    if (transaction.type === 'CASH_TRANSFER') {
      return {
        label: 'Cash transfer from',
        amount: transaction.amount,
        netFlow,
      }
    }

    if (transaction.type === 'DEPOSIT_FROM_INVESTMENTS') {
      return {
        label: 'Deposit from investments into',
        amount: transaction.amount,
        netFlow: 'positive',
      }
    }

    if (transaction.type === 'WITHDRAWAL_FOR_REDEMPTIONS') {
      return {
        label: 'Withdrawal for redemptions',
        amount: transaction.amount,
        netFlow: 'negative',
      }
    }

    if (transaction.type === 'WITHDRAWAL_FOR_FEES') {
      return {
        label: 'Withdrawal for fees',
        amount: transaction.amount,
        netFlow: 'negative',
      }
    }

    if (transaction.type === 'BORROWED') {
      return {
        label: 'Purchase of',
        amount: transaction.amount,
        netFlow,
      }
    }

    if (transaction.type === 'INCREASE_DEBT') {
      return {
        label: 'Correction of',
        amount: transaction.amount,
        netFlow: 'positive',
      }
    }

    if (transaction.type === 'DECREASE_DEBT') {
      return {
        label: 'Correction of',
        amount: transaction.amount,
        netFlow: 'negative',
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
        netFlow,
      }
    }

    if (
      transaction.type === 'REPAID' &&
      !new BN(transaction.interestAmount || 0).isZero() &&
      new BN(transaction.principalAmount || 0).isZero()
    ) {
      return {
        label: 'Interest payment from',
        amount: transaction.interestAmount,
        netFlow,
      }
    }

    return {
      label: 'Principal payment from',
      amount: transaction.principalAmount,
      netFlow,
    }
  }

  const transformedTransactions =
    transactions
      ?.filter(
        (transaction) =>
          transaction.type !== 'CREATED' &&
          transaction.type !== 'CLOSED' &&
          transaction.type !== 'PRICED' &&
          !transaction.amount.isZero()
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

  const csvUrl = (csvData?.length && getCSVDownloadUrl(csvData)) || ''

  const tableData =
    transformedTransactions.slice(0, preview ? 8 : Infinity).map((transaction) => {
      const { amount, netFlow } = getLabelAndAmount(transaction)
      return {
        activeAssetId,
        netFlow,
        transactionDate: transaction.timestamp,
        assetId: transaction.asset.id,
        assetName: transaction.asset.name,
        fromAssetId: transaction.fromAsset?.id,
        fromAssetName: transaction.fromAsset?.name,
        toAssetId: transaction.toAsset?.id,
        toAssetName: transaction.toAsset?.name,
        amount: amount || 0,
        hash: transaction.hash,
        label,
      }
    }) || []

  const columns = [
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
      header: <SortableTableHeader label="Transaction" />,
      cell: ({ activeAssetId, assetId, assetName, fromAssetId, toAssetId, toAssetName, label }: Row) => {
        const base = `${basePath}/${poolId}/assets/`
        return fromAssetId || toAssetId || activeAssetId ? (
          <Text as="span" variant="body3">
            {label} <RouterTextLink to={`${base}${assetId.split('-')[1]}`}>{assetName}</RouterTextLink>{' '}
            {toAssetName ? (
              <>
                {' '}
                to <RouterTextLink to={`${base}${toAssetId?.split('-')[1]}`}> {toAssetName}</RouterTextLink>
              </>
            ) : null}
          </Text>
        ) : (
          <Text as="span" variant="body3">
            {assetName || `Asset ${assetId?.split('-')[1]}`}
          </Text>
        )
      },
      sortKey: 'transaction',
    },
    {
      align: 'right',
      header: <SortableTableHeader label="Amount" />,
      cell: ({ amount, netFlow }: Row) => (
        <Text as="span" variant="body3">
          {amount ? `${activeAssetId && netFlow === 'negative' ? '-' : ''}${formatBalance(amount, 'USD', 2, 2)}` : ''}
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

  return (
    <Stack gap={2}>
      <Shelf justifyContent="space-between">
        <Text fontSize="18px" fontWeight="500">
          Transaction history
        </Text>
        <Shelf>
          {transactions?.length! > 8 && preview && (
            <AnchorButton href={`#/pools/${poolId}/transactions`} small variant="inverted">
              View all
            </AnchorButton>
          )}
          {transactions?.length && (
            <AnchorButton
              href={csvUrl}
              download={`pool-transaction-history-${poolId}.csv`}
              variant="inverted"
              icon={IconDownload}
              small
              target="_blank"
              style={{ marginLeft: 8 }}
            >
              Download
            </AnchorButton>
          )}
        </Shelf>
      </Shelf>
      <DataTable data={tableData} columns={columns} />
    </Stack>
  )
}
