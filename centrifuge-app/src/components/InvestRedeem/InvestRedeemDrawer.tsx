import { DailyPoolState, Perquintill } from '@centrifuge/centrifuge-js'
import { Box, Drawer, Stack, Tabs, TabsItem, Text } from '@centrifuge/fabric'
import * as React from 'react'
import { useDailyPoolStates, usePool } from '../../utils/usePools'
import { FilterOptions, PriceChart } from '../Charts/PriceChart'
import { LoadBoundary } from '../LoadBoundary'
import { InvestRedeem } from './InvestRedeem'

type DailyPoolStateProps = Pick<DailyPoolState, 'timestamp' | 'tranches'> & {
  apy?: Perquintill | undefined
}

export function InvestRedeemDrawer({
  poolId,
  trancheId,
  defaultView,
  open,
  onClose,
}: {
  open: boolean
  onClose: () => void
  poolId: string
  trancheId: string
  defaultView?: 'invest' | 'redeem'
}) {
  const [filter, setFilter] = React.useState<FilterOptions>('30days')
  const [index, setIndex] = React.useState(0)

  const dateFrom = React.useMemo(() => {
    if (filter === 'YTD') {
      const currentYear = new Date().getFullYear()
      const januaryFirst = new Date(currentYear, 0, 1)
      return januaryFirst
    }
    if (filter === '30days') {
      const thirtyDaysAgo = new Date()
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
      thirtyDaysAgo.setHours(0, 0, 0, 0) // set to midnight
      return thirtyDaysAgo
    }
    if (filter === '90days') {
      const ninetyDaysAgo = new Date()
      ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90)
      ninetyDaysAgo.setHours(0, 0, 0, 0)
      return ninetyDaysAgo
    }
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    return today
  }, [filter])

  const { poolStates: dailyPoolStates } = useDailyPoolStates(poolId, new Date(dateFrom)) || {}

  return (
    <Drawer isOpen={open} onClose={onClose}>
      <LoadBoundary>
        <InvestRedeem poolId={poolId} trancheId={trancheId} defaultView={defaultView} />
      </LoadBoundary>
      <LoadBoundary>
        {dailyPoolStates?.length ? (
          <Stack gap={12} borderColor="rgba(0,0,0,0.08)" borderWidth="1px" borderStyle="solid" borderRadius="8px" p={2}>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
              <Text variant="heading6" color="textPrimary" fontWeight={600}>
                Performance
              </Text>
              <Tabs selectedIndex={index} onChange={(index) => setIndex(index)}>
                <TabsItem styleOverrides={{ padding: '4px' }} showBorder>
                  Price
                </TabsItem>
                <TabsItem styleOverrides={{ padding: '4px' }} showBorder>
                  APY
                </TabsItem>
              </Tabs>
            </Box>

            <TokenPriceChart
              poolId={poolId}
              trancheId={trancheId}
              dailyPoolStates={dailyPoolStates}
              filter={filter}
              setFilter={setFilter}
              index={index}
            />
          </Stack>
        ) : null}
      </LoadBoundary>
    </Drawer>
  )
}

const TokenPriceChart = React.memo(function TokenPriceChart({
  poolId,
  trancheId,
  dailyPoolStates,
  filter,
  setFilter,
  index,
}: {
  poolId: string
  trancheId: string
  dailyPoolStates: DailyPoolStateProps[]
  filter: FilterOptions
  setFilter: any
  index: number
}) {
  const pool = usePool(poolId)

  const apy = {
    '30days': 'yield30DaysAnnualized',
    '90days': 'yield90DaysAnnualized',
    YTD: 'yieldYTD',
  }

  const data = React.useMemo(() => {
    const tokenData =
      dailyPoolStates?.map((state: DailyPoolStateProps) => {
        return {
          price: state.tranches[trancheId].price?.toFloat() || 0,
          day: new Date(state.timestamp),
          apy: (state.tranches[trancheId] as any)[apy[filter]]?.toPercent().toNumber(),
        }
      }) || []
    if (tokenData.length > 0) {
      tokenData.push({
        day: new Date(),
        apy: null,
        price:
          pool?.tranches
            .find((tranche) => tranche.id === trancheId)
            ?.tokenPrice?.toDecimal()
            .toNumber() || 1,
      })
    }
    return tokenData
  }, [dailyPoolStates, pool?.tranches, trancheId, filter])

  if (!data.length) return

  return (
    <PriceChart
      data={data}
      currency={pool.tranches.find((tranche) => tranche.id === trancheId)?.currency.displayName || ''}
      filter={filter}
      setFilter={setFilter}
      isPrice={index === 0}
    />
  )
})
