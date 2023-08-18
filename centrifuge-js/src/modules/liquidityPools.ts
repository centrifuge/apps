import { BigNumber } from '@ethersproject/bignumber'
import { Contract, ContractInterface } from '@ethersproject/contracts'
import type { JsonRpcProvider, TransactionRequest, TransactionResponse } from '@ethersproject/providers'
import BN from 'bn.js'
import { from, map, startWith, switchMap } from 'rxjs'
import { Centrifuge } from '../Centrifuge'
import { CurrencyBalance, Price, Rate, TokenBalance } from '../utils/BN'
import { Call, multicall } from '../utils/evmMulticall'
import * as ABI from './liquidityPools/abi'

const maxUint256 = '115792089237316195423570985008687907853269984665640564039457584007913129639935'

type EvmQueryOptions = {
  rpcProvider?: JsonRpcProvider
}

const toCurrencyBalance = (decimals: number) => (val: BigNumber) => new CurrencyBalance(val.toString(), decimals)
const toTokenBalance = (decimals: number) => (val: BigNumber) => new TokenBalance(val.toString(), decimals)
const toDateString = (val: BigNumber) => new Date(val.toNumber() * 1000).toISOString()
const toNumber = (val: BigNumber) => val.toNumber()
const toRate = (val: BigNumber) => new Rate(val.toString())
const toPrice = (val: BigNumber) => new Price(val.toString())

export function getLiquidityPoolsModule(inst: Centrifuge) {
  function contract(contractAddress: string, abi: ContractInterface, options?: EvmQueryOptions) {
    const provider = inst.config.evmSigner ?? options?.rpcProvider
    if (!provider) throw new Error('Needs provider')
    return new Contract(contractAddress, abi, inst.config.evmSigner)
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

  function withdraw(args: [lpAddress: string, withdraw: BN, receiver?: string], options: TransactionRequest = {}) {
    const [lpAddress, withdraw, receiver] = args
    const user = inst.getSignerAddress('evm')
    return pending(
      contract(lpAddress, ABI.LiquidityPool).withdraw(withdraw.toString(), receiver ?? user, user, options)
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
            router: '0x3f82851463C172DBDc1229cA06170fF89f5638dC',
          },
        ]
      })
    )
  }

  async function getManagerFromRouter(args: [router: string], options?: EvmQueryOptions) {
    const [router] = args
    const managerAddress = await contract(router, ABI.Router, options).investmentManager()
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
  async function getTest(args: [connector: string, poolId: string], options?: EvmQueryOptions) {
    const [connector] = args
    const calls: Call[] = [
      {
        target: connector,
        call: ['function assessor() view returns (address)'],
        returns: [['address']],
      },
    ]
    const test = await multicall<{ poolId: string; createdAt: number; isActive: boolean }>(calls, {
      rpcProvider: options?.rpcProvider ?? inst.config.evmSigner?.provider!,
    })
    return test
  }

  async function getLiquidityPools(
    args: [managerAddress: string, poolId: string, trancheId: string],
    options?: EvmQueryOptions
  ) {
    const [managerAddress, poolId, trancheId] = args

    const lpData = await multicall<{ lps: string[] }>(
      [
        {
          target: managerAddress,
          call: ['function getLiquidityPoolsForTranche(uint64, bytes16) view returns (address[])', poolId, trancheId],
          returns: [['lps']],
        },
      ],
      {
        rpcProvider: options?.rpcProvider ?? inst.config.evmSigner?.provider!,
      }
    )

    console.log('lpData', lpData)

    const assetData = await multicall<{ assets?: string[] }>(
      lpData.lps.map((lpAddress, i) => ({
        target: lpAddress,
        call: ['function asset() view returns (address)'],
        returns: [[`assets[${i}]`]],
      })),
      {
        rpcProvider: options?.rpcProvider ?? inst.config.evmSigner?.provider!,
      }
    )

    console.log('assetData', assetData)
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

    console.log('currencyData', currencyData)

    const result = lpData.lps.map((addr, i) => ({
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

    console.log('currencyData', currency)

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
        returns: [['managerAllowance', toCurrencyBalance(currency.decimals)]],
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
      managerAllowance: CurrencyBalance
    }>(calls, {
      rpcProvider: options?.rpcProvider ?? inst.config.evmSigner?.provider!,
    })
    return pool
  }

  return {
    updateInvestOrder,
    updateRedeemOrder,
    withdraw,
    approveManagerForCurrency,
    getDomainRouters,
    getManagerFromRouter,
    getPool,
    getLiquidityPools,
    getLiquidityPoolInvestment,
    getTest,
    contract,
  }
}
