import { CurrencyBalance } from '@centrifuge/centrifuge-js'
import { BigNumber } from '@ethersproject/bignumber'
import Decimal from 'decimal.js-light'
import { useQuery } from 'react-query'
import { usePool } from '../usePools'
import { Call, multicall } from './multicall'
import { TinlakePool } from './useTinlakePools'

export function useTinlakeInvestments(poolId: string, address?: string) {
  const pool = usePool(poolId) as TinlakePool
  return useQuery(['tinlakeInvestment', poolId, address], () => getInvestment(pool, address!), {
    enabled: !!address,
    suspense: true,
  })
}

async function getInvestment(pool: TinlakePool, address: string) {
  const toNumber = (val: BigNumber) => val.toNumber()
  const toDec18 = (val: BigNumber) => new CurrencyBalance(val.toString(), 18).toDecimal()
  const calls: Call[] = [
    {
      target: pool.addresses.JUNIOR_TRANCHE,
      call: ['users(address)(uint256,uint256,uint256)', address],
      returns: [
        ['junior.order.orderedInEpoch', toNumber],
        ['junior.order.investCurrency', toDec18],
        ['junior.order.redeemToken', toDec18],
      ],
    },
    {
      target: pool.addresses.SENIOR_TRANCHE,
      call: ['users(address)(uint256,uint256,uint256)', address],
      returns: [
        ['senior.order.orderedInEpoch', toNumber],
        ['senior.order.investCurrency', toDec18],
        ['senior.order.redeemToken', toDec18],
      ],
    },
    {
      target: pool.addresses.JUNIOR_TRANCHE,
      call: ['calcDisburse(address)(uint256,uint256,uint256,uint256)', address],
      returns: [
        ['junior.disburse.payoutCurrencyAmount', toDec18],
        ['junior.disburse.payoutTokenAmount', toDec18],
        ['junior.disburse.remainingInvestCurrency', toDec18],
        ['junior.disburse.remainingRedeemToken', toDec18],
      ],
    },
    {
      target: pool.addresses.SENIOR_TRANCHE,
      call: ['calcDisburse(address)(uint256,uint256,uint256,uint256)', address],
      returns: [
        ['senior.disburse.payoutCurrencyAmount', toDec18],
        ['senior.disburse.payoutTokenAmount', toDec18],
        ['senior.disburse.remainingInvestCurrency', toDec18],
        ['senior.disburse.remainingRedeemToken', toDec18],
      ],
    },
    {
      target: pool.addresses.JUNIOR_TOKEN,
      call: ['allowance(address,address)(uint256)', address, pool.addresses.JUNIOR_TRANCHE],
      returns: [['junior.tokenAllowance', toDec18]],
    },
    {
      target: pool.addresses.SENIOR_TOKEN,
      call: ['allowance(address,address)(uint256)', address, pool.addresses.SENIOR_TRANCHE],
      returns: [['senior.tokenAllowance', toDec18]],
    },
    {
      target: pool.addresses.TINLAKE_CURRENCY,
      call: ['allowance(address,address)(uint256)', address, pool.addresses.JUNIOR_TRANCHE],
      returns: [['junior.poolCurrencyAllowance', toDec18]],
    },
    {
      target: pool.addresses.TINLAKE_CURRENCY,
      call: ['allowance(address,address)(uint256)', address, pool.addresses.SENIOR_TRANCHE],
      returns: [['senior.poolCurrencyAllowance', toDec18]],
    },
  ]

  const multicallData = await multicall<State>(calls)

  return multicallData
}

type TrancheState = {
  tokenAllowance: Decimal
  poolCurrencyAllowance: Decimal
  order: {
    orderedInEpoch: number
    investCurrency: Decimal
    redeemToken: Decimal
  }
  disburse: {
    payoutCurrencyAmount: Decimal
    payoutTokenAmount: Decimal
    remainingInvestCurrency: Decimal
    remainingRedeemToken: Decimal
  }
}

type State = {
  junior: TrancheState
  senior: TrancheState
}
