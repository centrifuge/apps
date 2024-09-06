import { useParams } from 'react-router'
import { LayoutBase } from '../../components/LayoutBase'
import { PageSummary } from '../../components/PageSummary'
import { Tooltips } from '../../components/Tooltips'
import { formatBalance } from '../../utils/formatting'
import { useDailyPoolStates, usePool, usePoolFees } from '../../utils/usePools'

import { CurrencyBalance, CurrencyMetadata } from '@centrifuge/centrifuge-js'
import { Divider, IconClockForward, Shelf, Stack, Text } from '@centrifuge/fabric'
import { BN } from 'bn.js'
import React from 'react'
import { LayoutSection } from '../../components/LayoutBase/LayoutSection'
import { NavManagementAssetTable } from './NavManagementAssetTable'

export default function NavManagementOverviewPage() {
  const { pid } = useParams<{ pid: string }>()
  if (!pid) throw new Error('Pool not found')
  return (
    <LayoutBase>
      <LayoutSection backgroundColor="backgroundSecondary" pt={5} pb={3}>
        <Stack as="header" gap={1} ml={1}>
          <Text as="h1" variant="heading1">
            NAV Management
          </Text>
        </Stack>
      </LayoutSection>
      <NavManagementPageSummary poolId={pid} />
      <LayoutSection pt={3}>
        <NavOverviewCard poolId={pid} />
      </LayoutSection>
      <NavManagementAssetTable key={pid} poolId={pid} />
    </LayoutBase>
  )
}

export function NavManagementPageSummary({ poolId }: { poolId: string }) {
  const pool = usePool(poolId)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const dailyPoolStates = useDailyPoolStates(poolId, new Date(pool.createdAt || today), today)
  const investments =
    pool &&
    dailyPoolStates?.poolStates?.reduce(
      (acc, state) =>
        state && state?.sumInvestedAmountByPeriod ? acc.add(new BN(state.sumInvestedAmountByPeriod)) : new BN(0),
      new BN(0)
    )

  const redemptions =
    pool &&
    dailyPoolStates?.poolStates?.reduce(
      (acc, state) =>
        state && state?.sumRedeemedAmountByPeriod ? acc.add(new BN(state.sumRedeemedAmountByPeriod)) : new BN(0),
      new BN(0)
    )

  return (
    <PageSummary
      data={[
        {
          label: <Tooltips type="totalNav" />,
          value: formatBalance(pool?.nav.total ?? 0, pool?.currency.symbol, 2),
        },
        {
          label: 'Investments',
          value: formatBalance(
            new CurrencyBalance(investments ?? 0, pool?.currency.decimals || 18),
            pool?.currency.symbol,
            2
          ),
        },
        {
          label: 'Redemptions',
          value: formatBalance(new CurrencyBalance(redemptions ?? 0, pool.currency.decimals), pool?.currency.symbol, 2),
        },
      ]}
    />
  )
}

export function NavOverviewCard({ poolId }: { poolId: string }) {
  const pool = usePool(poolId)
  const poolFees = usePoolFees(poolId)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const { poolStates: dailyPoolStates } =
    useDailyPoolStates(poolId, new Date(new Date(pool.createdAt || today)), today) || {}

  const pendingFees = React.useMemo(() => {
    return new CurrencyBalance(
      poolFees?.map((f) => f.amounts.pending).reduce((acc, f) => acc.add(f), new BN(0)) ?? new BN(0),
      pool.currency.decimals
    )
  }, [poolFees, pool.currency.decimals])

  const changeInValuation = React.useMemo(() => {
    const lastUpdated = pool?.nav.lastUpdated || new Date()
    const lastUpdatedSumBorrowedAmountByPeriod = dailyPoolStates?.find(
      (state) => state.timestamp >= lastUpdated
    )?.sumBorrowedAmountByPeriod
    const todaySumBorrowedAmountByPeriod = dailyPoolStates?.[0]?.sumBorrowedAmountByPeriod
    return lastUpdatedSumBorrowedAmountByPeriod && todaySumBorrowedAmountByPeriod
      ? new BN(todaySumBorrowedAmountByPeriod).sub(new BN(lastUpdatedSumBorrowedAmountByPeriod))
      : new BN(0)
  }, [dailyPoolStates, pool?.nav.lastUpdated])

  return (
    <VisualNavCard
      currency={pool.currency}
      current={pool.nav.total.toFloat()}
      change={changeInValuation ? new CurrencyBalance(changeInValuation, pool.currency.decimals).toFloat() : 0}
      pendingFees={pendingFees.toFloat()}
      pendingNav={new CurrencyBalance(changeInValuation, pool.currency.decimals)
        .toDecimal()
        .add(pool.nav.total.toDecimal())
        .sub(pendingFees.toDecimal())
        .toNumber()}
    />
  )
}

export function VisualNavCard({
  currency,
  current,
  change,
  pendingFees,
  pendingNav,
}: {
  currency: Pick<CurrencyMetadata, 'displayName' | 'decimals'>
  current: number
  change: number
  pendingFees: number
  pendingNav: number
}) {
  return (
    <Stack p={2} maxWidth="444px" bg="backgroundTertiary" gap={2}>
      <Shelf justifyContent="space-between">
        <Text variant="body2" color="textPrimary">
          Current NAV
        </Text>
        <Text variant="body2">{formatBalance(current, currency.displayName, 2)}</Text>
      </Shelf>
      <Divider borderColor="statusInfoBg" />
      <Stack gap={1}>
        <Shelf justifyContent="space-between">
          <Text variant="body2" color="textPrimary">
            Change in asset valuation
          </Text>
          <Text variant="body2" color={change >= 0 ? 'statusOk' : 'statusCritical'}>
            {formatBalance(change, currency.displayName, 2)}
          </Text>
        </Shelf>
        <Shelf justifyContent="space-between">
          <Text variant="body2" color="textPrimary">
            Pending fees
          </Text>
          <Text variant="body2" color="statusCritical">
            -{formatBalance(pendingFees, currency.displayName, 2)}
          </Text>
        </Shelf>
      </Stack>
      <Divider borderColor="statusInfoBg" />
      <Shelf justifyContent="space-between">
        <Shelf gap={1}>
          <IconClockForward color="textSelected" size="iconSmall" />
          <Text variant="body2" color="textSelected">
            Pending NAV
          </Text>
        </Shelf>
        <Text variant="body2" color="textSelected">
          {formatBalance(pendingNav, currency.displayName, 2)}
        </Text>
      </Shelf>
    </Stack>
  )
}
