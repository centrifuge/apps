import { BigNumber } from '@ethersproject/bignumber'
import { Contract, ContractInterface } from '@ethersproject/contracts'
import type { JsonRpcProvider, TransactionRequest, TransactionResponse } from '@ethersproject/providers'
import BN from 'bn.js'
import { signERC2612Permit } from 'eth-permit'
import { from, map, startWith, switchMap } from 'rxjs'
import { Centrifuge } from '../Centrifuge'
import { TransactionOptions } from '../types'
import { CurrencyBalance, Price, TokenBalance } from '../utils/BN'
import { Call, multicall } from '../utils/evmMulticall'
import * as ABI from './liquidityPools/abi'

const maxUint256 = '115792089237316195423570985008687907853269984665640564039457584007913129639935'
const PERMIT_TYPEHASH = '0x6e71edae12b1b97f4d1f60370fef10105fa2faae0126114a169c64845d6126c9'

type EvmQueryOptions = {
  rpcProvider?: JsonRpcProvider
}

export type Permit = {
  deadline: number | string
  r: string
  s: string
  v: number
}
const toCurrencyBalance = (decimals: number) => (val: BigNumber) => new CurrencyBalance(val.toString(), decimals)
const toTokenBalance = (decimals: number) => (val: BigNumber) => new TokenBalance(val.toString(), decimals)
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

  function approveForCurrency(args: [address: string, currencyAddress: string], options: TransactionRequest = {}) {
    const [address, currencyAddress] = args
    return pending(contract(currencyAddress, ABI.Currency).approve(address, maxUint256, options))
  }

  async function signPermit(args: [address: string, currencyAddress: string]) {
    const [address, currencyAddress] = args
    const permit = await signERC2612Permit(
      inst.config.evmSigner,
      currencyAddress,
      inst.getSignerAddress('evm'),
      address,
      maxUint256
    )
    return permit as Permit
  }

  function updateInvestOrder(args: [lpAddress: string, order: BN], options: TransactionRequest = {}) {
    const [lpAddress, order] = args
    const user = inst.getSignerAddress('evm')
    return pending(
      contract(lpAddress, ABI.LiquidityPool).requestDeposit(order.toString(), user, { ...options, gasLimit: 300000 })
    )
  }

  function updateRedeemOrder(args: [lpAddress: string, order: BN], options: TransactionRequest = {}) {
    const [lpAddress, order] = args
    const user = inst.getSignerAddress('evm')
    return pending(
      contract(lpAddress, ABI.LiquidityPool).requestRedeem(order.toString(), user, { ...options, gasLimit: 300000 })
    )
  }

  function updateInvestOrderWithPermit(
    args: [lpAddress: string, order: BN, permit: Permit],
    options: TransactionRequest = {}
  ) {
    const [lpAddress, order, { deadline, r, s, v }] = args
    const user = inst.getSignerAddress('evm')
    return pending(
      contract(lpAddress, ABI.LiquidityPool).requestDepositWithPermit(order.toString(), user, deadline, v, r, s, {
        ...options,
        gasLimit: 300000,
      })
    )
  }

  function updateRedeemOrderWithPermit(
    args: [lpAddress: string, order: BN, permit: Permit],
    options: TransactionRequest = {}
  ) {
    const [lpAddress, order, { deadline, r, s, v }] = args
    const user = inst.getSignerAddress('evm')
    return pending(
      contract(lpAddress, ABI.LiquidityPool).requestRedeemWithPermit(order.toString(), user, deadline, v, r, s, {
        ...options,
        gasLimit: 300000,
      })
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
            // router: '0x205b09C1C11A0a86cbc1066CC7B54C7952427439',
            router: '0x6627eC6b0e467D02117bE6949189054102EAe177',
          },
        ]
      })
    )
  }

  async function getManagerFromRouter(args: [router: string], options?: EvmQueryOptions) {
    const [router] = args
    return '0x91924F801C8989fbaaa4F4CDf96adfb8ad5014d8'
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

    // const lps: string[] = await contract(managerAddress, ABI.InvestmentManager, options).getLiquidityPoolsForTranche(
    //   poolId,
    //   trancheId
    // )

    const lps = ['0x4E683165ACcbBCF95dAe7c4e77359c3a8C666cC6']

    const assetData = await multicall<{ assets?: string[]; share: string }>(
      [
        ...lps.map(
          (lpAddress, i) =>
            ({
              target: lpAddress,
              call: ['function asset() view returns (address)'],
              returns: [[`assets[${i}]`]],
            } as Call)
        ),

        {
          target: lps[0],
          call: ['function share() view returns (address)'],
          returns: [['share']],
        },
      ],
      {
        rpcProvider: options?.rpcProvider ?? inst.config.evmSigner?.provider!,
      }
    )

    console.log('assetData', assetData)

    if (!assetData.assets?.length) return []

    const currencyData = await multicall<{
      currencies: { currencySymbol: string; currencyDecimals: number; currencySupportsPermit?: boolean }[]
      trancheTokenSupportsPermit?: boolean
    }>(
      [
        ...assetData.assets.flatMap(
          (assetAddress, i) =>
            [
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
              {
                target: assetAddress,
                call: ['function PERMIT_TYPEHASH() view returns (bytes32)'],
                returns: [
                  [`currencies[${i}].currencySupportsPermit`, (typeHash: string) => typeHash === PERMIT_TYPEHASH],
                ],
                allowFailure: true,
              },
            ] as Call[]
        ),
        {
          target: assetData.share,
          call: ['function PERMIT_TYPEHASH() view returns (bytes32)'],
          returns: [[`trancheTokenSupportsPermit`, (typeHash: string) => typeHash === PERMIT_TYPEHASH]],
          allowFailure: true,
        },
      ],
      {
        rpcProvider: options?.rpcProvider ?? inst.config.evmSigner?.provider!,
      }
    )

    console.log('currencyData', currencyData, assetData)

    const result = lps.map((addr, i) => ({
      lpAddress: addr,
      currencyAddress: assetData.assets![i],
      managerAddress,
      trancheTokenSupportsPermit: currencyData.trancheTokenSupportsPermit,
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

    console.log('pool.anagerCurrencyAllowance', pool.managerCurrencyAllowance)

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
    updateInvestOrderWithPermit,
    updateRedeemOrderWithPermit,
    mint,
    withdraw,
    approveForCurrency,
    signPermit,
    getDomainRouters,
    getManagerFromRouter,
    getPool,
    getLiquidityPools,
    getLiquidityPoolInvestment,
  }
}
