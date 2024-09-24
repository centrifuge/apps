import { Drawer, Stack, Text } from '@centrifuge/fabric'
import Decimal from 'decimal.js-light'
import * as React from 'react'
import { useDailyPoolStates, usePool } from '../../utils/usePools'
import { FilterOptions, PriceChart } from '../Charts/PriceChart'
import { LoadBoundary } from '../LoadBoundary'
import { InvestRedeem } from './InvestRedeem'

type TrancheState = {
  price: Decimal | any
}

type DailyPoolStateProps = {
  timestamp: string
  tranches: { [trancheId: string]: TrancheState }
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

  if (!dailyPoolStates?.length) return

  return (
    <Drawer isOpen={open} onClose={onClose}>
      <LoadBoundary>
        <InvestRedeem poolId={poolId} trancheId={trancheId} defaultView={defaultView} />
      </LoadBoundary>
      <LoadBoundary>
        <Stack gap={12} borderColor="rgba(0,0,0,0.08)" borderWidth="1px" borderStyle="solid" borderRadius="8px" p={2}>
          <Text variant="heading6" color="textPrimary" fontWeight={600}>
            Performance
          </Text>
          <TokenPriceChart
            poolId={poolId}
            trancheId={trancheId}
            dailyPoolStates={dailyPoolStates}
            filter={filter}
            setFilter={setFilter}
          />
        </Stack>
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
}: {
  poolId: string
  trancheId: string
  dailyPoolStates: DailyPoolStateProps[]
  filter: FilterOptions | undefined
  setFilter: any
}) {
  const pool = usePool(poolId)

  const data = React.useMemo(() => {
    const tokenData =
      dailyPoolStates?.map((state: DailyPoolStateProps) => {
        return { price: state.tranches[trancheId].price?.toFloat() || 0, day: new Date(state.timestamp) }
      }) || []
    if (tokenData.length > 0) {
      tokenData.push({
        day: new Date(),
        price:
          pool?.tranches
            .find((tranche) => tranche.id === trancheId)
            ?.tokenPrice?.toDecimal()
            .toNumber() || 1,
      })
    }
    return tokenData
  }, [dailyPoolStates, pool?.tranches, trancheId])

  if (!data.length) return

  return (
    <PriceChart
      data={data}
      currency={pool.tranches.find((tranche) => tranche.id === trancheId)?.currency.displayName || ''}
      filter={filter}
      setFilter={setFilter}
    />
  )
})
