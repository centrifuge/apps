import { CurrencyBalance, Loan, Pool } from '@centrifuge/centrifuge-js'
import { useMemo } from 'react'
import { LoanTemplate } from '../../types'
import { Dec } from '../../utils/Decimal'
import { usePoolMetadataMulti } from '../../utils/usePools'
import { getAmount } from '../LoanList'
import { CreateAssetFormValues } from './Assets/CreateAssetsDrawer'

export type TransformedLoan = Loan & {
  pool: Pool
  outstandingQuantity: CurrencyBalance
  presentValue: CurrencyBalance
}

const hasValuationMethod = (pricing: any): pricing is { valuationMethod: string; presentValue: CurrencyBalance } => {
  return pricing && typeof pricing.valuationMethod === 'string'
}

export const useLoanCalculations = (transformedLoans: TransformedLoan[]) => {
  const totalLoans = useMemo(() => transformedLoans.length, [transformedLoans])

  const totalAssets = useMemo(() => {
    return transformedLoans.reduce((sum, loan) => {
      if (hasValuationMethod(loan.pricing) && loan.pricing.valuationMethod !== 'cash') {
        const amount = new CurrencyBalance(
          getAmount(loan, loan.pool, false, true),
          loan.pool.currency.decimals
        ).toDecimal()
        return sum.add(amount)
      }
      return sum
    }, Dec(0))
  }, [transformedLoans])

  const offchainAssets = useMemo(() => {
    return transformedLoans.filter(
      (loan) => hasValuationMethod(loan.pricing) && loan.pricing.valuationMethod === 'cash'
    )
  }, [transformedLoans])

  const offchainReserve = useMemo(() => {
    return transformedLoans.reduce((sum, loan) => {
      if (hasValuationMethod(loan.pricing) && loan.pricing.valuationMethod === 'cash' && loan.status === 'Active') {
        const amount = new CurrencyBalance(
          getAmount(loan, loan.pool, false, true),
          loan.pool.currency.decimals
        ).toDecimal()
        return sum.add(amount)
      }
      return sum
    }, Dec(0))
  }, [transformedLoans])

  const uniquePools = useMemo(() => {
    const poolMap = new Map<string, TransformedLoan>()
    transformedLoans.forEach((loan) => {
      if (!poolMap.has(loan.pool.id)) {
        poolMap.set(loan.pool.id, loan)
      }
    })
    return Array.from(poolMap.values())
  }, [transformedLoans])

  const onchainReserve = useMemo(() => {
    return uniquePools.reduce((sum, loan) => {
      const navTotal = loan.pool.reserve?.total || '0'
      const navAmount = new CurrencyBalance(navTotal, loan.pool.currency.decimals).toDecimal()
      return sum.add(navAmount)
    }, Dec(0))
  }, [uniquePools])

  const pendingFees = useMemo(() => {
    return uniquePools.reduce((sum, loan) => {
      const feeTotalPaid = loan.pool.fees?.totalPaid ? loan.pool.fees.totalPaid.toDecimal() : 0
      return sum.add(Dec(feeTotalPaid))
    }, Dec(0))
  }, [uniquePools])

  const totalNAV = useMemo(() => {
    return uniquePools.reduce((sum, loan) => {
      const navTotal = loan.pool.nav?.total || '0'
      const navAmount = new CurrencyBalance(navTotal, loan.pool.currency.decimals).toDecimal()
      return sum.add(navAmount)
    }, Dec(0))
  }, [uniquePools])

  return {
    totalLoans,
    totalAssets,
    offchainAssets,
    offchainReserve,
    onchainReserve,
    pendingFees,
    totalNAV,
  }
}

export function usePoolMetadataMap(pools: Pool[]) {
  const metas = usePoolMetadataMulti(pools)
  const poolMetadataMap = useMemo(() => {
    const map = new Map<string, any>()
    pools.forEach((pool, index) => {
      map.set(pool.id, metas[index]?.data)
    })
    return map
  }, [pools, metas])
  return poolMetadataMap
}

export function valuesToNftProperties(values: CreateAssetFormValues['attributes'], template: LoanTemplate) {
  return Object.fromEntries(
    template.sections.flatMap((section) =>
      section.attributes
        .map((key) => {
          const attr = template.attributes[key]
          if (!attr.public) return undefined as never
          const value = values[key]
          switch (attr.input.type) {
            case 'date':
              return [key, new Date(value).toISOString()]
            case 'currency': {
              return [
                key,
                attr.input.decimals ? CurrencyBalance.fromFloat(value, attr.input.decimals).toString() : String(value),
              ]
            }
            case 'number':
              return [
                key,
                attr.input.decimals ? CurrencyBalance.fromFloat(value, attr.input.decimals).toString() : String(value),
              ]
            default:
              return [key, String(value)]
          }
        })
        .filter(Boolean)
    )
  )
}
