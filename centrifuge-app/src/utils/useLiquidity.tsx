import { Perquintill } from '@centrifuge/centrifuge-js'
import { useCentrifugeQuery } from '@centrifuge/centrifuge-react'
import Decimal from 'decimal.js-light'
import * as React from 'react'
import { combineLatest, map } from 'rxjs'
import { LiquidityTableRow } from '../components/EpochList'
import { usePool, usePoolOrders, usePoolOrdersMulti, usePools } from './usePools'

type Liquidity = {
  investments: LiquidityTableRow[]
  redemptions: LiquidityTableRow[]
  sumOfExecutableInvestments: Decimal
  sumOfLockedInvestments: Decimal
  sumOfExecutableRedemptions: Decimal
  sumOfLockedRedemptions: Decimal
  ordersFullyExecutable: boolean
  ordersPartiallyExecutable: boolean
  noOrdersExecutable: boolean
}

export function useLiquidity(poolId: string) {
  const pool = usePool(poolId)
  const poolOrders = usePoolOrders(poolId)

  const [solution] = useCentrifugeQuery(
    ['solution', poolId],
    (cent) => cent.pools.submitSolution([poolId], { dryRun: true }),
    {
      enabled: !!poolId,
    }
  )

  const { investments, sumOfExecutableInvestments, sumOfLockedInvestments } = React.useMemo(() => {
    const investments =
      (pool?.tranches.map((tranche, index) => {
        const orders = poolOrders?.[index]
        return {
          order: `${tranche.currency.symbol} investments`,
          locked: orders ? orders.outstandingInvest.toDecimal() : new Decimal(0),
          executing:
            solution && 'tranches' in solution
              ? solution?.tranches?.[index]?.invest.amount.toDecimal()
              : new Decimal(0),
          executingPercentage:
            solution && 'tranches' in solution
              ? solution?.tranches?.[index]?.invest.perquintill
              : Perquintill.fromPercent(0),
        }
      }) as LiquidityTableRow[]) || []
    const sumOfLockedInvestments = investments?.reduce(
      (prev, { locked }) => prev.add(locked as Decimal),
      new Decimal(0)
    )

    const sumOfExecutableInvestments = investments?.reduce(
      (prev, { executing }) => prev.add(executing as Decimal),
      new Decimal(0)
    )
    return {
      investments,
      sumOfLockedInvestments,
      sumOfExecutableInvestments,
    }
  }, [pool, solution, poolOrders])

  const { redemptions, sumOfExecutableRedemptions, sumOfLockedRedemptions } = React.useMemo(() => {
    const redemptions =
      (pool?.tranches.map((tranche, index) => {
        const price = pool.tranches[index].tokenPrice?.toDecimal()
        const orders = poolOrders?.[index]
        return {
          order: `${tranche.currency.symbol} redemptions`,
          locked: orders ? orders.outstandingRedeem.toDecimal().mul(price || 1) : new Decimal(0),
          executing:
            solution && 'tranches' in solution
              ? solution?.tranches?.[index]?.redeem.amount.toDecimal().mul(price || 1)
              : new Decimal(0),
          executingPercentage:
            solution && 'tranches' in solution
              ? solution?.tranches?.[index]?.redeem.perquintill
              : Perquintill.fromPercent(0),
        }
      }) as LiquidityTableRow[]) || []

    const sumOfLockedRedemptions = redemptions?.reduce(
      (prev, { locked }) => prev.add(locked as Decimal),
      new Decimal(0)
    )
    const sumOfExecutableRedemptions = redemptions?.reduce(
      (prev, { executing }) => prev.add(executing as Decimal),
      new Decimal(0)
    )

    return {
      redemptions,
      sumOfExecutableRedemptions,
      sumOfLockedRedemptions,
    }
  }, [pool, solution, poolOrders])

  const ordersFullyExecutable =
    sumOfLockedInvestments.equals(sumOfExecutableInvestments) &&
    sumOfLockedRedemptions.equals(sumOfExecutableRedemptions)
  const ordersPartiallyExecutable =
    (sumOfExecutableInvestments.gt(0) && sumOfExecutableInvestments.lt(sumOfLockedInvestments)) ||
    (sumOfExecutableRedemptions.gt(0) && sumOfExecutableRedemptions.lt(sumOfLockedRedemptions))
  const noOrdersExecutable =
    !ordersFullyExecutable && sumOfExecutableInvestments.eq(0) && sumOfExecutableRedemptions.eq(0)

  return {
    investments,
    redemptions,
    sumOfLockedInvestments,
    sumOfExecutableInvestments,
    sumOfLockedRedemptions,
    sumOfExecutableRedemptions,
    ordersFullyExecutable,
    ordersPartiallyExecutable,
    noOrdersExecutable,
  } satisfies Liquidity
}

function useSolutionsMulti(poolIds: string[]) {
  return useCentrifugeQuery(
    ['solutionsMulti', poolIds],
    (cent) =>
      combineLatest(poolIds.map((poolId) => cent.pools.submitSolution([poolId], { dryRun: true }))).pipe(
        map((solutionsArray) => {
          const result: Record<string, any> = {}
          poolIds.forEach((poolId, index) => {
            result[poolId] = solutionsArray[index]
          })
          return result
        })
      ),
    {
      enabled: poolIds.length > 0,
    }
  )
}

export function useLiquidityMulti(poolIds: string[]) {
  const pools = usePools()
  const [solutions, solutionsLoading] = useSolutionsMulti(poolIds)
  const [poolOrders, poolOrdersLoading] = usePoolOrdersMulti(poolIds)

  const liquidityData = React.useMemo(() => {
    if (!pools || pools.length === 0) return {}

    return poolIds.reduce((acc, poolId, i) => {
      const pool = pools[i]
      const ordersForPool = poolOrders ? poolOrders[i] : undefined
      const sol = Array.isArray(solutions) ? solutions[i] : solutions

      const investments =
        pool?.tranches.map((tranche, index) => {
          const orders = ordersForPool ? ordersForPool[index] : undefined
          return {
            order: `${tranche.currency.symbol} investments`,
            locked: orders ? orders.outstandingInvest.toDecimal() : new Decimal(0),
            executing: sol && 'tranches' in sol ? sol.tranches[index]?.invest.amount.toDecimal() : new Decimal(0),
            executingPercentage:
              sol && 'tranches' in sol ? sol.tranches[index]?.invest.perquintill : Perquintill.fromPercent(0),
          }
        }) || []

      const sumOfLockedInvestments = investments.reduce(
        (prev, { locked }) => prev.add(locked as Decimal),
        new Decimal(0)
      )

      const sumOfExecutableInvestments = investments.reduce(
        (prev, { executing }) => prev.add(executing as Decimal),
        new Decimal(0)
      )

      const redemptions =
        pool?.tranches.map((tranche, index) => {
          const price = pool.tranches[index].tokenPrice?.toDecimal()
          const orders = ordersForPool ? ordersForPool[index] : undefined
          return {
            order: `${tranche.currency.symbol} redemptions`,
            locked: orders ? orders.outstandingRedeem.toDecimal().mul(price || 1) : new Decimal(0),
            executing:
              sol && 'tranches' in sol
                ? sol.tranches[index]?.redeem.amount.toDecimal().mul(price || 1)
                : new Decimal(0),
            executingPercentage:
              sol && 'tranches' in sol ? sol.tranches[index]?.redeem.perquintill : Perquintill.fromPercent(0),
          }
        }) || []

      const sumOfLockedRedemptions = redemptions.reduce(
        (prev, { locked }) => prev.add(locked as Decimal),
        new Decimal(0)
      )
      const sumOfExecutableRedemptions = redemptions.reduce(
        (prev, { executing }) => prev.add(executing as Decimal),
        new Decimal(0)
      )

      const ordersFullyExecutable =
        sumOfLockedInvestments.equals(sumOfExecutableInvestments) &&
        sumOfLockedRedemptions.equals(sumOfExecutableRedemptions)
      const ordersPartiallyExecutable =
        (sumOfExecutableInvestments.gt(0) && sumOfExecutableInvestments.lt(sumOfLockedInvestments)) ||
        (sumOfExecutableRedemptions.gt(0) && sumOfExecutableRedemptions.lt(sumOfLockedRedemptions))
      const noOrdersExecutable =
        !ordersFullyExecutable && sumOfExecutableInvestments.eq(0) && sumOfExecutableRedemptions.eq(0)

      acc[poolId] = {
        investments,
        redemptions,
        sumOfLockedInvestments,
        sumOfExecutableInvestments,
        sumOfLockedRedemptions,
        sumOfExecutableRedemptions,
        ordersFullyExecutable,
        ordersPartiallyExecutable,
        noOrdersExecutable,
      }
      return acc
    }, {} as Record<string, Liquidity>)
  }, [pools, solutions, poolOrders, poolIds])

  return { liquidityData, isLoading: solutionsLoading || poolOrdersLoading }
}
