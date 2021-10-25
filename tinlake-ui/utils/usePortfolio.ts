import BN from 'bn.js'
import { BigNumber } from 'ethers'
import { useQuery } from 'react-query'
import { useIpfsPools } from '../components/IpfsPoolsProvider'
import { IpfsPools } from '../config'
import { Call, multicall } from './multicall'
import { useAddress } from './useAddress'

interface TokenResult {
  symbol: string
  price: BN
  balance: BN
  payoutCurrencyAmount: BN
  payoutTokenAmount: BN
  remainingSupplyCurrency: BN
  remainingRedeemToken: BN
}

export interface TokenBalance {
  id: string
  symbol: string
  price: BN
  value: BN
  balance: BN
}

export interface PortfolioData {
  tokenBalances: TokenBalance[]
  totalValue: BN
}

export function usePortfolio() {
  const ipfsPools = useIpfsPools()
  const address = useAddress()
  const query = useQuery(['portfolio', address], () => getPortfolio(ipfsPools, address!), {
    enabled: !!address,
  })

  return query
}

async function getPortfolio(ipfsPools: IpfsPools, address: string) {
  const toBN = (val: BigNumber) => new BN(val.toString())

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
    const newBalance = new BN(tokenResult.balance).add(new BN(tokenResult.payoutTokenAmount))
    const newPrice = new BN(tokenResult.price)
    const newValue = newBalance.mul(newPrice).div(new BN(10).pow(new BN(27)))

    return {
      id: tokenId,
      symbol: tokenResult.symbol,
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
