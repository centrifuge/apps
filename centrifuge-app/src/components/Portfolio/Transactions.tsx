import { BorrowerTransactionType, InvestorTransactionType, Token, TokenBalance } from '@centrifuge/centrifuge-js'
import { formatBalance, useCentrifugeUtils } from '@centrifuge/centrifuge-react'
import { Box, IconExternalLink, IconEye, Stack, Text, VisualButton } from '@centrifuge/fabric'
import { isAddress as isValidEVMAddress } from '@ethersproject/address'
import * as React from 'react'
import { Link, useRouteMatch } from 'react-router-dom'
import { TransactionTypeChip } from '../../components/Portfolio/TransactionTypeChip'
import { Spinner } from '../../components/Spinner'
import { formatDate } from '../../utils/date'
import { Dec } from '../../utils/Decimal'
import { useAddress } from '../../utils/useAddress'
import { usePools, useTransactionsByAddress } from '../../utils/usePools'
import { Column, DataTable, SortableTableHeader } from '../DataTable'

type TransactionsProps = {
  count?: number
  txTypes?: InvestorTransactionType[]
}

type TransactionTableData = Row[]

type Row = {
  action: InvestorTransactionType | BorrowerTransactionType
  date: number
  tranche: Token | undefined
  tranchePrice: string
  amount: TokenBalance
  hash: string
  poolId: string
  trancheId: string
}

const columns: Column[] = [
  {
    align: 'left',
    header: 'Action',
    cell: ({ action }: Row) => <TransactionTypeChip type={action as InvestorTransactionType} />,
    width: '175px',
  },
  {
    align: 'left',
    header: <SortableTableHeader label="Transaction date" />,
    cell: ({ date }: Row) => (
      <Text as="time" variant="body3" datetime={date}>
        {formatDate(date, {
          day: '2-digit',
          month: '2-digit',
          year: '2-digit',
        })}
      </Text>
    ),
    width: '150px',
    sortKey: 'date',
  },
  {
    align: 'left',
    header: 'Token',
    cell: ({ tranche }: Row) => (
      <Text as="span" variant="body3" textOverflow="ellipis">
        {tranche?.currency.symbol} - ({tranche?.currency.name})
      </Text>
    ),
    width: '250px',
  },
  {
    align: 'right',
    header: 'Token price',
    cell: ({ tranche }: Row) => (
      <Text as="span" variant="body3">
        {formatBalance(tranche?.tokenPrice?.toDecimal() || Dec(1), tranche?.currency.symbol, 4)}
      </Text>
    ),
    width: '125px',
  },
  {
    align: 'right',
    header: <SortableTableHeader label="Amount" />,
    cell: ({ amount, tranche }: Row) => (
      <Text as="span" variant="body3">
        {formatBalance(amount.toDecimal(), tranche?.currency.symbol || '')}
      </Text>
    ),
    width: '125px',
    sortKey: 'amount',
  },
  {
    align: 'left',
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
    width: '200px',
  },
]

export default function Transactions({ count, txTypes }: TransactionsProps) {
  const { formatAddress } = useCentrifugeUtils()
  const address = useAddress()
  const formattedAddress = address && isValidEVMAddress(address) ? address : formatAddress(address || '')
  const transactions = useTransactionsByAddress(formatAddress(formattedAddress))
  const match = useRouteMatch('/history')
  const pools = usePools()

  const investorTransactions: TransactionTableData = React.useMemo(() => {
    const txs =
      transactions?.investorTransactions
        .slice(0, count || transactions?.investorTransactions.length)
        .filter((tx) => (txTypes ? txTypes?.includes(tx.type) : tx))
        .map((tx) => {
          const pool = pools?.find((pool) => pool.id === tx.poolId)
          const tranche = pool?.tranches.find((tranche) => tranche.id === tx.trancheId)
          return {
            date: new Date(tx.timestamp).getTime(),
            action: tx.type,
            tranche,
            tranchePrice: tranche?.tokenPrice?.toDecimal().toString() || '',
            amount: tx.currencyAmount,
            hash: tx.hash,
            poolId: tx.poolId,
            trancheId: tx.trancheId,
          }
        }) || []
    return txs
  }, [transactions, txTypes, count])

  const csvData = React.useMemo(() => {
    if (!investorTransactions || !investorTransactions?.length) {
      return undefined
    }
    return investorTransactions.map((entry) => {
      const pool = pools?.find((pool) => pool.id === entry.poolId)
      return {
        'Transaction date': `"${formatDate(entry.date)}"`,
        Action: entry.action,
        Token: pool ? pool.tranches.find(({ id }) => id === entry.trancheId)?.currency.name : undefined,
        Amount: pool ? `"${formatBalance(entry.amount.toDecimal(), pool.currency.symbol)}"` : undefined,
      }
    })
  }, [investorTransactions])

  return !!investorTransactions.length ? (
    <Stack as="article" gap={match ? 5 : 2}>
      <Text as="h2" variant="heading2">
        Transaction history
      </Text>
      <Stack gap={2}>
        <Stack gap={2}>
          <DataTable
            data={investorTransactions}
            columns={columns}
            pageSize={match ? 15 : undefined}
            csvExportData={match ? csvData : undefined}
            csvExportFileName={match ? `transaction-history-${address}.csv` : undefined}
          />
          {match ? null : (
            <Link to="/history">
              <Box display="inline-block">
                <VisualButton small variant="tertiary" icon={IconEye}>
                  View all
                </VisualButton>
              </Box>
            </Link>
          )}
        </Stack>
      </Stack>
    </Stack>
  ) : (
    <Spinner />
  )
}
