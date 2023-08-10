import { Box } from '@centrifuge/fabric'
import * as React from 'react'
import { useAddress } from '../utils/useAddress'
import { useAllTransactions } from '../utils/usePools'

export function AddressTransactions() {
  const address = useAddress()
  const transactions = useAllTransactions(address)

  return (
    <Box>
      <Box as="ul" role="list">
        <Box as="li">Todo: render transactions</Box>
      </Box>

      <button>View all</button>
    </Box>
  )
}
