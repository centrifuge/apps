import {
  SubqueryBorrowerTransaction,
  SubqueryInvestorTransaction,
  SubqueryOutstandingOrder,
} from '@centrifuge/centrifuge-js'
import { useCentrifugeUtils } from '@centrifuge/centrifuge-react'
import { Box, Grid, Stack, Text } from '@centrifuge/fabric'
import * as React from 'react'
import { useAddress } from '../utils/useAddress'
import { useAllTransactions } from '../utils/usePools'
import {
  TransactionCard,
  TransactionCardProps,
  TRANSACTION_CARD_COLUMNS,
  TRANSACTION_CARD_GAP,
} from './TransactionCard'

type AddressTransactionsProps = {
  count?: number
}

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

export function AddressTransactions({ count }: AddressTransactionsProps) {
  const { formatAddress } = useCentrifugeUtils()
  const address = useAddress()
  const formattedAddress = formatAddress(address || '')
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
            <TransactionCard {...transaction} />
          </Box>
        ))}
      </Stack>
    </Stack>
  ) : (
    <Text>No data</Text>
  )
}
