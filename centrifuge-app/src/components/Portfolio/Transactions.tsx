import { BorrowerTransactionType, InvestorTransactionType, Token, TokenBalance } from '@centrifuge/centrifuge-js'
import { formatBalance, useCentrifugeUtils } from '@centrifuge/centrifuge-react'
import {
  AnchorButton,
  Box,
  IconExternalLink,
  IconEye,
  Pagination,
  PaginationProvider,
  Shelf,
  Stack,
  Text,
  usePagination,
} from '@centrifuge/fabric'
import * as React from 'react'
import { TransactionTypeChip } from '../../components/Portfolio/TransactionTypeChip'
import { Spinner } from '../../components/Spinner'
import { formatDate } from '../../utils/date'
import { Dec } from '../../utils/Decimal'
import { getCSVDownloadUrl } from '../../utils/getCSVDownloadUrl'
import { usePools, useTransactionsByAddress } from '../../utils/usePools'
import { Column, DataTable, SortableTableHeader } from '../DataTable'
import { RouterLinkButton } from '../RouterLinkButton'

type TransactionsProps = {
  onlyMostRecent?: boolean
  txTypes?: InvestorTransactionType[]
  address: string
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
  },
  {
    align: 'right',
    header: 'Token price',
    cell: ({ tranche }: Row) => (
      <Text as="span" variant="body3">
        {formatBalance(tranche?.tokenPrice?.toDecimal() || Dec(1), tranche?.currency.symbol, 4)}
      </Text>
    ),
  },
  {
    align: 'right',
    header: <SortableTableHeader label="Amount" />,
    cell: ({ amount, tranche }: Row) => (
      <Text as="span" variant="body3">
        {formatBalance(amount.toDecimal(), tranche?.currency.symbol || '')}
      </Text>
    ),
    sortKey: 'amount',
  },
  {
    align: 'center',
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

export function Transactions({ onlyMostRecent, txTypes, address }: TransactionsProps) {
  const { formatAddress } = useCentrifugeUtils()
  const transactions = useTransactionsByAddress(formatAddress(address))
  const pools = usePools()

  const investorTransactions: TransactionTableData = React.useMemo(() => {
    const txs =
      transactions?.investorTransactions
        .slice(0, onlyMostRecent ? 3 : transactions?.investorTransactions.length)
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
  }, [transactions?.investorTransactions, onlyMostRecent, txTypes, pools])

  const csvData = React.useMemo(() => {
    if (!investorTransactions || !investorTransactions?.length) {
      return undefined
    }
    return investorTransactions.map((entry) => {
      const pool = pools?.find((pool) => pool.id === entry.poolId)
      return {
        'Transaction date': `"${formatDate(entry.date)}"`,
        Action: entry.action,
        Token: (pool && pool.tranches.find(({ id }) => id === entry.trancheId)?.currency.name) ?? '',
        Amount: (pool && `"${formatBalance(entry.amount.toDecimal(), pool.currency.symbol)}"`) ?? '',
      }
    })
  }, [investorTransactions, pools])

  const csvUrl = React.useMemo(() => csvData && getCSVDownloadUrl(csvData), [csvData])

  const pagination = usePagination({ data: investorTransactions, pageSize: onlyMostRecent ? 3 : 15 })

  return investorTransactions ? (
    <Stack as="article" gap={onlyMostRecent ? 2 : 5}>
      <Text as="h2" variant="heading2">
        Transaction history
      </Text>
      {investorTransactions.length ? (
        <PaginationProvider pagination={pagination}>
          <Stack gap={2}>
            <DataTable
              data={investorTransactions}
              columns={columns}
              pageSize={pagination.pageSize}
              page={pagination.page}
            />
            {onlyMostRecent ? (
              <Box display="inline-block">
                <RouterLinkButton to="/history" small variant="tertiary" icon={IconEye}>
                  View all
                </RouterLinkButton>
              </Box>
            ) : (
              <Shelf justifyContent="space-between">
                {pagination.pageCount > 1 && (
                  <Shelf>
                    <Pagination />
                  </Shelf>
                )}
                {csvUrl && (
                  <Box style={{ gridColumn: columns.length, justifySelf: 'end' }}>
                    <AnchorButton
                      small
                      variant="secondary"
                      href={csvUrl}
                      download={`transaction-history-${address}.csv`}
                    >
                      Export as CSV
                    </AnchorButton>
                  </Box>
                )}
              </Shelf>
            )}
          </Stack>
        </PaginationProvider>
      ) : (
        <Text>No transactions</Text>
      )}
    </Stack>
  ) : (
    <Spinner />
  )
}
