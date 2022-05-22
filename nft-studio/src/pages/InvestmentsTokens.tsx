import { Shelf, Stack, Text } from '@centrifuge/fabric'
import * as React from 'react'
import { InvestmentsList } from '../components/InvestmentsList'
import { LabelValueStack } from '../components/LabelValueStack'
import { PageHeader } from '../components/PageHeader'
import { PageSection } from '../components/PageSection'
import { PageSummary } from '../components/PageSummary'
import { PageWithSideBar } from '../components/PageWithSideBar'
import { Dec } from '../utils/Decimal'
import { formatBalance } from '../utils/formatting'
import { useAddress } from '../utils/useAddress'
import { useBalances } from '../utils/useBalances'

export const InvestmentsTokensPage: React.FC = () => {
  return (
    <PageWithSideBar>
      <Tokens />
    </PageWithSideBar>
  )
}

const Tokens: React.FC = () => {
  const address = useAddress()
  const balances = useBalances(address)

  const totalValueLocked = React.useMemo(
    () =>
      balances?.tranches.reduce((prev, curr) => {
        return prev.add(curr.balance.toFloat())
      }, Dec(0)),
    [balances]
  )

  return (
    <Stack gap={0} flex={1}>
      <PageHeader title="My investments" subtitle="Portfolio" />
      <PageSummary>
        <LabelValueStack label="Total value" value={totalValueLocked ? formatBalance(totalValueLocked, 'USD') : '0'} />
      </PageSummary>
      {balances?.tranches.length ? (
        <PageSection title="Tokens">
          <InvestmentsList investments={balances.tranches} />
        </PageSection>
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
