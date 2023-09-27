import { BorrowerTransactionType, CurrencyBalance, InvestorTransactionType, Pool } from '@centrifuge/centrifuge-js'
import { useCentrifugeUtils } from '@centrifuge/centrifuge-react'
import { Box, Grid, IconExternalLink, Stack, Text } from '@centrifuge/fabric'
import * as React from 'react'
import { Link } from 'react-router-dom'
import { formatDate } from '../../utils/date'
import { formatBalanceAbbreviated } from '../../utils/formatting'
import { useAddress } from '../../utils/useAddress'
import { usePool, usePoolMetadata, useTransactionsByAddress } from '../../utils/usePools'
import { TransactionTypeChip } from './TransactionTypeChip'

export const TRANSACTION_CARD_COLUMNS = `150px 125px 200px 150px 1fr`
export const TRANSACTION_CARD_GAP = 4

type AddressTransactionsProps = {
  count?: number
  txTypes?: InvestorTransactionType[]
}

export function Transactions({ count, txTypes }: AddressTransactionsProps) {
  const { formatAddress } = useCentrifugeUtils()
  const address = useAddress()
  const transactions = useTransactionsByAddress(formatAddress(address || ''))

  const investorTransactions =
    transactions?.investorTransactions
      .filter((tx) => (txTypes ? txTypes?.includes(tx.type) : tx))
      .map((tx) => {
        return {
          date: new Date(tx.timestamp).getTime(),
          action: tx.type,
          amount: tx.tokenAmount,
          poolId: tx.poolId,
          hash: tx.hash,
          trancheId: tx.trancheId,
        }
      }) || []

  return !!investorTransactions.slice(0, count ?? investorTransactions.length) ? (
    <Stack as="article" gap={2}>
      <Text as="h2" variant="heading2">
        Transaction history
      </Text>
      <Stack>
        <Grid gridTemplateColumns={TRANSACTION_CARD_COLUMNS} gap={TRANSACTION_CARD_GAP}>
          <Text variant="body3">Action</Text>

          <Text variant="body3">Transaction date</Text>

          <Text variant="body3">Token</Text>

          <Box justifySelf="end">
            <Text variant="body3">Amount</Text>
          </Box>
        </Grid>

        <Stack as="ul" role="list">
          {investorTransactions.slice(0, count ?? investorTransactions.length).map((transaction, index) => (
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
          {!!token ? token.currency?.name.split(data.pool?.name || '') : data.pool?.name}
        </Text>
        {!!token && (
          <Text as="span" variant="interactive2" color="textDisabled">
            {data?.pool?.name}
          </Text>
        )}
      </Stack>

      <Box justifySelf="end">
        <Text as="span" variant="interactive2">
          {formatBalanceAbbreviated(amount, pool.currency.symbol)}
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
