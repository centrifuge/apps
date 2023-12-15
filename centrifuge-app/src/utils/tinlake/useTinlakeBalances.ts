import { AccountCurrencyBalance, AccountTokenBalance, CurrencyBalance, TokenBalance } from '@centrifuge/centrifuge-js'
import { BigNumber } from '@ethersproject/bignumber'
import { useQuery } from 'react-query'
import { useAddress } from '../useAddress'
import { currencies } from './currencies'
import { Call, multicall } from './multicall'
import { TinlakePool, useTinlakePools } from './useTinlakePools'

export function useTinlakeBalances(address?: string) {
  const addr = useAddress('evm') || address
  const { data } = useTinlakePools()
  return useQuery(['tinlakeBalances', addr, !!data?.pools], () => getBalances(data?.pools!, addr!), {
    enabled: !!addr && !!data?.pools,
  })
}

async function getBalances(pools: TinlakePool[], address: string) {
  const calls: Call[] = []
  const toTokenBalance = (val: BigNumber) => new TokenBalance(val.toString(), 18)
  const toCurrencyBalance = (val: BigNumber) => new CurrencyBalance(val.toString(), 18)

  const seenCurrencies = new Set<string>()

  pools.forEach((pool) => {
    calls.push(
      {
        target: pool.addresses.JUNIOR_TOKEN,
        call: ['balanceOf(address)(uint256)', address],
        returns: [[`tokens.${pool.id}.junior`, toTokenBalance]],
      },
      {
        target: pool.addresses.SENIOR_TOKEN,
        call: ['balanceOf(address)(uint256)', address],
        returns: [[`tokens.${pool.id}.senior`, toTokenBalance]],
      }
    )

    if (!seenCurrencies.has(pool.addresses.TINLAKE_CURRENCY.toLowerCase())) {
      calls.push({
        target: pool.addresses.TINLAKE_CURRENCY,
        call: ['balanceOf(address)(uint256)', address],
        returns: [[`currencies.${pool.addresses.TINLAKE_CURRENCY}`, toCurrencyBalance]],
      })
      seenCurrencies.add(pool.addresses.TINLAKE_CURRENCY)
    }
  })

  const multicallData = await multicall<State>(calls)

  const balances = {
    tranches: [] as AccountTokenBalance[],
    currencies: [] as AccountCurrencyBalance[],
  }

  pools.forEach((pool) => {
    ;(['junior', 'senior'] as const).forEach((trancheName, i) => {
      const tranche = pool.tranches[i]
      balances.tranches.push({
        balance: new TokenBalance(multicallData.tokens[pool.id][trancheName], tranche.currency.decimals),
        currency: tranche.currency,
        poolId: pool.id,
        trancheId: tranche.id,
      })
    })
  })

  Object.values(multicallData.currencies).forEach((balance) => {
    balances.currencies.push({
      balance,
      currency: currencies.DAI,
    })
  })

  return balances
}

type State = {
  tokens: Record<string, { junior: TokenBalance; senior: TokenBalance }>
  currencies: Record<string, CurrencyBalance>
}
