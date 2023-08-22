import { useBalances } from '@centrifuge/centrifuge-react'
import { Box, Text } from '@centrifuge/fabric'
import * as React from 'react'
import { useAddress } from '../utils/useAddress'
import { AllocationCard } from './AllocationCard'

export function AddressAllocation() {
  const address = useAddress()
  const balances = useBalances(address)

  return !!balances?.tranches && !!balances?.tranches.length ? (
    <Box>
      <Box as="ul" role="list">
        {balances?.tranches.map((tranche, index) => (
          <Box as="li" key={`${tranche.trancheId}${index}`}>
            <AllocationCard {...tranche} />
          </Box>
        ))}
      </Box>
    </Box>
  ) : (
    <Text>No data</Text>
  )
}
