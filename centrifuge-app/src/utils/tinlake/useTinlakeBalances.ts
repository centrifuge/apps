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
import { BaseProvider } from '@ethersproject/providers'
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

async function getBalances(pools: TinlakePool[], address: string, provider: BaseProvider) {
  const calls: EvmMulticallCall[] = []
  const toTokenBalance = (val: BigNumber) => new TokenBalance(val.toString(), 18)
  const toCurrencyBalance = (val: BigNumber) => new CurrencyBalance(val.toString(), 18)

  const seenCurrencies = new Set<string>()

  pools.forEach((pool) => {
    calls.push(
      {
        target: pool.addresses.JUNIOR_TOKEN,
        call: ['function balanceOf(address) view returns (uint256)', address],
        returns: [[`tokens.${pool.id}.junior.balance`, toTokenBalance]],
      },
      {
        target: pool.addresses.SENIOR_TOKEN,
        call: ['function balanceOf(address) view returns (uint256)', address],
        returns: [[`tokens.${pool.id}.senior.balance`, toTokenBalance]],
      },
      {
        target: pool.addresses.JUNIOR_TRANCHE,
        call: ['function calcDisburse(address) view returns (uint256,uint256,uint256,uint256)', address],
        returns: [
          [`tokens.${pool.id}.junior.payoutCurrencyAmount`, toCurrencyBalance],
          [`tokens.${pool.id}.junior.payoutTokenAmount`, toTokenBalance],
          [`tokens.${pool.id}.junior.remainingInvestCurrency`, toCurrencyBalance],
          [`tokens.${pool.id}.junior.remainingRedeemToken`, toTokenBalance],
        ],
      },
      {
        target: pool.addresses.SENIOR_TRANCHE,
        call: ['function calcDisburse(address) view returns (uint256,uint256,uint256,uint256)', address],
        returns: [
          [`tokens.${pool.id}.senior.payoutCurrencyAmount`, toCurrencyBalance],
          [`tokens.${pool.id}.senior.payoutTokenAmount`, toTokenBalance],
          [`tokens.${pool.id}.senior.remainingInvestCurrency`, toCurrencyBalance],
          [`tokens.${pool.id}.senior.remainingRedeemToken`, toTokenBalance],
        ],
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
    tranches: [] as (AccountTokenBalance & { balancePending: TokenBalance })[],
    currencies: [] as AccountCurrencyBalance[],
  }

  pools.forEach((pool) => {
    ;(['junior', 'senior'] as const).forEach((trancheName, i) => {
      const tranche = pool.tranches[i]
      balances.tranches.push({
        balance: new TokenBalance(multicallData.tokens[pool.id][trancheName].balance, tranche.currency.decimals),
        balancePending: new TokenBalance(
          multicallData.tokens[pool.id][trancheName].balance
            .add(multicallData.tokens[pool.id][trancheName].remainingRedeemToken)
            .add(multicallData.tokens[pool.id][trancheName].payoutTokenAmount),

          tranche.currency.decimals
        ),
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
  tokens: Record<
    string,
    {
      junior: {
        balance: TokenBalance
        payoutCurrencyAmount: CurrencyBalance
        payoutTokenAmount: TokenBalance
        remainingInvestCurrency: CurrencyBalance
        remainingRedeemToken: TokenBalance
      }
      senior: {
        balance: TokenBalance
        payoutCurrencyAmount: CurrencyBalance
        payoutTokenAmount: TokenBalance
        remainingInvestCurrency: CurrencyBalance
        remainingRedeemToken: TokenBalance
      }
    }
  >
  currencies: Record<string, CurrencyBalance>
}
