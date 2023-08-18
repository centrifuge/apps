import {
  SubqueryBorrowerTransaction,
  SubqueryInvestorTransaction,
  SubqueryOutstandingOrder,
} from '@centrifuge/centrifuge-js'
import { useCentrifugeUtils } from '@centrifuge/centrifuge-react'
import { Box, Stack } from '@centrifuge/fabric'
import * as React from 'react'
import { useAddress } from '../utils/useAddress'
import { useAllTransactions } from '../utils/usePools'
import { TransactionCard, TransactionCardProps } from './TransactionCard'

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
  }: Pick<SubqueryInvestorTransaction, 'timestamp' | 'type' | 'poolId' | 'hash' | 'tokenAmount' | 'tokenPrice'>) =>
    ({
      date: new Date(timestamp).getTime(),
      action: type,
      amount: 0, // tokenAmount && tokenPrice
      poolId,
      hash,
    } as TransactionCardProps),
  borrowerTransactions: ({ timestamp, type, amount, poolId, hash }: SubqueryBorrowerTransaction) =>
    ({
      date: new Date(timestamp).getTime(),
      action: type,
      amount,
      poolId,
      hash,
    } as TransactionCardProps),
  outstandingOrders: ({ timestamp, investAmount, redeemAmount, poolId, hash }: SubqueryOutstandingOrder) =>
    ({
      date: new Date(timestamp).getTime(),
      action: 'PENDING_ORDER',
      amount: 0,
      poolId,
      hash,
    } as TransactionCardProps),
}

export function AddressTransactions({ count }: AddressTransactionsProps) {
  const { formatAddress } = useCentrifugeUtils()
  const address = useAddress()
  const formattedAddress = formatAddress(address || '')
  const transactions = useAllTransactions(formattedAddress)
  const formattedTransactions: TransactionCardProps[] = []

  if (transactions) {
    const { borrowerTransactions, investorTransactions, outstandingOrders } = transactions

    investorTransactions.forEach((transaction) =>
      formattedTransactions.push(formatters.investorTransactions(transaction))
    )
    borrowerTransactions.forEach((transaction) =>
      formattedTransactions.push(formatters.borrowerTransactions(transaction))
    )
    outstandingOrders.forEach((transaction) => formattedTransactions.push(formatters.outstandingOrders(transaction)))
  }
  // console.log('transactions', transactions?.investorTransactions)

  return !!formattedTransactions.length ? (
    <Stack as="ul" role="list">
      {formattedTransactions.map((transaction, index) => (
        <Box as="li" key={`${transaction.poolId}${index}`}>
          <TransactionCard {...transaction} />
        </Box>
      ))}
    </Stack>
  ) : null
}
