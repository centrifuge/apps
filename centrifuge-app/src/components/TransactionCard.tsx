import { BorrowerTransactionType, CurrencyBalance, InvestorTransactionType, Pool } from '@centrifuge/centrifuge-js'
import { Box, Grid, IconExternalLink, Stack, Text } from '@centrifuge/fabric'
import * as React from 'react'
import { formatDate } from '../utils/date'
import { formatBalance } from '../utils/formatting'
import { usePool, usePoolMetadata } from '../utils/usePools'
import { TransactionTypeChip } from './TransactionTypeChip'

export type TransactionCardProps = {
  date: number
  action: InvestorTransactionType | BorrowerTransactionType | 'PENDING_ORDER'
  amount: CurrencyBalance
  poolId: string
  hash: string
  trancheId?: string
}

export const TRANSACTION_CARD_COLUMNS = `150px 100px 250px 150px 1fr`
export const TRANSACTION_CARD_GAP = 4

export function TransactionCard({ date, action, amount, poolId, hash, trancheId }: TransactionCardProps) {
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
          {formatBalance(amount, pool.currency)}
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
