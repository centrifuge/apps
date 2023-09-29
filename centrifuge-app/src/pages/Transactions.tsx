import { Box, Stack, Text } from '@centrifuge/fabric'
import * as React from 'react'
import { LayoutBase } from '../components/LayoutBase'
import { BasePadding } from '../components/LayoutBase/BasePadding'
import { Transactions } from '../components/Portfolio/Transactions'
import { useAddress } from '../utils/useAddress'

export function TransactionsPage() {
  const address = useAddress()
  return (
    <LayoutBase>
      <BasePadding>
        <Stack>
          <Box as="header" pb={5}>
            <Text as="h1" variant="heading1">
              Transaction history
            </Text>
          </Box>

          {!!address ? (
            <Transactions />
          ) : (
            <Text as="strong">You need to connect your wallet to see your transactions</Text>
          )}
        </Stack>
      </BasePadding>
    </LayoutBase>
  )
}
