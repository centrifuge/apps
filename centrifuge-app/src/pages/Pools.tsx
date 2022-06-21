import { Shelf, Stack, Text } from '@centrifuge/fabric'
import * as React from 'react'
import { MenuSwitch } from '../components/MenuSwitch'
import { PageHeader } from '../components/PageHeader'
import { PageSummary } from '../components/PageSummary'
import { PageWithSideBar } from '../components/PageWithSideBar'
import { PoolList } from '../components/PoolList'
import { Tooltips } from '../components/Tooltips'
import { config } from '../config'
import { Dec } from '../utils/Decimal'
import { formatBalance, getCurrencySymbol } from '../utils/formatting'
import { usePools, useTokens } from '../utils/usePools'

export const PoolsPage: React.FC = () => {
  return (
    <PageWithSideBar sidebar>
      <Pools />
    </PageWithSideBar>
  )
}

const Pools: React.FC = () => {
  const pools = usePools()
  const tokens = useTokens()

  const totalValueLocked = React.useMemo(() => {
    return (
      tokens
        ?.map((tranche) => ({
          valueLocked: tranche.totalIssuance
            .toDecimal()
            .mul(tranche.tokenPrice?.toDecimal() ?? Dec(0))
            .toNumber(),
        }))
        .reduce((prev, curr) => prev.add(curr.valueLocked), Dec(0)) ?? Dec(0)
    )
  }, [tokens])

  const pageSummaryData = [
    {
      label: <Tooltips type="tvl" />,
      value: formatBalance(Dec(totalValueLocked || 0), getCurrencySymbol(config.baseCurrency)),
    },
    { label: 'Pools', value: pools?.length || 0 },
    { label: <Tooltips type="tokens" />, value: tokens?.length || 0 },
  ]

  return (
    <Stack gap={0} flex={1}>
      <PageHeader title="Investments" subtitle="Pools and tokens of real-world assets" actions={<MenuSwitch />} />
      {pools?.length ? (
        <>
          <PageSummary data={pageSummaryData} />
          <PoolList pools={pools} />
        </>
      ) : (
        <Shelf justifyContent="center" textAlign="center">
          <Text variant="heading2" color="textSecondary">
            There are no pools yet
          </Text>
        </Shelf>
      )}
    </Stack>
  )
}
