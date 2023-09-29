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
  Shelf,
  Stack,
  Text,
} from '@centrifuge/fabric'
import * as React from 'react'
import { useRouteMatch } from 'react-router-dom'
import styled from 'styled-components'
import { formatDate } from '../../utils/date'
import { formatBalance } from '../../utils/formatting'
import { useAddress } from '../../utils/useAddress'
import { usePool, usePoolMetadata, useTransactionsByAddress } from '../../utils/usePools'
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
  }, [sortKey, transactions, sortOrder])

  return !!investorTransactions.length ? (
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
          {investorTransactions.map((transaction, index) => (
            <Box as="li" key={`${transaction.poolId}${index}`}>
              <TransactionListItem {...transaction} />
            </Box>
          ))}
        </Stack>
      </Stack>
      <Box>
        {match ? null : (
          <AnchorButton small variant="tertiary" href="history" icon={IconEye}>
            View all
          </AnchorButton>
        )}
      </Box>
    </Stack>
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

  return (
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
        <Box
          as="a"
          href={`${subScanUrl}/extrinsic/${hash}`}
          target="_blank"
          rel="noopener noreferrer"
          justifySelf="end"
          aria-label="Transaction on Subscan.io"
        >
          <IconExternalLink size="iconSmall" color="textPrimary" />
        </Box>
      )}
    </Grid>
  )
}

const SortButton = styled(Shelf)`
  background: initial;
  border: none;
  cursor: pointer;
  display: inline-flex;
  align-items: flex-start;
`
