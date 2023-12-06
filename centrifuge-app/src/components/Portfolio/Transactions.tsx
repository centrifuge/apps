import { BorrowerTransactionType, InvestorTransactionType, Pool, Token, TokenBalance } from '@centrifuge/centrifuge-js'
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
  narrow?: boolean
  txTypes?: InvestorTransactionType[]
  address: string
}

type TransactionTableData = Row[]

type Row = {
  action: InvestorTransactionType | BorrowerTransactionType
  date: number
  tranche?: Token
  tranchePrice: string
  amount: TokenBalance
  hash: string
  pool?: Pool
  poolId: string
  trancheId: string
}

export function Transactions({ onlyMostRecent, narrow, txTypes, address }: TransactionsProps) {
  const columns = [
    {
      align: 'left',
      header: 'Action',
      cell: ({ action, tranche, pool, amount }: Row) => (
        <TransactionTypeChip
          type={action as InvestorTransactionType}
          trancheTokenSymbol={tranche?.currency.symbol ?? ''}
          poolCurrencySymbol={pool?.currency.symbol ?? ''}
          currencyAmount={amount.toFloat()}
        />
      ),
    },
    {
      align: 'left',
      header: <SortableTableHeader label="date" />,
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
    !narrow && {
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
      cell: ({ tranche, pool }: Row) => (
        <Text as="span" variant="body3">
          {formatBalance(tranche?.tokenPrice?.toDecimal() || Dec(1), pool?.currency.symbol, 4)}
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
    !narrow && {
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
  ].filter(Boolean) as Column[]

  const { formatAddress } = useCentrifugeUtils()
  const transactions = useTransactionsByAddress(formatAddress(address))
  const pools = usePools()
  const investorTransactions = React.useMemo(() => {
    const txs = transactions?.investorTransactions
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
          pool,
          trancheId: tx.trancheId,
        } as Row
      })
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

  return (
    <Stack as="article" gap={onlyMostRecent ? 2 : 5}>
      <Text as="h2" variant={narrow ? 'heading4' : 'heading2'}>
        Transaction history
      </Text>
      {investorTransactions?.length ? (
        <PaginationProvider pagination={pagination}>
          <Stack gap={2}>
            <Box overflow="auto" width="100%">
              <DataTable
                data={investorTransactions}
                columns={columns}
                pageSize={pagination.pageSize}
                page={pagination.page}
              />
            </Box>
            {onlyMostRecent ? (
              <Box display="inline-block">
                <RouterLinkButton to={`/history/${address}`} small variant="tertiary" icon={IconEye}>
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
      ) : investorTransactions ? (
        <Text>No transactions</Text>
      ) : (
        <Spinner />
      )}
    </Stack>
  )
}
