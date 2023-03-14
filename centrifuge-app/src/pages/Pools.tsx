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
import { formatBalance } from '../utils/formatting'
import { useListedPools } from '../utils/useListedPools'
import { usePools } from '../utils/usePools'

export const PoolsPage: React.FC = () => {
  return (
    <PageWithSideBar sidebar>
      <Pools />
    </PageWithSideBar>
  )
}

const Pools: React.FC = () => {
  const pools = usePools()
  const [listedPools, listedTokens, metadataIsLoading] = useListedPools()
  const totalValueLocked = React.useMemo(() => {
    return (
      listedTokens
        ?.map((tranche) => ({
          valueLocked: tranche.totalIssuance
            .toDecimal()
            .mul(tranche.tokenPrice?.toDecimal() ?? Dec(0))
            .toNumber(),
        }))
        .reduce((prev, curr) => prev.add(curr.valueLocked), Dec(0)) ?? Dec(0)
    )
  }, [listedTokens])

  const pageSummaryData = [
    {
      label: <Tooltips type="tvl" />,
      value: formatBalance(Dec(totalValueLocked || 0), config.baseCurrency),
    },
    { label: 'Pools', value: listedPools?.length || 0 },
    { label: <Tooltips type="tokens" />, value: listedTokens?.length || 0 },
  ]

  return (
    <Stack gap={0} flex={1}>
      <PageHeader
        title="Pools"
        subtitle={`Pools and tokens ${config.network === 'centrifuge' ? 'of real-world assets' : ''}`}
        actions={<MenuSwitch />}
      />

      {pools?.length ? (
        <>
          <PageSummary data={pageSummaryData} />
          <PoolList pools={listedPools} isLoading={metadataIsLoading} />
        </>
      ) : (
        <Shelf p={4} justifyContent="center" textAlign="center">
          <Text variant="heading2" color="textSecondary">
            There are no pools yet
          </Text>
        </Shelf>
      )}
    </Stack>
  )
}
