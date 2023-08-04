import { CurrencyBalance } from '@centrifuge/centrifuge-js'
import { BigNumber } from '@ethersproject/bignumber'
import BN from 'bn.js'
import { useQuery } from 'react-query'
import { useAddress } from '../useAddress'
import { Call, multicall } from './multicall'
import { IpfsPools, TokenResult } from './types'
import { useIpfsPools } from './useTinlakePools'

export function useTinlakePortfolio() {
  const ipfsPools = useIpfsPools(false)
  const address = useAddress('evm')

  const query = useQuery(['portfolio', address], () => getTinlakePortfolio(ipfsPools!, address!), {
    enabled: !!address && !!ipfsPools,
  })

  return query
}

export enum TinlakeTranche {
  senior = 'SENIOR',
  junior = 'JUNIOR',
}

async function getTinlakePortfolio(ipfsPools: IpfsPools, address: string) {
  const toBN = (val: BigNumber) => new CurrencyBalance(val.toString(), 18)

  const calls: Call[] = ipfsPools.active.flatMap((pool) => [
    {
      target: pool.addresses.ASSESSOR,
      call: ['calcJuniorTokenPrice()(uint256)'],
      returns: [[`${pool.addresses.JUNIOR_TOKEN}.price`, toBN]],
    },
    {
      target: pool.addresses.ASSESSOR,
      call: ['calcSeniorTokenPrice()(uint256)'],
      returns: [[`${pool.addresses.SENIOR_TOKEN}.price`, toBN]],
    },
    {
      target: pool.addresses.JUNIOR_TOKEN,
      call: ['balanceOf(address)(uint256)', address],
      returns: [[`${pool.addresses.JUNIOR_TOKEN}.balance`, toBN]],
    },
    {
      target: pool.addresses.SENIOR_TOKEN,
      call: ['balanceOf(address)(uint256)', address],
      returns: [[`${pool.addresses.SENIOR_TOKEN}.balance`, toBN]],
    },
    {
      target: pool.addresses.JUNIOR_TOKEN,
      call: ['symbol()(string)'],
      returns: [[`${pool.addresses.JUNIOR_TOKEN}.symbol`]],
    },
    {
      target: pool.addresses.SENIOR_TOKEN,
      call: ['symbol()(string)'],
      returns: [[`${pool.addresses.SENIOR_TOKEN}.symbol`]],
    },
    {
      target: pool.addresses.JUNIOR_TRANCHE,
      call: ['calcDisburse(address))(uint256,uint256,uint256,uint256)', address],
      returns: [
        [`${pool.addresses.JUNIOR_TOKEN}.payoutCurrencyAmount`, toBN],
        [`${pool.addresses.JUNIOR_TOKEN}.payoutTokenAmount`, toBN],
        [`${pool.addresses.JUNIOR_TOKEN}.remainingSupplyCurrency`, toBN],
        [`${pool.addresses.JUNIOR_TOKEN}.remainingRedeemToken`, toBN],
      ],
    },
    {
      target: pool.addresses.SENIOR_TRANCHE,
      call: ['calcDisburse(address))(uint256,uint256,uint256,uint256)', address],
      returns: [
        [`${pool.addresses.SENIOR_TOKEN}.payoutCurrencyAmount`, toBN],
        [`${pool.addresses.SENIOR_TOKEN}.payoutTokenAmount`, toBN],
        [`${pool.addresses.SENIOR_TOKEN}.remainingSupplyCurrency`, toBN],
        [`${pool.addresses.SENIOR_TOKEN}.remainingRedeemToken`, toBN],
      ],
    },
  ])

  const updatesPerToken = await multicall<{ [key: string]: TokenResult }>(calls)

  const tokenBalances = Object.entries(updatesPerToken).map(([tokenId, tokenResult]) => {
    let tranche = TinlakeTranche.senior
    ipfsPools.active.flatMap((pool) => {
      if (tokenId === pool.addresses.JUNIOR_TOKEN) {
        tranche = TinlakeTranche.junior
      }
    })
    const newBalance = new BN(tokenResult.balance).add(new BN(tokenResult.payoutTokenAmount))
    const newPrice = new BN(tokenResult.price)
    const newValue = newBalance.mul(newPrice).div(new BN(10).pow(new BN(27)))

    return {
      id: tokenId,
      symbol: tokenResult.symbol,
      tranche: tranche as TinlakeTranche,
      price: newPrice,
      value: newValue,
      balance: newBalance,
      remainingSupplyCurrency: tokenResult.remainingSupplyCurrency,
    }
  })

  const totalValue = new BN(0)
  const totalSupplyRemaining = new BN(0)
  tokenBalances.forEach((tokenBalance) => {
    totalValue.iadd(tokenBalance.value)
    totalSupplyRemaining.iadd(tokenBalance.remainingSupplyCurrency)
  })

  return {
    tokenBalances,
    totalValue,
    totalSupplyRemaining,
  }
}
