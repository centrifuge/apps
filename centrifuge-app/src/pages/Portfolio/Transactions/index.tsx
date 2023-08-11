import { Box, Stack, Text } from '@centrifuge/fabric'
import * as React from 'react'
import { AddressTransactions } from '../../../components/AddressTransactions'
import { PageWithSideBar } from '../../../components/PageWithSideBar'
import { useAddress } from '../../../utils/useAddress'

export function TransactionsPage() {
  return (
    <PageWithSideBar>
      <Transactions />
    </PageWithSideBar>
  )
}

function Transactions() {
  const address = useAddress()

  return (
    <Stack>
      <Box as="header">
        <Text as="h1">Transactions</Text>
        {!!address ? (
          <AddressTransactions />
        ) : (
          <Text as="strong">You need to connect your wallet to see your transactions</Text>
        )}
      </Box>
    </Stack>
  )
}
