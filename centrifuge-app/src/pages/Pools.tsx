import { Box, Shelf, Stack, Text } from '@centrifuge/fabric'
import * as React from 'react'
import { CardTotalValueLocked } from '../components/CardTotalValueLocked'
import { LoadBoundary } from '../components/LoadBoundary'
import { MenuSwitch } from '../components/MenuSwitch'
import { PageHeader } from '../components/PageHeader'
import { PageSummary } from '../components/PageSummary'
import { PageWithSideBar } from '../components/PageWithSideBar'
import { PoolList } from '../components/PoolList'
import { PoolsSwitch } from '../components/PoolsSwitch'
import { Tooltips } from '../components/Tooltips'
import { config } from '../config'
import { Dec } from '../utils/Decimal'
import { formatBalance } from '../utils/formatting'
import { useListedPools } from '../utils/useListedPools'

export const PoolsPage: React.FC = () => {
  return (
    <PageWithSideBar sidebar>
      <LoadBoundary>
        <Box p={2}>
          <CardTotalValueLocked />
        </Box>
      </LoadBoundary>
      <Pools />
    </PageWithSideBar>
  )
}

const Pools: React.FC = () => {
  const [filtered, setFiltered] = React.useState(true)
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

      {listedPools?.length ? (
        <>
          <PageSummary data={pageSummaryData} />
          <PoolList
            pools={filtered ? listedPools.filter(({ reserve }) => reserve.max.toFloat() > 0) : listedPools}
            isLoading={metadataIsLoading}
          />
          <Box mx={2} mt={3} p={2} borderWidth={0} borderTopWidth={1} borderStyle="solid" borderColor="borderSecondary">
            <PoolsSwitch filtered={filtered} setFiltered={setFiltered} />
          </Box>
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
