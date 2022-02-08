import { Shelf, Stack, Text } from '@centrifuge/fabric'
import * as React from 'react'
import { InvestmentsList } from '../components/InvestmentsList'
import { PageHeader } from '../components/PageHeader'
import { PageWithSideBar } from '../components/shared/PageWithSideBar'
import { useAddress } from '../utils/useAddress'
import { useBalances } from '../utils/useBalances'

export const TokensPage: React.FC = () => {
  return (
    <PageWithSideBar>
      <Tokens />
    </PageWithSideBar>
  )
}

const Tokens: React.FC = () => {
  const address = useAddress()
  const { data: balances } = useBalances(address)

  return (
    <Stack gap={8} flex={1}>
      <PageHeader title="Tokens" subtitle="Tranches" />
      {balances?.tranches.length ? (
        <InvestmentsList investments={balances.tranches} />
      ) : (
        <Shelf justifyContent="center" textAlign="center">
          <Text variant="heading2" color="textSecondary">
            You have no investments yet
          </Text>
        </Shelf>
      )}
    </Stack>
  )
}
