import { BigNumber } from '@ethersproject/bignumber'
import { Contract, ContractInterface } from '@ethersproject/contracts'
import type { JsonRpcProvider, TransactionRequest, TransactionResponse } from '@ethersproject/providers'
import BN from 'bn.js'
import { signERC2612Permit } from 'eth-permit'
import { combineLatestWith, firstValueFrom, from, map, startWith, switchMap } from 'rxjs'
import { Centrifuge } from '../Centrifuge'
import { TransactionOptions } from '../types'
import { CurrencyBalance, TokenBalance } from '../utils/BN'
import { Call, multicall } from '../utils/evmMulticall'
import * as ABI from './liquidityPools/abi'
import { CurrencyKey, getCurrencyEvmAddress, getCurrencyLocation } from './pools'

const maxUint256 = '115792089237316195423570985008687907853269984665640564039457584007913129639935'
const PERMIT_TYPEHASH = '0x6e71edae12b1b97f4d1f60370fef10105fa2faae0126114a169c64845d6126c9'
const NULL_ADDRESS = '0x0000000000000000000000000000000000000000'

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

  function getProvider(options?: EvmQueryOptions) {
    return options?.rpcProvider ?? inst.config.evmSigner?.provider
  }

  function enablePoolOnDomain(
    args: [poolId: string, chainId: number, currencyKeysToAdd: CurrencyKey[]],
    options?: TransactionOptions
  ) {
    const [poolId, chainId, currencyKeysToAdd] = args
    const $api = inst.getApi()

    return getDomainCurrencies([chainId]).pipe(
      combineLatestWith($api),
      switchMap(([currencies, api]) => {
        return api.query.poolSystem.pool(poolId).pipe(
          switchMap((rawPool) => {
            const pool = rawPool.toPrimitive() as any
            const tx = api.tx.utility.batchAll([
              ...(currencyKeysToAdd?.map((key) => api.tx.liquidityPools.addCurrency(key)) ?? []),
              api.tx.liquidityPools.addPool(poolId, { EVM: chainId }),
              ...pool.tranches.ids.flatMap((trancheId: string) => [
                api.tx.liquidityPools.addTranche(poolId, trancheId, { EVM: chainId }),
                // Ensure the domain currencies are enabled
                // Using a batch, because theoretically they could have been enabled already for a different domain
                api.tx.utility.batch(
                  currencies.map((cur) => api.tx.liquidityPools.allowInvestmentCurrency(poolId, trancheId, cur.key))
                ),
              ]),
            ])
            return inst.wrapSignAndSend(api, tx, options)
          })
        )
      })
    )
  }

  function deployTranche(
    args: [poolManager: string, poolId: string, trancheId: string],
    options: TransactionRequest = {}
  ) {
    const [poolManager, poolId, trancheId] = args
    return pending(
      contract(poolManager, ABI.PoolManager).deployTranche(poolId, trancheId, { ...options, gasLimit: 5000000 })
    )
  }

  function deployLiquidityPool(
    args: [poolManager: string, poolId: string, trancheId: string, currencyAddress: string],
    options: TransactionRequest = {}
  ) {
    const [poolManager, poolId, trancheId, currencyAddress] = args
    return pending(
      contract(poolManager, ABI.PoolManager).deployLiquidityPool(poolId, trancheId, currencyAddress, {
        ...options,
        gasLimit: 5000000,
      })
    )
  }

  function approveForCurrency(args: [address: string, currencyAddress: string], options: TransactionRequest = {}) {
    const [address, currencyAddress] = args
    return pending(contract(currencyAddress, ABI.Currency).approve(address, maxUint256, options))
  }

  async function signPermit(args: [spender: string, currencyAddress: string, amount: BN]) {
    const [spender, currencyAddress, amount] = args
    if (!inst.config.evmSigner) throw new Error('EVM signer not set')
    const permit = await signERC2612Permit(
      inst.config.evmSigner,
      currencyAddress,
      inst.getSignerAddress('evm'),
      spender,
      amount.toString()
    )
    return permit as Permit
  }

  function increaseInvestOrder(args: [lpAddress: string, order: BN], options: TransactionRequest = {}) {
    const [lpAddress, order] = args
    const user = inst.getSignerAddress('evm')
    return pending(
      contract(lpAddress, ABI.LiquidityPool).requestDeposit(order.toString(), user, { ...options, gasLimit: 300000 })
    )
  }

  function increaseRedeemOrder(args: [lpAddress: string, order: BN], options: TransactionRequest = {}) {
    const [lpAddress, order] = args
    const user = inst.getSignerAddress('evm')
    return pending(
      contract(lpAddress, ABI.LiquidityPool).requestRedeem(order.toString(), user, user, {
        ...options,
        gasLimit: 300000,
      })
    )
  }

  function increaseInvestOrderWithPermit(
    args: [lpAddress: string, order: BN, permit: Permit],
    options: TransactionRequest = {}
  ) {
    const [lpAddress, order, { deadline, r, s, v }] = args
    return pending(
      contract(lpAddress, ABI.LiquidityPool).requestDepositWithPermit(order.toString(), deadline, v, r, s, {
        ...options,
        gasLimit: 300000,
      })
    )
  }

  function cancelRedeemOrder(args: [lpAddress: string], options: TransactionRequest = {}) {
    const [lpAddress] = args
    return pending(contract(lpAddress, ABI.LiquidityPool).cancelRedeemRequest(options))
  }

  function cancelInvestOrder(args: [lpAddress: string], options: TransactionRequest = {}) {
    const [lpAddress] = args
    return pending(contract(lpAddress, ABI.LiquidityPool).cancelDepositRequest(options))
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
      switchMap((api) => api.query.liquidityPoolsGateway.domainRouters.entries()),
      map((rawRouters) => {
        return rawRouters
          .map(([rawKey, rawValue]) => {
            const key = (rawKey.toHuman() as ['Centrifuge' | { EVM: string }])[0]
            if (typeof key === 'string') return null as never
            const value = rawValue.toPrimitive() as any
            const chainId = Number(key.EVM.replace(/\D/g, ''))
            const router = (value.axelarXCM?.axelarTargetContract ||
              value.ethereumXCM?.axelarTargetContract ||
              value.axelarEVM?.liquidityPoolsContractAddress) as string
            if (!router) return null as never

            return {
              chainId,
              router,
            }
          })
          .filter(Boolean)
      })
    )
  }

  async function getManagerFromRouter(args: [router: string], options?: EvmQueryOptions) {
    const [router] = args
    const gatewayAddress = await contract(router, ABI.Router, options).gateway()
    const managerAddress = await contract(gatewayAddress, ABI.Gateway, options).investmentManager()
    return managerAddress as string
  }

  async function getRecentLPEvents(args: [lpAddress: string, user: string], options?: EvmQueryOptions) {
    const [lpAddress, user] = args
    const blockNumber = await getProvider(options)!.getBlockNumber()
    const cont = contract(lpAddress, ABI.LiquidityPool, options)
    const depositFilter = cont.filters.DepositRequest(user)
    const redeemFilter = cont.filters.RedeemRequest(user)
    const cancelDepositFilter = cont.filters.CancelDepositRequest(user)
    const cancelRedeemFilter = cont.filters.CancelRedeemRequest(user)
    const events = await Promise.all([
      cont.queryFilter(depositFilter, blockNumber - 300),
      cont.queryFilter(redeemFilter, blockNumber - 300),
      cont.queryFilter(cancelDepositFilter, blockNumber - 300),
      cont.queryFilter(cancelRedeemFilter, blockNumber - 300),
    ])
    return events.flat()
  }

  async function getPool(
    args: [chainId: number, investmentManager: string, poolId: string],
    options?: EvmQueryOptions
  ) {
    const [chainId, investmentManager, poolId] = args

    const trancheIds = await firstValueFrom(
      inst.getApi().pipe(
        switchMap((api) => api.query.poolSystem.pool(poolId)),
        map((rawPool) => {
          const pool = rawPool.toPrimitive() as any
          return pool.tranches.ids as string[]
        })
      )
    )

    const currencies = await firstValueFrom(getDomainCurrencies([chainId]))

    const poolManager = (await contract(investmentManager, ABI.InvestmentManager, options).poolManager()) as string

    const poolData = await multicall<{
      isActive: boolean
      undeployedTranches: Record<string, boolean>
      trancheTokens: Record<string, string>
      liquidityPools: Record<string, Record<string, string | null>>
      currencyNeedsAdding: Record<string, boolean>
    }>(
      [
        ...trancheIds.flatMap(
          (trancheId) =>
            [
              {
                target: poolManager,
                call: [
                  'function undeployedTranches(uint64,bytes16) view returns (uint8,string,string)',
                  poolId,
                  trancheId,
                ],
                returns: [[`undeployedTranches[${trancheId}]`, (dec) => !!dec]],
              },
              {
                target: poolManager,
                call: ['function getTrancheToken(uint64,bytes16) view returns (address)', poolId, trancheId],
                returns: [[`trancheTokens[${trancheId}]`, (addr) => (addr !== NULL_ADDRESS ? addr : null)]],
              },
              ...(currencies.flatMap((currency) => ({
                target: poolManager,
                call: [
                  'function getLiquidityPool(uint64,bytes16,address) view returns (address)',
                  poolId,
                  trancheId,
                  currency.address,
                ],
                returns: [
                  [
                    `liquidityPools[${trancheId}][${currency.address}]`,
                    (addr) => (addr !== NULL_ADDRESS ? addr : null),
                  ],
                ],
              })) as Call[]),
            ] as Call[]
        ),
        {
          target: poolManager,
          call: ['function pools(uint64) view returns (uint256)', poolId],
          returns: [['isActive', (createdAt: BigNumber) => !createdAt.isZero()]],
        },
        ...(currencies.flatMap((currency) => ({
          target: poolManager,
          call: ['function currencyAddressToId(address) view returns (uint128)', currency.address],
          returns: [[`currencyNeedsAdding[${currency.address}]`, (id: BigNumber) => id.isZero()]],
        })) as Call[]),
      ],
      {
        rpcProvider: getProvider(options)!,
      }
    )

    return { ...poolData, poolManager, currencies }
  }

  function getDomainCurrencies(args: [chainId: number]) {
    const [chainId] = args
    return inst.pools.getCurrencies().pipe(
      map((currencies) => {
        return currencies
          .filter((cur) => {
            const location = getCurrencyLocation(cur)
            return (
              typeof location === 'object' &&
              location.evm === chainId &&
              !!getCurrencyEvmAddress(cur) &&
              typeof cur.key === 'object' &&
              'ForeignAsset' in cur.key
            )
          })
          .map((cur) => ({ ...cur, address: getCurrencyEvmAddress(cur)! }))
      })
    )
  }

  async function getLiquidityPools(
    args: [managerAddress: string, poolId: string, trancheId: string, chainId: number],
    options?: EvmQueryOptions
  ) {
    const [managerAddress, poolId, trancheId, chainId] = args

    const currencies = await firstValueFrom(getDomainCurrencies([chainId]))

    const poolManager: string = await contract(managerAddress, ABI.InvestmentManager, options).poolManager()

    if (!currencies?.length) return []

    const lpData = await multicall<{ lps?: string[] }>(
      [
        ...currencies.map(
          (currency, i) =>
            ({
              target: poolManager,
              call: [
                'function getLiquidityPool(uint64, bytes16, address) view returns (address)',
                poolId,
                trancheId,
                currency.address,
              ],
              returns: [[`lps[${i}]`]],
            } as Call)
        ),
      ],
      {
        rpcProvider: getProvider(options)!,
      }
    )

    const lps = lpData.lps?.filter((lp) => lp !== NULL_ADDRESS)
    if (!lps?.length) return []

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
        rpcProvider: getProvider(options)!,
      }
    )

    if (!assetData.assets?.length) return []

    const currencyData = await multicall<{
      currencies: { currencySymbol: string; currencyDecimals: number; currencySupportsPermit?: boolean }[]
      trancheTokenSymbol: string
      trancheTokenDecimals: number
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
              // TODO: Enable again after testing that it works
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
          call: ['function symbol() view returns (string)'],
          returns: [['trancheTokenSymbol']],
        },
        {
          target: assetData.share,
          call: ['function decimals() view returns (uint8)'],
          returns: [['trancheTokenDecimals']],
        },
      ],
      {
        rpcProvider: options?.rpcProvider ?? inst.config.evmSigner?.provider!,
      }
    )

    const result = lps.map((addr, i) => ({
      lpAddress: addr,
      currencyAddress: assetData.assets![i],
      managerAddress,
      trancheTokenSymbol: currencyData.trancheTokenSymbol,
      trancheTokenDecimals: currencyData.trancheTokenDecimals,
      ...currencyData.currencies[i],
    }))
    return result
  }

  async function getLiquidityPoolInvestment(
    args: [user: string, managerAddress: string, lpAddress: string, currencyAddress: string],
    options?: EvmQueryOptions
  ) {
    const [user, manager, lp, currencyAddress] = args

    const currency = await multicall<{ trancheDecimals: number; currencyDecimals: number; tokenAddress: string }>(
      [
        {
          target: currencyAddress,
          call: ['function decimals() view returns (uint8)'],
          returns: [['currencyDecimals']],
        },
        {
          target: lp,
          call: ['function decimals() view returns (uint8)'],
          returns: [['trancheDecimals']],
        },
        {
          target: lp,
          call: ['function share() view returns (address)'],
          returns: [['tokenAddress']],
        },
      ],
      {
        rpcProvider: options?.rpcProvider ?? inst.config.evmSigner?.provider!,
      }
    )

    const calls: Call[] = [
      {
        target: currency.tokenAddress,
        call: ['function checkTransferRestriction(address, address, uint) view returns (bool)', NULL_ADDRESS, user, 0],
        returns: [['isAllowedToInvest']],
      },
      {
        target: lp,
        call: ['function balanceOf(address) view returns (uint256)', user],
        returns: [['tokenBalance', toTokenBalance(currency.trancheDecimals)]],
      },
      {
        target: currencyAddress,
        call: ['function balanceOf(address) view returns (uint256)', user],
        returns: [['currencyBalance', toCurrencyBalance(currency.currencyDecimals)]],
      },
      {
        target: currencyAddress,
        call: ['function allowance(address, address) view returns (uint)', user, manager],
        returns: [['lpCurrencyAllowance', toCurrencyBalance(currency.currencyDecimals)]],
      },
      {
        target: manager,
        call: [
          'function investments(address, address) view returns (uint128, uint256, uint128, uint256, uint128, uint128, bool)',
          lp,
          user,
        ],
        returns: [
          ['maxMint', toCurrencyBalance(currency.currencyDecimals)],
          [],
          ['maxWithdraw', toCurrencyBalance(currency.currencyDecimals)],
          [],
          ['pendingInvest', toCurrencyBalance(currency.currencyDecimals)],
          ['pendingRedeem', toCurrencyBalance(currency.currencyDecimals)],
          ['hasInvested'],
        ],
      },
    ]

    const pool = await multicall<{
      isAllowedToInvest: boolean
      hasInvested: boolean
      tokenBalance: TokenBalance
      maxMint: TokenBalance
      currencyBalance: CurrencyBalance
      maxWithdraw: CurrencyBalance
      lpCurrencyAllowance: CurrencyBalance
      managerTrancheTokenAllowance: CurrencyBalance
      pendingInvest: CurrencyBalance
      pendingRedeem: TokenBalance
    }>(calls, {
      rpcProvider: options?.rpcProvider ?? inst.config.evmSigner?.provider!,
    })

    return pool
  }

  return {
    enablePoolOnDomain,
    deployTranche,
    deployLiquidityPool,
    increaseInvestOrder,
    increaseRedeemOrder,
    increaseInvestOrderWithPermit,
    cancelInvestOrder,
    cancelRedeemOrder,
    mint,
    withdraw,
    approveForCurrency,
    signPermit,
    getDomainRouters,
    getManagerFromRouter,
    getPool,
    getLiquidityPools,
    getLiquidityPoolInvestment,
    getRecentLPEvents,
  }
}
