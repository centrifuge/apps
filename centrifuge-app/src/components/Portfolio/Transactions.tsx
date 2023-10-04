import {
  BorrowerTransactionType,
  CurrencyBalance,
  InvestorTransactionType,
  Pool,
  SubqueryInvestorTransaction,
} from '@centrifuge/centrifuge-js'
import { formatBalance, useCentrifugeUtils } from '@centrifuge/centrifuge-react'
import { Box, Grid, IconExternalLink, Stack, Text } from '@centrifuge/fabric'
import { isAddress as isValidEVMAddress } from '@ethersproject/address'
import { Link } from 'react-router-dom'
import { formatDate } from '../../utils/date'
import { useAddress } from '../../utils/useAddress'
import { useAllTransactions, usePool, usePoolMetadata } from '../../utils/usePools'
import { TransactionTypeChip } from './TransactionTypeChip'

export const TRANSACTION_CARD_COLUMNS = `150px 100px 250px 150px 1fr`
export const TRANSACTION_CARD_GAP = 4

type AddressTransactionsProps = {
  count?: number
}

type SubqueryBorrowerTransaction = any
type SubqueryOutstandingOrder = any

const formatters = {
  investorTransactions: ({
    timestamp,
    type,
    poolId,
    hash,
    tokenAmount,
    tokenPrice,
    currencyAmount,
    trancheId,
  }: Omit<SubqueryInvestorTransaction, 'id' | 'accountId' | 'epochNumber'>) => {
    return {
      date: new Date(timestamp).getTime(),
      action: type,
      amount: tokenAmount,
      poolId,
      hash,
      trancheId,
    } as TransactionCardProps
  },
  borrowerTransactions: ({ timestamp, type, amount, poolId, hash }: SubqueryBorrowerTransaction) =>
    ({
      date: new Date(timestamp).getTime(),
      action: type,
      amount,
      poolId,
      hash,
    } as TransactionCardProps),
  outstandingOrders: ({ timestamp, investAmount, redeemAmount, poolId, hash, trancheId }: SubqueryOutstandingOrder) =>
    ({
      date: new Date(timestamp).getTime(),
      action: 'PENDING_ORDER',
      amount: investAmount.add(redeemAmount),
      poolId,
      hash,
      trancheId,
    } as TransactionCardProps),
}

export function Transactions({ count }: AddressTransactionsProps) {
  const { formatAddress } = useCentrifugeUtils()
  const address = useAddress()
  const formattedAddress = address && isValidEVMAddress(address) ? address : formatAddress(address || '')
  const allTransactions = useAllTransactions(formattedAddress)
  const formattedTransactions: TransactionCardProps[] = []

  if (allTransactions) {
    const { borrowerTransactions, investorTransactions, outstandingOrders } = allTransactions

    investorTransactions.forEach((transaction) =>
      formattedTransactions.push(formatters.investorTransactions(transaction))
    )
    borrowerTransactions.forEach((transaction) =>
      formattedTransactions.push(formatters.borrowerTransactions(transaction))
    )
    outstandingOrders.forEach((transaction) => formattedTransactions.push(formatters.outstandingOrders(transaction)))
  }

  const transactions = formattedTransactions.slice(0, count ?? formattedTransactions.length)

  return !!transactions.length ? (
    <Stack as="article" gap={2}>
      <Text as="h2" variant="heading2">
        Transaction history
      </Text>
      <Stack>
        <Grid gridTemplateColumns={TRANSACTION_CARD_COLUMNS} gap={TRANSACTION_CARD_GAP}>
          <Text variant="body3">Action</Text>

          <Text as="button" variant="body3">
            Transaction date
          </Text>

          <Text variant="body3">Token</Text>

          <Box justifySelf="end">
            <Text as="button" variant="body3">
              Amount
            </Text>
          </Box>
        </Grid>

        <Stack as="ul" role="list">
          {transactions.map((transaction, index) => (
            <Box as="li" key={`${transaction.poolId}${index}`}>
              <TransactionListItem {...transaction} />
            </Box>
          ))}
        </Stack>
      </Stack>
      <Link to="portfolio/transactions">View all</Link>
    </Stack>
  ) : null
}

export type TransactionCardProps = {
  date: number
  action: InvestorTransactionType | BorrowerTransactionType | 'PENDING_ORDER'
  amount: CurrencyBalance
  poolId: string
  hash: string
  trancheId?: string
}

export function TransactionListItem({ date, action, amount, poolId, hash, trancheId }: TransactionCardProps) {
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
        <TransactionTypeChip type={action} />
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
          {!!token ? token.currency?.name : data.pool?.name}
        </Text>
        {!!token && (
          <Text as="span" variant="interactive2" color="textSecondary">
            {data?.pool?.name}
          </Text>
        )}
      </Stack>

      <Box justifySelf="end">
        <Text as="span" variant="interactive2">
          {formatBalance(amount, pool.currency.symbol)}
        </Text>
      </Box>

      {!!subScanUrl && !!hash && (
        <Box
          as="a"
          href={`${import.meta.env.REACT_APP_SUBSCAN_URL}/extrinsic/${hash}`}
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
