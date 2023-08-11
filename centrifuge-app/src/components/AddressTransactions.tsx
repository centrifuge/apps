import { Box } from '@centrifuge/fabric'
import * as React from 'react'
import { useAddress } from '../utils/useAddress'
import { useAllTransactions } from '../utils/usePools'

type AddressTransactionsProps = {
  count?: number
}

export function AddressTransactions({ count }: AddressTransactionsProps) {
  const address = useAddress()
  const transactions = useAllTransactions(address)

  return (
    <Box as="ul" role="list">
      <Box as="li">Todo: render transactions</Box>
    </Box>
  )
}
