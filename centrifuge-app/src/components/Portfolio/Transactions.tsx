import {
  BorrowerTransactionType,
  CurrencyBalance,
  InvestorTransactionType,
  Pool,
  TokenBalance,
} from '@centrifuge/centrifuge-js'
import { useCentrifugeUtils } from '@centrifuge/centrifuge-react'
import {
  AnchorButton,
  Box,
  Grid,
  IconChevronDown,
  IconChevronUp,
  IconExternalLink,
  IconEye,
  Pagination,
  PaginationContainer,
  Shelf,
  Stack,
  Text,
  usePagination,
} from '@centrifuge/fabric'
import * as React from 'react'
import { useRouteMatch } from 'react-router-dom'
import styled from 'styled-components'
import { formatDate } from '../../utils/date'
import { formatBalance } from '../../utils/formatting'
import { getCSVDownloadUrl } from '../../utils/getCSVDownloadUrl'
import { useAddress } from '../../utils/useAddress'
import { usePool, usePoolMetadata, usePools, useTransactionsByAddress } from '../../utils/usePools'
import { TransactionTypeChip } from './TransactionTypeChip'

export const TRANSACTION_CARD_COLUMNS = `150px 125px 200px 150px 1fr`
export const TRANSACTION_CARD_GAP = 4

type TransactionsProps = {
  count?: number
  txTypes?: InvestorTransactionType[]
}

export function Transactions({ count, txTypes }: TransactionsProps) {
  const { formatAddress } = useCentrifugeUtils()
  const address = useAddress()
  const transactions = useTransactionsByAddress(formatAddress(address || ''), count, txTypes)
  const match = useRouteMatch('/history')
  const [sortKey, setSortKey] = React.useState<'date' | 'amount'>('date')
  const [sortOrder, setSortOrder] = React.useState<'asc' | 'desc'>('desc')
  const pagination = usePagination({
    data: transactions?.investorTransactions,
    pageSize: 10,
  })
  const pools = usePools()

  const investorTransactions: TransactionListItemProps[] = React.useMemo(() => {
    const txs =
      transactions?.investorTransactions
        .map((tx) => {
          return {
            date: new Date(tx.timestamp).getTime(),
            type: tx.type,
            poolId: tx.poolId,
            hash: tx.hash,
            trancheId: tx.trancheId,
            amount: tx.currencyAmount,
          }
        })
        .sort((a, b) => {
          if (sortKey === 'date') {
            return new Date(b.date).getTime() - new Date(a.date).getTime()
          } else if (sortKey === 'amount') {
            return b.amount.toDecimal().minus(a.amount.toDecimal()).toNumber()
          } else {
            return 1
          }
        }) || []
    return sortOrder === 'asc' ? txs.reverse() : txs
  }, [sortKey, transactions, sortOrder, pagination])

  const paginatedInvestorTransactions = React.useMemo(() => {
    return investorTransactions.slice(
      (pagination.page - 1) * pagination.pageSize,
      pagination.page * pagination.pageSize
    )
  }, [investorTransactions, pagination])

  const csvData: any = React.useMemo(() => {
    if (!investorTransactions || !investorTransactions?.length) {
      return undefined
    }
    return investorTransactions.map((entry) => {
      const pool = pools?.find((pool) => pool.id === entry.poolId)
      return {
        'Transaction date': `"${formatDate(entry.date)}"`,
        Action: entry.type,
        Token: pool ? pool.tranches.find(({ id }) => id === entry.trancheId)?.currency.name : undefined,
        Amount: pool ? `"${formatBalance(entry.amount.toDecimal(), pool.currency.symbol)}"` : undefined,
      }
    })
  }, [investorTransactions])

  return !!paginatedInvestorTransactions.length ? (
    <PaginationContainer pagination={pagination}>
      <Stack as="article" gap={2}>
        <Text as="h2" variant="heading2">
          {match ? null : 'Transaction history'}
        </Text>

        <Stack gap={2}>
          <Grid gridTemplateColumns={TRANSACTION_CARD_COLUMNS} gap={TRANSACTION_CARD_GAP}>
            <Text variant="body3">Action</Text>
            <SortButton
              as="button"
              onClick={() => {
                setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
                setSortKey('date')
              }}
              gap={1}
            >
              <Text variant="body3">Transaction date</Text>
              <Stack as="span" width="1em" style={{ marginTop: '-.3em' }}>
                <IconChevronUp
                  size="1em"
                  color={sortKey === 'date' && sortOrder === 'asc' ? 'textSelected' : 'textSecondary'}
                />
                <IconChevronDown
                  size="1em"
                  color={sortKey === 'date' && sortOrder === 'desc' ? 'textSelected' : 'textSecondary'}
                  style={{ marginTop: '-.4em' }}
                />
              </Stack>
            </SortButton>

            <Text variant="body3">Token</Text>

            <SortButton
              as="button"
              onClick={() => {
                setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
                setSortKey('amount')
              }}
              gap={1}
              justifyContent="flex-end"
            >
              <Text variant="body3">Amount</Text>
              <Stack as="span" width="1em" style={{ marginTop: '-.3em' }}>
                <IconChevronUp
                  size="1em"
                  color={sortKey === 'amount' && sortOrder === 'asc' ? 'textSelected' : 'textSecondary'}
                />
                <IconChevronDown
                  size="1em"
                  color={sortKey === 'amount' && sortOrder === 'desc' ? 'textSelected' : 'textSecondary'}
                  style={{ marginTop: '-.4em' }}
                />
              </Stack>
            </SortButton>
          </Grid>

          <Stack as="ul" role="list">
            {paginatedInvestorTransactions.map((transaction, index) => (
              <Box as="li" key={`${transaction.poolId}${index}`}>
                <TransactionListItem {...transaction} />
              </Box>
            ))}
          </Stack>
        </Stack>
        {match ? null : (
          <Box>
            <AnchorButton small variant="tertiary" href="history" icon={IconEye}>
              View all
            </AnchorButton>
          </Box>
        )}
        <Shelf justifyContent="space-between">
          {pagination.pageCount > 1 && (
            <Shelf>
              <Pagination />
            </Shelf>
          )}
          {!match ? null : (
            <AnchorButton
              small
              variant="secondary"
              href={getCSVDownloadUrl(csvData)}
              download={`transaction-history-${address}.csv`}
            >
              Export as CSV
            </AnchorButton>
          )}
        </Shelf>
      </Stack>
    </PaginationContainer>
  ) : null
}

export type TransactionListItemProps = {
  date: number
  type: InvestorTransactionType | BorrowerTransactionType
  amount: CurrencyBalance | TokenBalance
  poolId: string
  hash: string
  trancheId?: string
}

export function TransactionListItem({ date, type, amount, poolId, hash, trancheId }: TransactionListItemProps) {
  const pool = usePool(poolId) as Pool
  const { data } = usePoolMetadata(pool)
  const token = trancheId ? pool.tranches.find(({ id }) => id === trancheId) : undefined
  const subScanUrl = import.meta.env.REACT_APP_SUBSCAN_URL

  if (!pool || !data) {
    return null
  }

  return !!subScanUrl && !!hash ? (
    <Box
      as="a"
      href={`${subScanUrl}/extrinsic/${hash}`}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Transaction on Subscan.io"
    >
      <Grid
        gridTemplateColumns={TRANSACTION_CARD_COLUMNS}
        gap={TRANSACTION_CARD_GAP}
        alignItems="start"
        py={1}
        borderBottomWidth={1}
        borderBottomColor="borderPrimary"
        borderBottomStyle="solid"
      >
        <Box>
          <TransactionTypeChip type={type} />
        </Box>

        <Text as="time" variant="interactive2" datetime={date}>
          {formatDate(date, {
            day: '2-digit',
            month: '2-digit',
            year: '2-digit',
          })}
        </Text>

        <Stack gap={1}>
          <Text as="span" variant="interactive2">
            {!!token ? token?.currency?.name.split(`${data?.pool?.name} ` || '').at(-1) : data.pool?.name}
          </Text>
          {!!token && (
            <Text as="span" variant="interactive2" color="textDisabled">
              {data?.pool?.name}
            </Text>
          )}
        </Stack>

        <Box justifySelf="end">
          <Text as="span" variant="interactive2">
            {formatBalance(amount.toDecimal(), pool.currency.symbol)}
          </Text>
        </Box>

        {!!subScanUrl && !!hash && (
          <Box justifySelf="end">
            <IconExternalLink size="iconSmall" color="textPrimary" />
          </Box>
        )}
      </Grid>
    </Box>
  ) : null
}

const SortButton = styled(Shelf)`
  background: initial;
  border: none;
  cursor: pointer;
  display: inline-flex;
  align-items: flex-start;
`
