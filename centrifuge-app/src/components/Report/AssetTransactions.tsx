import { CurrencyBalance, Pool } from '@centrifuge/centrifuge-js'
import { useGetExplorerUrl } from '@centrifuge/centrifuge-react'
import { Box, IconAnchor, IconExternalLink, Text } from '@centrifuge/fabric'
import * as React from 'react'
import { formatBalance } from '../../../src/utils/formatting'
import { getCSVDownloadUrl } from '../../../src/utils/getCSVDownloadUrl'
import { useBasePath } from '../../../src/utils/useBasePath'
import { formatDate } from '../../utils/date'
import { useAssetTransactions } from '../../utils/usePools'
import { DataTable } from '../DataTable'
import { getLabelAndAmount } from '../PoolOverview/TransactionHistory'
import { Spinner } from '../Spinner'
import { RouterTextLink } from '../TextLink'
import { ReportContext } from './ReportContext'
import { UserFeedback } from './UserFeedback'

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
  label: string
  sublabel?: string
  epochId: string
}

export function AssetTransactions({ pool }: { pool: Pool }) {
  const { startDate, endDate, setCsvData, txType, loan: loanId } = React.useContext(ReportContext)
  const transactions = useAssetTransactions(pool.id, new Date(startDate), new Date(endDate))
  const explorer = useGetExplorerUrl()
  const basePath = useBasePath()

  const columns = [
    {
      header: 'Transaction date',
      align: 'left',
      csvOnly: false,
      cell: ({ transactionDate }: Row) => (
        <Text as="span" variant="body3">
          {formatDate(transactionDate)}
        </Text>
      ),
    },
    {
      header: 'Transaction',
      align: 'left',
      csvOnly: false,
      width: '38%',
      cell: ({ assetId, assetName, toAssetId, toAssetName, label, sublabel, fromAssetName, fromAssetId }: Row) => {
        const base = `${basePath}/${pool.id}/assets/`
        const isCashTransfer = label === 'Cash transfer from'
        return (
          <Text as="span" variant="body3">
            {label}{' '}
            <RouterTextLink to={`${base}${isCashTransfer ? fromAssetId?.split('-')[1] : assetId.split('-')[1]}`}>
              {isCashTransfer ? fromAssetName : assetName}
            </RouterTextLink>{' '}
            {toAssetName ? (
              <>
                {' '}
                {sublabel ? sublabel : `to`}{' '}
                <RouterTextLink to={`${base}${toAssetId?.split('-')[1]}`}> {toAssetName}</RouterTextLink>
              </>
            ) : null}
          </Text>
        )
      },
    },
    {
      header: 'Amount',
      align: 'left',
      csvOnly: false,
      cell: ({ amount }: Row) => (
        <Text variant="body3">{typeof amount === 'number' ? formatBalance(amount, pool.currency.symbol, 2) : '-'}</Text>
      ),
    },
    {
      header: 'Epoch',
      align: 'center',
      csvOnly: false,
      cell: ({ epochId }: Row) => <Text variant="body3">{epochId}</Text>,
    },
    {
      header: 'View transaction',
      align: 'center',
      csvOnly: false,
      width: '120px',
      cell: ({ hash }: Row) => (
        <IconAnchor
          href={explorer.tx(hash)}
          target="_blank"
          rel="noopener noreferrer"
          title="View account on block explorer"
        >
          <IconExternalLink />
        </IconAnchor>
      ),
    },
  ]

  const data =
    transactions
      ?.map((transaction) => {
        const { label, sublabel } = getLabelAndAmount(transaction)

        return {
          transactionDate: transaction.timestamp.toISOString(),
          assetId: transaction.asset.id,
          assetName: transaction.asset.name,
          fromAssetId: transaction.fromAsset?.id,
          fromAssetName: transaction.fromAsset?.name,
          toAssetId: transaction.toAsset?.id,
          toAssetName: transaction.toAsset?.name,
          amount: transaction.amount?.toFloat() ?? '',
          hash: transaction.hash,
          label,
          sublabel,
          epochId: transaction.epochId.split('-').at(-1)!,
        }
      })
      .filter((row) => {
        if (!loanId || loanId === 'all') return true
        return loanId === row.transactionDate
      })
      .filter((row) => (!txType || txType === 'all' ? true : row.epochId === txType)) || []

  React.useEffect(() => {
    if (transactions) {
      const csvData = transactions.map((transaction) => {
        const { amount } = getLabelAndAmount(transaction)
        return {
          'Transaction Date': `"${formatDate(transaction.timestamp, {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: 'numeric',
            minute: 'numeric',
            second: 'numeric',
            timeZoneName: 'short',
          })}"`,
          Transaction: explorer.tx(transaction.hash),
          Amount: amount ? `"${formatBalance(amount, 'USD', 2, 2)}"` : '-',
          epoch: transaction.epochId,
        }
      })

      const dataUrl = getCSVDownloadUrl(csvData)
      if (dataUrl) {
        setCsvData({
          dataUrl,
          fileName: 'asset-transactions.csv',
        })
      }
    }
  }, [transactions, setCsvData])

  if (!transactions) {
    return <Spinner mt={2} />
  }

  return data.length > 0 ? (
    <Box paddingX={2}>
      <DataTable data={data} columns={columns} hoverable scrollable />
    </Box>
  ) : (
    <UserFeedback reportType="Asset transactions" />
  )
}
