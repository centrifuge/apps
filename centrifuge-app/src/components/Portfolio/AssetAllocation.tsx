import { useBalances } from '@centrifuge/centrifuge-react'
import { Box, Text } from '@centrifuge/fabric'
import * as React from 'react'
import { useAddress } from '../../utils/useAddress'

export function AssetAllocation() {
  const address = useAddress()
  const balances = useBalances(address)

  return !!balances?.tranches && !!balances?.tranches.length ? (
    <Box as="article">
      <Text as="h2" variant="heading2">
        Allocation
      </Text>
      <Box as="ul" role="list">
        {balances?.tranches.map((tranche, index) => (
          <Box as="li" key={`${tranche.trancheId}${index}`}>
            <Box>
              <Text>Asset Class</Text>{' '}
            </Box>
          </Box>
        ))}
      </Box>
    </Box>
  ) : null
}
