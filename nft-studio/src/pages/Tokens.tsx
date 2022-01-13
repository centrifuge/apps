import { Shelf, Stack, Text } from '@centrifuge/fabric'
import * as React from 'react'
import { InvestmentsList } from '../components/InvestmentsList'
import { PageHeader } from '../components/PageHeader'
import { PageWithSideBar } from '../components/shared/PageWithSideBar'
import { useInvestmentTokens } from '../utils/useInvestments'

export const TokensPage: React.FC = () => {
  return (
    <PageWithSideBar>
      <Tokens />
    </PageWithSideBar>
  )
}

const Tokens: React.FC = () => {
  const { data: tokens } = useInvestmentTokens('kAMx1vYzEvumnpGcd6a5JL6RPE2oerbr6pZszKPFPZby2gLLF')
  console.log('tokens', tokens)

  return (
    <Stack gap={8} flex={1}>
      <PageHeader title="Tokens" subtitle="Tranches" />
      {tokens?.length ? (
        <InvestmentsList investments={tokens} />
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
