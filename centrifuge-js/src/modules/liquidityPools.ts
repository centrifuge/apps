import { Interface } from '@ethersproject/abi'
import { BigNumber } from '@ethersproject/bignumber'
import { Contract, ContractInterface } from '@ethersproject/contracts'
import type { JsonRpcProvider, TransactionRequest, TransactionResponse } from '@ethersproject/providers'
import BN from 'bn.js'
import { signERC2612Permit } from 'eth-permit'
import set from 'lodash/set'
import { combineLatestWith, firstValueFrom, from, map, of, startWith, switchMap } from 'rxjs'
import { Centrifuge } from '../Centrifuge'
import { TransactionOptions } from '../types'
import { CurrencyBalance, TokenBalance } from '../utils/BN'
import { Call, multicall } from '../utils/evmMulticall'
import * as ABI from './liquidityPools/abi'
import { CurrencyKey, CurrencyMetadata, getCurrencyEvmAddress, getCurrencyLocation } from './pools'

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

type LPConfig = {
  centrifugeRouter: string
}
const config: Record<number, LPConfig> = {
  // Testnet
  11155111: {
    centrifugeRouter: '0x723635430aa191ef5f6f856415f41b1a4d81dd7a',
  },
  // Mainnet
  1: {
    centrifugeRouter: '0x2F445BA946044C5F508a63eEaF7EAb673c69a1F4',
  },
  42161: {
    centrifugeRouter: '0x2F445BA946044C5F508a63eEaF7EAb673c69a1F4',
  },
  8453: {
    centrifugeRouter: '0xF35501E7fC4a076E744dbAFA883CED74CCF5009d',
  },
  42220: {
    centrifugeRouter: '0x5a00C4fF931f37202aD4Be1FDB297E9EDc1CBb33',
  },
}

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

  function centrifugeRouter(chainId: number) {
    const centrifugeRouter = getCentrifugeRouterAddress(chainId)
    const getEstimate = from(contract(centrifugeRouter, ABI.CentrifugeRouter).estimate([0]))
    return from(getEstimate).pipe(
      switchMap((estimate) => {
        return of({ estimate, centrifugeRouter })
      })
    )
  }

  function getCentrifugeRouterAddress(chainId: number) {
    return config[chainId].centrifugeRouter
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
              api.tx.liquidityPoolsGateway.startBatchMessage({ EVM: chainId }),
              ...(currencyKeysToAdd?.map((key) => api.tx.liquidityPools.addCurrency(key)) ?? []),
              api.tx.liquidityPools.addPool(poolId, { EVM: chainId }),
              ...pool.tranches.ids.flatMap((trancheId: string) => [
                api.tx.liquidityPools.addTranche(poolId, trancheId, { EVM: chainId }),
              ]),
              ...currencies.map((cur) => api.tx.liquidityPools.allowInvestmentCurrency(poolId, cur.key)),
              api.tx.liquidityPoolsGateway.endBatchMessage({ EVM: chainId }),
            ])
            return inst.wrapSignAndSend(api, tx, options)
          })
        )
      })
    )
  }

  function updateTokenPrice(
    args: [poolId: string, trancheId: string, currency: CurrencyKey, evmChainId: number],
    options?: TransactionOptions
  ) {
    const [poolId, trancheId, currency, evmChainId] = args
    const $api = inst.getApi()

    return $api.pipe(
      switchMap((api) => {
        const tx = api.tx.liquidityPools.updateTokenPrice(poolId, trancheId, currency, { EVM: evmChainId })
        return inst.wrapSignAndSend(api, tx, options)
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
      contract(poolManager, ABI.PoolManager).deployVault(poolId, trancheId, currencyAddress, {
        ...options,
        gasLimit: 5000000,
      })
    )
  }

  function approveForCurrency(
    args: [currencyAddress: string, amount: BN, chainId: number],
    options: TransactionRequest = {}
  ) {
    const [currencyAddress, amount, chainId] = args
    const centrifugeRouterAddress = getCentrifugeRouterAddress(chainId)

    return pending(contract(currencyAddress, ABI.Currency).approve(centrifugeRouterAddress, amount, options))
  }

  async function signPermit(args: [spender: string, currencyAddress: string, amount: BN]) {
    const [spender, currencyAddress, amount] = args
    if (!inst.config.evmSigner) throw new Error('EVM signer not set')

    let domainOrCurrency: any = currencyAddress
    const chainId = await inst.config.evmSigner.getChainId()
    if (currencyAddress.toLowerCase() === '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48') {
      // USDC has custom version
      domainOrCurrency = { name: 'USD Coin', version: '2', chainId, verifyingContract: currencyAddress }
    } else if (chainId === 5 || chainId === 84531 || chainId === 421613 || chainId === 11155111) {
      // Assume on testnets the LP currencies are used which have custom domains
      domainOrCurrency = { name: 'Centrifuge', version: '1', chainId, verifyingContract: currencyAddress }
    }

    const permit = await signERC2612Permit(
      inst.config.evmSigner,
      domainOrCurrency,
      inst.getSignerAddress('evm'),
      spender,
      amount.toString()
    )
    return permit as Permit
  }

  function increaseInvestOrder(
    args: [lpAddress: string, order: BN, chainId: number],
    options: TransactionRequest = {}
  ) {
    const [lpAddress, order, chainId] = args
    const user = inst.getSignerAddress('evm')
    if (!inst.config.evmSigner) throw new Error('EVM signer not set')
    return centrifugeRouter(chainId).pipe(
      switchMap(({ estimate, centrifugeRouter }) => {
        const iface = new Interface(ABI.CentrifugeRouter)
        // const requestDeposit = iface.encodeFunctionData('requestDeposit', [
        //   lpAddress,
        //   order.toString(),
        //   user,
        //   user,
        //   estimate,
        // ])
        // const enable = iface.encodeFunctionData('enable', [lpAddress])
        const enable = iface.encodeFunctionData('enableLockDepositRequest', [lpAddress, order.toString()])
        const requestDeposit = iface.encodeFunctionData('executeLockedDepositRequest', [lpAddress, user, estimate])
        return pending(
          contract(centrifugeRouter, ABI.CentrifugeRouter).multicall([enable, requestDeposit], {
            ...options,
            gasLimit: 300000,
            value: estimate,
          })
        )
      })
    )
  }

  function increaseRedeemOrder(
    args: [lpAddress: string, order: BN, chainId: number],
    options: TransactionRequest = {}
  ) {
    const [lpAddress, order, chainId] = args
    const user = inst.getSignerAddress('evm')
    return centrifugeRouter(chainId).pipe(
      switchMap(({ estimate, centrifugeRouter }) => {
        return pending(
          contract(centrifugeRouter, ABI.CentrifugeRouter).requestRedeem(
            lpAddress,
            order.toString(),
            user,
            user,
            estimate,
            {
              ...options,
              gasLimit: 300000,
              value: estimate,
            }
          )
        )
      })
    )
  }

  function increaseInvestOrderWithPermit(
    args: [lpAddress: string, order: BN, currencyAddress: string, permit: Permit, chainId: number],
    options: TransactionRequest = {}
  ) {
    const [lpAddress, order, currencyAddress, { deadline, r, s, v }, chainId] = args
    const user = inst.getSignerAddress('evm')
    return centrifugeRouter(chainId).pipe(
      switchMap(({ estimate, centrifugeRouter }) => {
        const iface = new Interface(ABI.CentrifugeRouter)
        const requestDeposit = iface.encodeFunctionData('requestDeposit', [
          lpAddress,
          order.toString(),
          user,
          user,
          estimate,
        ])
        const enable = iface.encodeFunctionData('enable', [lpAddress])
        const permit = iface.encodeFunctionData('permit', [currencyAddress, user, deadline, v, r, s])

        return pending(
          contract(centrifugeRouter, ABI.CentrifugeRouter).multicall([enable, permit, requestDeposit], {
            ...options,
            gasLimit: 300000,
            value: estimate,
          })
        )
      })
    )
  }

  function cancelRedeemOrder(args: [lpAddress: string, chainId: number], options: TransactionRequest = {}) {
    const [lpAddress, chainId] = args
    const user = inst.getSignerAddress('evm')
    return centrifugeRouter(chainId).pipe(
      switchMap(({ estimate, centrifugeRouter }) => {
        return pending(
          contract(centrifugeRouter, ABI.CentrifugeRouter).cancelRedeemRequest(lpAddress, user, {
            ...options,
            value: estimate,
          })
        )
      })
    )
  }

  function cancelInvestOrder(args: [lpAddress: string, chainId: number], options: TransactionRequest = {}) {
    const [lpAddress, chainId] = args
    const user = inst.getSignerAddress('evm')
    return centrifugeRouter(chainId).pipe(
      switchMap(({ estimate, centrifugeRouter }) => {
        return pending(
          contract(centrifugeRouter, ABI.CentrifugeRouter).cancelDepositRequest(lpAddress, user, estimate, {
            ...options,
            value: estimate,
          })
        )
      })
    )
  }

  function claimCancelDeposit(args: [lpAddress: string, chainId: number], options: TransactionRequest = {}) {
    const [lpAddress, chainId] = args
    const user = inst.getSignerAddress('evm')
    return centrifugeRouter(chainId).pipe(
      switchMap(({ estimate, centrifugeRouter }) => {
        return pending(
          contract(centrifugeRouter, ABI.CentrifugeRouter).claimCancelDepositRequest(lpAddress, user, user, estimate, {
            ...options,
            value: estimate,
          })
        )
      })
    )
  }

  function claimCancelRedeem(args: [lpAddress: string, chainId: number], options: TransactionRequest = {}) {
    const [lpAddress, chainId] = args
    const user = inst.getSignerAddress('evm')
    return centrifugeRouter(chainId).pipe(
      switchMap(({ estimate, centrifugeRouter }) => {
        return pending(
          contract(centrifugeRouter, ABI.CentrifugeRouter).claimCancelRedeemRequest(lpAddress, user, user, estimate, {
            ...options,
            value: estimate,
          })
        )
      })
    )
  }

  function mint(
    args: [lpAddress: string, mint: BN, chainId: number, receiver?: string],
    options: TransactionRequest = {}
  ) {
    const [lpAddress, mint, chainId, receiver] = args
    const user = inst.getSignerAddress('evm')
    return centrifugeRouter(chainId).pipe(
      switchMap(({ estimate, centrifugeRouter }) => {
        return pending(
          contract(centrifugeRouter, ABI.CentrifugeRouter).requestDeposit(
            lpAddress,
            mint.toString(),
            receiver ?? user,
            {
              ...options,
              value: estimate,
              gasLimit: 200000,
            }
          )
        )
      })
    )
  }

  function withdraw(
    args: [lpAddress: string, withdraw: BN, chainId: number, receiver?: string],
    options: TransactionRequest = {}
  ) {
    const [lpAddress, withdraw, chainId, receiver] = args
    const user = inst.getSignerAddress('evm')
    return centrifugeRouter(chainId).pipe(
      switchMap(({ estimate, centrifugeRouter }) => {
        return pending(
          contract(centrifugeRouter, ABI.CentrifugeRouter).claimRedeem(
            lpAddress,
            withdraw.toString(),
            receiver ?? user,
            user,
            {
              ...options,
              value: estimate,
              gasLimit: 200000,
            }
          )
        )
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
              centrifugeRouter: config[chainId]?.centrifugeRouter,
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
      canTrancheBeDeployed: Record<string, boolean>
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
                call: ['function canTrancheBeDeployed(uint64,bytes16) view returns (bool)', poolId, trancheId],
                returns: [[`canTrancheBeDeployed[${trancheId}]`]],
              },
              {
                target: poolManager,
                call: ['function getTranche(uint64,bytes16) view returns (address)', poolId, trancheId],
                returns: [[`trancheTokens[${trancheId}]`, (addr) => (addr !== NULL_ADDRESS ? addr : null)]],
              },
              ...(currencies.flatMap((currency) => ({
                target: poolManager,
                call: [
                  'function getVault(uint64,bytes16,address) view returns (address)',
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
                allowFailure: true,
              })) as Call[]),
            ] as Call[]
        ),
        {
          target: poolManager,
          call: ['function isPoolActive(uint64) view returns (bool)', poolId],
          returns: [['isActive']],
        },
        ...(currencies.flatMap((currency) => ({
          target: poolManager,
          call: ['function assetToId(address) view returns (uint128)', currency.address],
          returns: [[`currencyNeedsAdding[${currency.address}]`, (id: BigNumber) => id.isZero()]],
        })) as Call[]),
      ],
      {
        rpcProvider: getProvider(options)!,
      }
    )
    poolData.canTrancheBeDeployed ??= {}
    poolData.trancheTokens ??= {}
    poolData.liquidityPools ??= {}
    poolData.currencyNeedsAdding ??= {}
    trancheIds.forEach((tid) => {
      currencies.forEach((cur) => {
        set(poolData, `liquidityPools[${tid}][${cur.address}]`, poolData.liquidityPools?.[tid]?.[cur.address] || null)
      })
    })

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
                'function getVault(uint64, bytes16, address) view returns (address)',
                poolId,
                trancheId,
                currency.address,
              ],
              returns: [[`lps[${i}]`]],
              allowFailure: true,
            } as Call)
        ),
      ],
      {
        rpcProvider: getProvider(options)!,
      }
    )

    const currenciesByLpAddress: Record<string, CurrencyMetadata & { address: string }> = {}
    lpData.lps?.forEach((lp, i) => {
      currenciesByLpAddress[lp] = currencies[i]
    })

    const lps = lpData.lps?.filter((lp) => lp !== NULL_ADDRESS)
    if (!lps?.length) return []

    const shareData = await multicall<{ share: string }>(
      [
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

    const currencyData = await multicall<{
      currencies: { currencySupportsPermit?: boolean }[]
      trancheTokenSymbol: string
      trancheTokenDecimals: number
    }>(
      [
        ...Object.values(currenciesByLpAddress).flatMap(
          (asset, i) =>
            [
              {
                target: asset.address,
                call: ['function PERMIT_TYPEHASH() view returns (bytes32)'],
                returns: [
                  [`currencies[${i}].currencySupportsPermit`, (typeHash: string) => typeHash === PERMIT_TYPEHASH],
                ],
                allowFailure: true,
              },
            ] as Call[]
        ),
        {
          target: shareData.share,
          call: ['function symbol() view returns (string)'],
          returns: [['trancheTokenSymbol']],
        },
        {
          target: shareData.share,
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
      currency: currenciesByLpAddress[addr],
      managerAddress,
      trancheTokenAddress: shareData.share,
      trancheTokenSymbol: currencyData.trancheTokenSymbol,
      trancheTokenDecimals: currencyData.trancheTokenDecimals,
      currencySupportsPermit: currencyData.currencies?.[i]?.currencySupportsPermit,
    }))
    return result
  }

  async function getLiquidityPoolInvestment(
    args: [
      user: string,
      lp: {
        managerAddress: string
        lpAddress: string
        currency: CurrencyMetadata & { address: string }
        trancheTokenAddress: string
        trancheTokenDecimals: number
      },
      chainId: number
    ],
    options?: EvmQueryOptions
  ) {
    const [user, lp, chainId] = args
    const centrifugeRouterAddress = getCentrifugeRouterAddress(chainId)

    const currencyBalanceTransform = toCurrencyBalance(lp.currency.decimals)
    const tokenBalanceTransform = toTokenBalance(lp.trancheTokenDecimals)

    const calls: Call[] = [
      {
        target: lp.trancheTokenAddress,
        call: ['function checkTransferRestriction(address, address, uint) view returns (bool)', NULL_ADDRESS, user, 0],
        returns: [['isAllowedToInvest']],
      },
      {
        target: lp.trancheTokenAddress,
        call: ['function balanceOf(address) view returns (uint256)', user],
        returns: [['tokenBalance', tokenBalanceTransform]],
      },
      {
        target: lp.currency.address,
        call: ['function balanceOf(address) view returns (uint256)', user],
        returns: [['currencyBalance', currencyBalanceTransform]],
      },
      {
        target: lp.currency.address,
        call: ['function allowance(address, address) view returns (uint)', user, centrifugeRouterAddress],
        returns: [['lpCurrencyAllowance', currencyBalanceTransform]],
      },
      {
        target: lp.managerAddress,
        call: [
          'function investments(address, address) view returns (uint128, uint128, uint256, uint256, uint128, uint128, uint128, uint128, bool, bool)',
          centrifugeRouterAddress,
          user,
        ],
        returns: [
          ['maxMint', tokenBalanceTransform],
          ['maxWithdraw', currencyBalanceTransform],
          [],
          [],
          ['pendingInvest', currencyBalanceTransform],
          ['pendingRedeem', currencyBalanceTransform],
          ['claimableCancelDepositRequest', currencyBalanceTransform],
          ['claimableCancelRedeemRequest', tokenBalanceTransform],
          ['pendingCancelDepositRequest'],
          ['pendingCancelRedeemRequest'],
        ],
      },
      {
        target: lp.lpAddress,
        call: ['function maxDeposit(address) view returns (uint256)', user],
        returns: [['maxDeposit', tokenBalanceTransform]],
      },
      {
        target: lp.lpAddress,
        call: ['function maxRedeem(address) view returns (uint256)', user],
        returns: [['maxRedeem', currencyBalanceTransform]],
      },
    ]

    const pool = await multicall<{
      isAllowedToInvest: boolean
      tokenBalance: TokenBalance
      currencyBalance: CurrencyBalance
      lpCurrencyAllowance: CurrencyBalance
      maxMint: TokenBalance
      maxDeposit: CurrencyBalance
      maxWithdraw: TokenBalance
      maxRedeem: CurrencyBalance
      pendingInvest: CurrencyBalance
      pendingRedeem: TokenBalance
      claimableCancelDepositRequest: CurrencyBalance
      claimableCancelRedeemRequest: TokenBalance
      pendingCancelDepositRequest: boolean
      pendingCancelRedeemRequest: boolean
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
    claimCancelDeposit,
    claimCancelRedeem,
    approveForCurrency,
    signPermit,
    updateTokenPrice,
    getDomainRouters,
    getManagerFromRouter,
    getPool,
    getLiquidityPools,
    getLiquidityPoolInvestment,
    getRecentLPEvents,
  }
}
