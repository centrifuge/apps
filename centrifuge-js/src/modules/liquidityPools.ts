import { BigNumber } from '@ethersproject/bignumber'
import { Contract, ContractInterface } from '@ethersproject/contracts'
import type { JsonRpcProvider, TransactionRequest, TransactionResponse } from '@ethersproject/providers'
import BN from 'bn.js'
import { from, map, startWith, switchMap } from 'rxjs'
import { Centrifuge } from '../Centrifuge'
import { TransactionOptions } from '../types'
import { CurrencyBalance, Price, TokenBalance } from '../utils/BN'
import { Call, multicall } from '../utils/evmMulticall'
import * as ABI from './liquidityPools/abi'

const maxUint256 = '115792089237316195423570985008687907853269984665640564039457584007913129639935'

type EvmQueryOptions = {
  rpcProvider?: JsonRpcProvider
}

const toCurrencyBalance = (decimals: number) => (val: BigNumber) => new CurrencyBalance(val.toString(), decimals)
const toTokenBalance = (decimals: number) => (val: BigNumber) => new TokenBalance(val.toString(), decimals)
const toDateString = (val: BigNumber) => new Date(val.toNumber() * 1000).toISOString()
const toPrice = (val: BigNumber) => new Price(val.toString())

export function getLiquidityPoolsModule(inst: Centrifuge) {
  function contract(contractAddress: string, abi: ContractInterface, options?: EvmQueryOptions) {
    const provider = inst.config.evmSigner ?? options?.rpcProvider
    if (!provider) throw new Error('Needs provider')
    return new Contract(contractAddress, abi, provider)
  }

  function pending(txPromise: Promise<TransactionResponse>) {
    return from(txPromise).pipe(
      switchMap((response) => {
        return from(response.wait()).pipe(
          map(() => response),
          startWith(response)
        )
      })
    )
  }

  function enablePoolOnDomain(args: [poolId: string, chainId: number], options?: TransactionOptions) {
    const [poolId, chainId] = args
    const $api = inst.getApi()

    return $api.pipe(
      switchMap((api) => {
        return api.query.poolSystem.pool(poolId).pipe(
          switchMap((rawPool) => {
            const pool = rawPool.toPrimitive() as any
            const tx = api.tx.utility.batchAll([
              api.tx.connectors.addPool(poolId, { EVM: chainId }),
              ...pool.tranches.ids.flatMap((trancheId: string) =>
                api.tx.connectors.addTranche(poolId, trancheId, { EVM: chainId })
              ),
            ])
            return inst.wrapSignAndSend(api, tx, options)
          })
        )
      })
    )
  }

  function approveManagerForCurrency(
    args: [managerAddress: string, currencyAddress: string],
    options: TransactionRequest = {}
  ) {
    const [managerAddress, currencyAddress] = args
    return pending(contract(currencyAddress, ABI.Currency).approve(managerAddress, maxUint256, options))
  }

  function updateInvestOrder(args: [lpAddress: string, order: BN], options: TransactionRequest = {}) {
    const [lpAddress, order] = args
    return pending(
      contract(lpAddress, ABI.LiquidityPool).requestDeposit(order.toString(), { ...options, gasLimit: 300000 })
    )
  }

  function updateRedeemOrder(args: [lpAddress: string, order: BN], options: TransactionRequest = {}) {
    const [lpAddress, order] = args
    return pending(
      contract(lpAddress, ABI.LiquidityPool).requestRedeem(order.toString(), { ...options, gasLimit: 300000 })
    )
  }

  function mint(args: [lpAddress: string, mint: BN, receiver?: string], options: TransactionRequest = {}) {
    const [lpAddress, mint, receiver] = args
    const user = inst.getSignerAddress('evm')
    return pending(
      contract(lpAddress, ABI.LiquidityPool).mint(mint.toString(), receiver ?? user, {
        ...options,
        gasLimit: 200000,
      })
    )
  }

  function withdraw(args: [lpAddress: string, withdraw: BN, receiver?: string], options: TransactionRequest = {}) {
    const [lpAddress, withdraw, receiver] = args
    const user = inst.getSignerAddress('evm')
    return pending(
      contract(lpAddress, ABI.LiquidityPool).withdraw(withdraw.toString(), receiver ?? user, user, {
        ...options,
        gasLimit: 200000,
      })
    )
  }

  function getDomainRouters() {
    return inst.getApi().pipe(
      switchMap((api) => api.query.connectorsGateway.domainRouters.entries()),
      map((rawRouters) => {
        console.log('rawRouters', rawRouters)
        return [
          {
            chainId: 5,
            router: '0x205b09C1C11A0a86cbc1066CC7B54C7952427439',
          },
        ]
      })
    )
  }

  async function getManagerFromRouter(args: [router: string], options?: EvmQueryOptions) {
    const [router] = args
    const gatewayAddress = await contract(router, ABI.Router, options).gateway()
    const managerAddress = await contract(gatewayAddress, ABI.Gateway, options).investmentManager()
    return managerAddress as string
  }

  async function getPool(args: [connector: string, poolId: string], options?: EvmQueryOptions) {
    const [connector, poolId] = args
    const calls: Call[] = [
      {
        target: connector,
        call: ['function pools(uint64) view returns (uint64,uint256,bool)', poolId],
        returns: [['poolId'], ['createdAt'], ['isActive']],
      },
    ]
    const pool = await multicall<{ poolId: string; createdAt: number; isActive: boolean }>(calls, {
      rpcProvider: options?.rpcProvider ?? inst.config.evmSigner?.provider!,
    })
    return pool
  }

  async function getLiquidityPools(
    args: [managerAddress: string, poolId: string, trancheId: string],
    options?: EvmQueryOptions
  ) {
    const [managerAddress, poolId, trancheId] = args

    const lps: string[] = await contract(managerAddress, ABI.InvestmentManager, options).getLiquidityPoolsForTranche(
      poolId,
      trancheId
    )

    const assetData = await multicall<{ assets?: string[] }>(
      lps.map((lpAddress, i) => ({
        target: lpAddress,
        call: ['function asset() view returns (address)'],
        returns: [[`assets[${i}]`]],
      })),
      {
        rpcProvider: options?.rpcProvider ?? inst.config.evmSigner?.provider!,
      }
    )

    if (!assetData.assets?.length) return []

    const currencyData = await multicall<{ currencies: { currencySymbol: string; currencyDecimals: number }[] }>(
      assetData.assets.flatMap((assetAddress, i) => [
        {
          target: assetAddress,
          call: ['function symbol() view returns (string)'],
          returns: [[`currencies[${i}].currencySymbol`]],
        },

        {
          target: assetAddress,
          call: ['function decimals() view returns (uint8)'],
          returns: [[`currencies[${i}].currencyDecimals`]],
        },
      ]),
      {
        rpcProvider: options?.rpcProvider ?? inst.config.evmSigner?.provider!,
      }
    )

    const result = lps.map((addr, i) => ({
      lpAddress: addr,
      currencyAddress: assetData.assets![i],
      managerAddress,
      ...currencyData.currencies[i],
    }))
    return result
  }

  async function getLiquidityPoolInvestment(
    args: [user: string, managerAddress: string, lpAddress: string],
    options?: EvmQueryOptions
  ) {
    const [user, manager, lp] = args

    const currency = await multicall<{ address: string; decimals: number }>(
      [
        {
          target: lp,
          call: ['function asset() view returns (address)'],
          returns: [['address']],
        },
        {
          target: lp,
          call: ['function decimals() view returns (uint8)'],
          returns: [['decimals']],
        },
      ],
      {
        rpcProvider: options?.rpcProvider ?? inst.config.evmSigner?.provider!,
      }
    )

    const calls: Call[] = [
      {
        target: lp,
        call: ['function latestPrice() view returns (uint128)'],
        returns: [['tokenPrice', toPrice]],
      },
      {
        target: lp,
        call: ['function lastPriceUpdate() view returns (uint256)'],
        returns: [['lastPriceUpdate', toDateString]],
      },
      {
        target: lp,
        call: ['function hasMember(address) view returns (bool)', user],
        returns: [['isAllowedToInvest']],
      },
      {
        target: lp,
        call: ['function balanceOf(address) view returns (uint256)', user],
        returns: [['tokenBalance', toTokenBalance(currency.decimals)]],
      },
      {
        target: lp,
        call: ['function maxMint(address) view returns (uint256)', user],
        returns: [['maxMint', toTokenBalance(currency.decimals)]],
      },
      {
        target: lp,
        call: ['function maxWithdraw(address) view returns (uint256)', user],
        returns: [['maxWithdraw', toCurrencyBalance(currency.decimals)]],
      },
      {
        target: currency.address,
        call: ['function balanceOf(address) view returns (uint256)', user],
        returns: [['currencyBalance', toCurrencyBalance(currency.decimals)]],
      },
      {
        target: currency.address,
        call: ['function allowance(address, address) view returns (uint)', user, manager],
        returns: [['managerCurrencyAllowance', toCurrencyBalance(currency.decimals)]],
      },
      {
        target: lp,
        call: ['function allowance(address, address) view returns (uint)', user, manager],
        returns: [['managerTrancheTokenAllowance', toCurrencyBalance(currency.decimals)]],
      },
    ]

    const pool = await multicall<{
      tokenPrice: Price
      lastPriceUpdate: number
      isAllowedToInvest: boolean
      tokenBalance: TokenBalance
      maxMint: TokenBalance
      currencyBalance: CurrencyBalance
      maxWithdraw: CurrencyBalance
      managerCurrencyAllowance: CurrencyBalance
      managerTrancheTokenAllowance: CurrencyBalance
    }>(calls, {
      rpcProvider: options?.rpcProvider ?? inst.config.evmSigner?.provider!,
    })

    // TODO: Remove. just for testing
    if (pool.tokenPrice.isZero()) {
      pool.tokenPrice = Price.fromFloat(1)
    }
    return pool
  }

  return {
    enablePoolOnDomain,
    updateInvestOrder,
    updateRedeemOrder,
    mint,
    withdraw,
    approveManagerForCurrency,
    getDomainRouters,
    getManagerFromRouter,
    getPool,
    getLiquidityPools,
    getLiquidityPoolInvestment,
  }
}
