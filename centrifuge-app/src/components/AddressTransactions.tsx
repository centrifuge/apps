import { useCentrifugeUtils } from '@centrifuge/centrifuge-react'
import { Box, Stack, Text } from '@centrifuge/fabric'
import * as React from 'react'
import { formatDate } from '../utils/date'
import { useAddress } from '../utils/useAddress'
import { useAllTransactions, usePoolMetadata } from '../utils/usePools'

type AddressTransactionsProps = {
  count?: number
}

export function AddressTransactions({ count }: AddressTransactionsProps) {
  const { formatAddress } = useCentrifugeUtils()
  const address = useAddress()
  const formattedAddress = formatAddress(address || '')
  const transactions = useAllTransactions(formattedAddress)
  const sorted = [
    ...(transactions?.borrowerTransactions ?? []),
    ...(transactions?.investorTransactions ?? []),
    ...(transactions?.outstandingOrders ?? []),
  ].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
  // console.log('transactions', transactions)

  return !!sorted.length ? (
    <Stack as="ul" role="list" gap={1}>
      {sorted?.map(({ pool, timestamp }, index) => (
        <Box as="li" key={`${pool.metadata}${index}`}>
          <Card metadata={pool.metadata} date={timestamp} />
        </Box>
      ))}
    </Stack>
  ) : null
}

function Card({ metadata, date }: { metadata: string; date: string }) {
  const { data } = usePoolMetadata({ metadata })
  console.log('iets', data)

  return (
    <Box border="1px solid pink">
      <Text as="h3">{data?.pool?.name}</Text>
      <Text as="time">{formatDate(date)}</Text>
    </Box>
  )
}
