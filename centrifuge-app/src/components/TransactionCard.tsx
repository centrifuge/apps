import { BorrowerTransactionType, InvestorTransactionType, Pool } from '@centrifuge/centrifuge-js'
import { Box, Grid, IconExternalLink, Stack, Text } from '@centrifuge/fabric'
import * as React from 'react'
import { formatDate } from '../utils/date'
import { usePool, usePoolMetadata } from '../utils/usePools'

export type TransactionCardProps = {
  date: number
  action: InvestorTransactionType | BorrowerTransactionType | 'PENDING_ORDER'
  amount: unknown
  poolId: string
  hash: string
  trancheId?: string
}

export function TransactionCard({ date, action, amount, poolId, hash, trancheId }: TransactionCardProps) {
  const pool = usePool(poolId) as Pool
  const { data } = usePoolMetadata(pool)
  const token = trancheId ? pool.tranches.find(({ id }) => id === trancheId) : undefined
  const subScanUrl = import.meta.env.REACT_APP_SUBSCAN_URL
  // console.log('data', data)

  // console.log('pool', pool)
  // console.log('token', token)

  if (!pool || !data) {
    return null
  }

  return (
    <Grid
      gridTemplateColumns={`250px 100px 250px 150px 1fr`}
      alignItems="start"
      py={1}
      borderBottomWidth={1}
      borderBottomColor="borderPrimary"
      borderBottomStyle="solid"
    >
      <Text as="span">{action}</Text>

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

      <Text as="span" variant="interactive2">
        {amount}
      </Text>

      {!!subScanUrl && !!hash && (
        <Box
          as="a"
          href={`${import.meta.env.REACT_APP_SUBSCAN_URL}/extrinsic/${hash}`}
          target="_blank"
          rel="noopener noreferrer"
        >
          <IconExternalLink size="iconSmall" />
        </Box>
      )}
    </Grid>
  )
}
