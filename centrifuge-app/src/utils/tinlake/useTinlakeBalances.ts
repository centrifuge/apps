import {
  AccountCurrencyBalance,
  AccountTokenBalance,
  CurrencyBalance,
  evmMulticall,
  EvmMulticallCall,
  TokenBalance,
} from '@centrifuge/centrifuge-js'
import { useWallet } from '@centrifuge/centrifuge-react'
import { BigNumber } from '@ethersproject/bignumber'
import { JsonRpcProvider } from '@ethersproject/providers'
import { useQuery } from 'react-query'
import { ethConfig } from '../../config'
import { currencies } from './currencies'
import { TinlakePool, useTinlakePools } from './useTinlakePools'

export function useTinlakeBalances(address?: string) {
  const {
    evm: { getProvider },
  } = useWallet()
  const { data } = useTinlakePools()
  return useQuery(
    ['tinlakeBalances', address, !!data?.pools],
    () => getBalances(data?.pools!, address!, getProvider(ethConfig.chainId)),
    {
      enabled: !!address && !!data?.pools,
      retry: false,
    }
  )
}

const WCFG_ADDRESS = '0xc221b7e65ffc80de234bbb6667abdd46593d34f0'

async function getBalances(pools: TinlakePool[], address: string, provider: JsonRpcProvider) {
  const calls: EvmMulticallCall[] = []
  const toTokenBalance = (val: BigNumber) => new TokenBalance(val.toString(), 18)
  const toCurrencyBalance = (val: BigNumber) => new CurrencyBalance(val.toString(), 18)

  const seenCurrencies = new Set<string>()

  pools.forEach((pool) => {
    calls.push(
      {
        target: pool.addresses.JUNIOR_TOKEN,
        call: ['function balanceOf(address) view returns (uint256)', address],
        returns: [[`tokens.${pool.id}.junior`, toTokenBalance]],
      },
      {
        target: pool.addresses.SENIOR_TOKEN,
        call: ['function balanceOf(address) view returns (uint256)', address],
        returns: [[`tokens.${pool.id}.senior`, toTokenBalance]],
      }
    )

    if (!seenCurrencies.has(pool.addresses.TINLAKE_CURRENCY.toLowerCase())) {
      calls.push({
        target: pool.addresses.TINLAKE_CURRENCY,
        call: ['function balanceOf(address) view returns (uint256)', address],
        returns: [[`currencies.${pool.addresses.TINLAKE_CURRENCY}`, toCurrencyBalance]],
      })
      seenCurrencies.add(pool.addresses.TINLAKE_CURRENCY)
    }
  })

  calls.push({
    target: WCFG_ADDRESS,
    call: ['function balanceOf(address) view returns (uint256)', address],
    returns: [[`currencies.${WCFG_ADDRESS}`, toCurrencyBalance]],
    allowFailure: true,
  })

  const multicallData = await evmMulticall<State>(calls, { rpcProvider: provider })

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

  Object.entries(multicallData.currencies).forEach(([currencyAddress, balance]) => {
    balances.currencies.push({
      balance,
      currency: currencyAddress === WCFG_ADDRESS ? currencies.wCFG : currencies.DAI,
    })
  })

  return balances
}

type State = {
  tokens: Record<string, { junior: TokenBalance; senior: TokenBalance }>
  currencies: Record<string, CurrencyBalance>
}
