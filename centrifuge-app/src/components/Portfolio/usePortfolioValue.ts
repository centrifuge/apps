import { useAddress, useBalances } from '@centrifuge/centrifuge-react'
import { useMemo } from 'react'
import { Dec } from '../../utils/Decimal'
import { useTinlakeBalances } from '../../utils/tinlake/useTinlakeBalances'
import { usePools } from '../../utils/usePools'

export const usePortfolioValue = () => {
  const address = useAddress()
  const centBalances = useBalances(address)
  const { data: tinlakeBalances } = useTinlakeBalances()

  const balances = useMemo(() => {
    return [
      ...(centBalances?.tranches || []),
      ...(tinlakeBalances?.tranches.filter((tranche) => !tranche.balance.isZero) || []),
    ]
  }, [centBalances, tinlakeBalances])
  const pools = usePools()

  const portfolioValue = balances.reduce((sum, balance) => {
    const pool = pools?.find((pool) => pool.id === balance.poolId)
    const tranche = pool?.tranches.find((tranche) => tranche.id === balance.trancheId)

    return sum.add(tranche?.tokenPrice ? balance.balance.toDecimal().mul(tranche?.tokenPrice.toDecimal()) : Dec(0))
  }, Dec(0))

  return portfolioValue
}
