import { useBalances } from '@centrifuge/centrifuge-react'
import { Box } from '@centrifuge/fabric'
import * as React from 'react'
import { useAddress } from '../utils/useAddress'

export function AddressTokens() {
  const address = useAddress()
  const balances = useBalances(address)

  return (
    <Box as="ul" role="list">
      <Box as="li">Todo: render all tokens</Box>
    </Box>
  )
}
