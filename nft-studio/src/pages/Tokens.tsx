import { Shelf, Stack, Text } from '@centrifuge/fabric'
import * as React from 'react'
import { PageHeader } from '../components/PageHeader'
import { PageWithSideBar } from '../components/PageWithSideBar'
import { TokenList } from '../components/TokenList'
import { useAddress } from '../utils/useAddress'
import { useBalances } from '../utils/useBalances'

export const TokenOverviewPage: React.FC = () => {
  return (
    <PageWithSideBar>
      <TokenOverview />
    </PageWithSideBar>
  )
}

const TokenOverview: React.FC = () => {
  const address = useAddress()
  const balances = useBalances(address)
  console.log('🚀 ~ balances', balances)

  return (
    <Stack gap={0} flex={1}>
      <PageHeader pretitle="Tokens" title="Art NFT Tokens" />
      {balances?.tranches.length ? (
        <TokenList tokens={balances.tranches} />
      ) : (
        <Shelf justifyContent="center" textAlign="center">
          <Text variant="heading2" color="textSecondary">
            There are no tokens yet
          </Text>
        </Shelf>
      )}
    </Stack>
  )
}
