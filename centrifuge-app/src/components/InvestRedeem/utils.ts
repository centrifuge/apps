import { useWallet } from '@centrifuge/centrifuge-react'
import Decimal from 'decimal.js-light'
import { Dec } from '../../utils/Decimal'
import { useTinlakePermissions } from '../../utils/tinlake/useTinlakePermissions'
import { useAddress } from '../../utils/useAddress'
import { usePermissions } from '../../utils/usePermissions'
import { usePool, usePoolMetadata } from '../../utils/usePools'

export function inputToNumber(num: number | Decimal | '') {
  return num instanceof Decimal ? num.toNumber() : num || 0
}

export function inputToDecimal(num: number | Decimal | string) {
  return Dec(num || 0)
}

export function validateNumberInput(value: number | string | Decimal, min: number | Decimal, max?: number | Decimal) {
  if (value === '' || value == null) {
    return 'Not a valid number'
  }
  if (max && Dec(value).greaterThan(Dec(max))) {
    return 'Value too large'
  }
  if (Dec(value).lessThan(Dec(min))) {
    return 'Value too small'
  }
}

export function useAllowedTranches(poolId: string) {
  const address = useAddress()
  const { connectedType } = useWallet()
  const isTinlakePool = poolId.startsWith('0x')
  const permissions = usePermissions(connectedType === 'substrate' ? address : undefined)
  const { data: tinlakePermissions } = useTinlakePermissions(poolId, address)
  const pool = usePool(poolId)
  const { data: metadata } = usePoolMetadata(pool)

  const allowedTrancheIds = isTinlakePool
    ? [tinlakePermissions?.junior && pool.tranches[0].id, tinlakePermissions?.senior && pool.tranches[1].id].filter(
        (tranche) => {
          if (tranche && metadata?.pool?.newInvestmentsStatus) {
            const trancheName = tranche.split('-')[1] === '0' ? 'junior' : 'senior'

            const isMember = tinlakePermissions?.[trancheName].inMemberlist

            return isMember || metadata.pool.newInvestmentsStatus[trancheName] !== 'closed'
          }

          return false
        }
      )
    : Object.keys(permissions?.pools[poolId]?.tranches ?? {})

  return allowedTrancheIds.map((id) => [...pool.tranches].find((tranche) => tranche.id === id)!)
}
