import { Shelf, Stack, Text } from '@centrifuge/fabric'
import * as React from 'react'
import { PageHeader } from '../components/PageHeader'
import { PageSummary } from '../components/PageSummary'
import { PageWithSideBar } from '../components/PageWithSideBar'
import { TokenList } from '../components/TokenList'
import { usePools } from '../utils/usePools'

export const TokenOverviewPage: React.FC = () => {
  return (
    <PageWithSideBar sidebar>
      <TokenOverview />
    </PageWithSideBar>
  )
}

const TokenOverview: React.FC = () => {
  const pools = usePools()

  const pageSummaryData = [
    { label: 'Total Value Locked (TVL)', value: '50,817,343 kUSD' },
    { label: 'Tokens', value: '5' },
  ]
  return (
    <Stack gap={0} flex={1}>
      <PageHeader subtitle="Art NFTs" title="Investment tokens" walletShown={false} />
      {pools?.length ? (
        <>
          <PageSummary data={pageSummaryData} />
          <TokenList pools={pools} />
        </>
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
