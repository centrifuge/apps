import BN from 'bn.js'
import type { TransactionRequest, TransactionResponse } from 'ethers'
import { Contract, Interface, Provider, ethers, isAddress as isEvmAddress } from 'ethers'
import set from 'lodash/set'
import { combineLatestWith, firstValueFrom, from, map, startWith, switchMap } from 'rxjs'
import { Centrifuge } from '../Centrifuge'
import { TransactionOptions } from '../types'
import { addressToHex } from '../utils'
import { CurrencyBalance, TokenBalance } from '../utils/BN'
import { Call, multicall } from '../utils/evmMulticall'
import { signERC2612Permit } from '../utils/signERC2612Permit'
import * as ABI from './liquidityPools/abi'
import { CurrencyKey, CurrencyMetadata, getCurrencyEvmAddress, getCurrencyLocation } from './pools'
import { Observable, of } from 'rxjs';

const PERMIT_TYPEHASH = '0x6e71edae12b1b97f4d1f60370fef10105fa2faae0126114a169c64845d6126c9'
const NULL_ADDRESS = '0x0000000000000000000000000000000000000000'

type EvmQueryOptions = {
  rpcProvider?: Provider
}

export type Permit = {
  deadline: number | string
  r: string
  s: string
  v: number
}
const toCurrencyBalance = (decimals: number) => (val: BigInt) => new CurrencyBalance(val.toString(), decimals)
const toTokenBalance = (decimals: number) => (val: BigInt) => new TokenBalance(val.toString(), decimals)

type LPConfig = {
  centrifugeRouter: string
}
const config: Record<number, LPConfig> = {
  // Testnet
  11155111: {
    centrifugeRouter: '0x723635430aa191ef5f6f856415f41b1a4d81dd7a',
  },
  84532: {
    centrifugeRouter: '0x723635430aa191ef5f6f856415f41b1a4d81dd7a',
  },
  // Mainnet
  1: {
    centrifugeRouter: '0xb1a07D21Fc8eD1eF2208395Bb3b262C66D3d3281',
  },
  42161: {
    centrifugeRouter: '0xF35501E7fC4a076E744dbAFA883CED74CCF5009d',
  },
  8453: {
    centrifugeRouter: '0x5B82fFdaC6D77fBd21a4eeb9b8c540F77eeD1231',
  },
  42220: {
    centrifugeRouter: '0x5a00C4fF931f37202aD4Be1FDB297E9EDc1CBb33',
  },
}

export function getLiquidityPoolsModule(inst: Centrifuge) {
  function contract(contractAddress: string, abi: Interface, options?: EvmQueryOptions) {
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
    const bytes = ethers.hexlify(new Uint8Array([0x12]))
    const getEstimate = from(contract(centrifugeRouter, new Interface(ABI.CentrifugeRouter)).estimate(bytes))
    return getEstimate.pipe(
      map((estimate) => {
        return { estimate, centrifugeRouter }
      })
    )
  }

  function getCentrifugeRouterAddress(chainId: number) {
    return config[chainId].centrifugeRouter
  }

  function getProvider(options?: EvmQueryOptions) {
    return options?.rpcProvider ?? inst.config.evmSigner?.provider
  }

  function transferTrancheTokens(
    args: [
      receiverAddress: string,
      amount: BN,
      vault: string,
      currencyAddress: string,
      chainId: number,
      destinationNetwork: 'centrifuge' | { evm: number }
    ],
    options: TransactionRequest = {}
  ) {
    const [receiverAddress, amount, vault, currencyAddress, chainId, destinationNetwork] = args
    return centrifugeRouter(chainId).pipe(
      switchMap(({ estimate, centrifugeRouter }) => {
        const isToSameNetwork = typeof destinationNetwork !== 'string' && chainId === destinationNetwork.evm
        if (isToSameNetwork) {
          return pending(
            contract(currencyAddress, new Interface(ABI.Currency)).transfer(receiverAddress, amount.toString(), options)
          )
        }
        const domain = destinationNetwork === 'centrifuge' ? 0 : 1
        const destinationId = destinationNetwork === 'centrifuge' ? 0 : destinationNetwork.evm
        const address = isEvmAddress(receiverAddress) ? receiverAddress.padEnd(66, '0') : addressToHex(receiverAddress)
        return pending(
          contract(centrifugeRouter, new Interface(ABI.CentrifugeRouter)).transferTrancheTokens(
            vault,
            domain,
            destinationId,
            address,
            amount.toString(),
            estimate,
            {
              ...options,
              value: estimate,
              gasLimit: 500000,
            }
          )
        )
      })
    )
  }

  function enablePoolOnDomain(
    args: [
      poolId: string,
      chainId: number,
      currencyKeysToAdd: CurrencyKey[],
      tokenPricesToUpdate: [string, CurrencyKey][]
    ][],
    options?: TransactionOptions
  ) {
    const $api = inst.getApi()
    const uniqueChainIds = [...new Set(args.map(([, chainId]) => chainId))]

    return from(Promise.all(uniqueChainIds.map((chainId) => firstValueFrom(getDomainCurrencies([chainId]))))).pipe(
      combineLatestWith($api),
      switchMap(([currenciesByChain, api]) => {
        const chainIdToCurrencies = Object.fromEntries(
          uniqueChainIds.map((chainId, i) => [chainId, currenciesByChain[i]])
        )

        return from(Promise.all(args.map(([poolId]) => firstValueFrom(api.query.poolSystem.pool(poolId))))).pipe(
          switchMap((rawPools) => {
            // Group args by chainId
            const argsByChainId = args.reduce((acc, arg, index) => {
              const [poolId, chainId, currencyKeysToAdd, tokenPricesToUpdate] = arg
              const pool = rawPools[index].toPrimitive() as any
              const currencies = chainIdToCurrencies[chainId]

              if (!acc[chainId]) acc[chainId] = []
              acc[chainId].push({ poolId, currencyKeysToAdd, tokenPricesToUpdate, pool, currencies })
              return acc
            }, {} as Record<number, { poolId: string; currencyKeysToAdd: CurrencyKey[]; tokenPricesToUpdate: [string, CurrencyKey][]; pool: any; currencies: any[] }[]>)

            // Create batch for each chainId
            const tx = api.tx.utility.batchAll(
              Object.entries(argsByChainId).flatMap(([chainId, chainArgs]) => [
                api.tx.liquidityPoolsGateway.startBatchMessage({ EVM: Number(chainId) }),
                ...chainArgs.flatMap(({ poolId, currencyKeysToAdd, tokenPricesToUpdate, pool, currencies }) => [
                  ...(currencyKeysToAdd?.map((key) => api.tx.liquidityPools.addCurrency(key)) ?? []),
                  api.tx.liquidityPools.addPool(poolId, { EVM: Number(chainId) }),
                  ...pool.tranches.ids.flatMap((trancheId: string) => [
                    api.tx.liquidityPools.addTranche(poolId, trancheId, { EVM: Number(chainId) }),
                  ]),
                  ...currencies.map((cur) => api.tx.liquidityPools.allowInvestmentCurrency(poolId, cur.key)),
                  ...tokenPricesToUpdate.map(([tid, curKey]) =>
                    api.tx.liquidityPools.updateTokenPrice(poolId, tid, curKey, { EVM: Number(chainId) })
                  ),
                ]),
                api.tx.liquidityPoolsGateway.endBatchMessage({ EVM: Number(chainId) }),
              ])
            )
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
      contract(poolManager, new Interface(ABI.PoolManager)).deployTranche(poolId, trancheId, {
        ...options,
        gasLimit: 5000000,
      })
    )
  }

  function deployLiquidityPool(
    args: [poolManager: string, poolId: string, trancheId: string, currencyAddress: string],
    options: TransactionRequest = {}
  ) {
    const [poolManager, poolId, trancheId, currencyAddress] = args
    return pending(
      contract(poolManager, new Interface(ABI.PoolManager)).deployVault(poolId, trancheId, currencyAddress, {
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

    return pending(
      contract(currencyAddress, new Interface(ABI.Currency)).approve(centrifugeRouterAddress, amount, options)
    )
  }

  async function getCentrifugeRouterAllowance(
    args: [currencyAddress: string, user: string, chainId: number],
    options?: EvmQueryOptions
  ) {
    const [currencyAddress, user, chainId] = args
    const centrifugeRouterAddress = getCentrifugeRouterAddress(chainId)

    const calls: Call[] = [
      {
        target: currencyAddress,
        call: ['function allowance(address, address) view returns (uint)', user, centrifugeRouterAddress],
        returns: [['allowance']],
      },
      {
        target: currencyAddress,
        call: ['function decimals() view returns (uint8)'],
        returns: [['decimals']],
      },
    ]

    const data = await multicall<{
      decimals: bigint
      allowance: bigint
    }>(calls, {
      rpcProvider: options?.rpcProvider ?? inst.config.evmSigner?.provider!,
    })

    return {
      allowance: new CurrencyBalance(data.allowance.toString(), Number(data.decimals)),
    }
  }

  async function signPermit(args: [currencyAddress: string, amount: BN, chainId: number]) {
    const [currencyAddress, amount, chainId] = args
    if (!inst.config.evmSigner) throw new Error('EVM signer not set')

    let domainOrCurrency: any = currencyAddress
    if (currencyAddress.toLowerCase() === '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48') {
      // USDC has custom version
      domainOrCurrency = { name: 'USD Coin', version: '2', chainId, verifyingContract: currencyAddress }
    } else if (chainId === 5 || chainId === 84531 || chainId === 421613 || chainId === 11155111) {
      // Assume on testnets the LP currencies are used which have custom domains
      domainOrCurrency = { name: 'Centrifuge', version: '1', chainId, verifyingContract: currencyAddress }
    }

    const centrifugeRouterAddress = getCentrifugeRouterAddress(chainId)
    const deadline = Math.floor(Date.now() / 1000) + 3600 // 1 hour
    const permit = await signERC2612Permit(
      inst.config.evmSigner,
      domainOrCurrency,
      inst.getSignerAddress('evm'),
      centrifugeRouterAddress,
      amount.toString(),
      deadline
    )
    return permit as Permit
  }

  function enableCentrifugeRouter(args: [lpAddress: string, chainId: number], options: TransactionRequest = {}) {
    const [lpAddress, chainId] = args
    const centrifugeRouterAddress = getCentrifugeRouterAddress(chainId)

    return pending(contract(centrifugeRouterAddress, new Interface(ABI.CentrifugeRouter)).enable(lpAddress, options))
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
        // TODO: add these back after contract upgrade that allows to call the enable function
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
          contract(centrifugeRouter, new Interface(ABI.CentrifugeRouter)).multicall([enable, requestDeposit], {
            ...options,
            gasLimit: 500000,
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
          contract(centrifugeRouter, new Interface(ABI.CentrifugeRouter)).requestRedeem(
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
        // TODO: add these back after contract upgrade that allows to call the enable function
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
        const permit = iface.encodeFunctionData('permit', [
          currencyAddress,
          centrifugeRouter,
          order.toString(),
          deadline,
          v,
          r,
          s,
        ])

        return pending(
          contract(centrifugeRouter, new Interface(ABI.CentrifugeRouter)).multicall([permit, enable, requestDeposit], {
            ...options,
            gasLimit: 500000,
            value: estimate,
          })
        )
      })
    )
  }

  function cancelRedeemOrder(args: [lpAddress: string, chainId: number], options: TransactionRequest = {}) {
    const [lpAddress, chainId] = args
    return centrifugeRouter(chainId).pipe(
      switchMap(({ estimate, centrifugeRouter }) => {
        return pending(
          contract(centrifugeRouter, new Interface(ABI.CentrifugeRouter)).cancelRedeemRequest(lpAddress, estimate, {
            ...options,
            value: estimate,
          })
        )
      })
    )
  }

  /** After cancelDepositRequest is executed (gas paid on Axelar) one more message (fulfilledCancelDepositRequest) has to be paid for manually on Axelar */
  function cancelInvestOrder(args: [lpAddress: string, chainId: number], options: TransactionRequest = {}) {
    const [lpAddress, chainId] = args
    return centrifugeRouter(chainId).pipe(
      switchMap(({ estimate, centrifugeRouter }) => {
        return pending(
          contract(centrifugeRouter, new Interface(ABI.CentrifugeRouter)).cancelDepositRequest(lpAddress, estimate, {
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
          contract(centrifugeRouter, new Interface(ABI.CentrifugeRouter)).claimCancelDepositRequest(
            lpAddress,
            user,
            user,
            {
              ...options,
              value: estimate,
            }
          )
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
          contract(centrifugeRouter, new Interface(ABI.CentrifugeRouter)).claimCancelRedeemRequest(
            lpAddress,
            user,
            user,
            {
              ...options,
              value: estimate,
            }
          )
        )
      })
    )
  }

  function mint(args: [lpAddress: string, chainId: number, receiver?: string], options: TransactionRequest = {}) {
    const [lpAddress, chainId, receiver] = args
    const user = inst.getSignerAddress('evm')
    return centrifugeRouter(chainId).pipe(
      switchMap(({ estimate, centrifugeRouter }) => {
        return pending(
          contract(centrifugeRouter, new Interface(ABI.CentrifugeRouter)).claimDeposit(
            lpAddress,
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

  function withdraw(args: [lpAddress: string, chainId: number], options: TransactionRequest = {}) {
    const [lpAddress, chainId] = args
    const user = inst.getSignerAddress('evm')
    return centrifugeRouter(chainId).pipe(
      switchMap(({ estimate, centrifugeRouter }) => {
        return pending(
          contract(centrifugeRouter, new Interface(ABI.CentrifugeRouter)).claimRedeem(lpAddress, user, user, {
            ...options,
            value: estimate,
            gasLimit: 200000,
          })
        )
      })
    )
  }
  
    interface DomainRouter {
        chainId: number;
        router: string;
        centrifugeRouter: string;
    }

    /**
     * Emits a single array of hard-coded domain routers.
     */
    function getDomainRouters(): Observable<DomainRouter[]> {
        const routers: DomainRouter[] = [
            {
                chainId: 1,
                router: '0x85bafcadea202258e3512ffbc3e2c9ee6ad56365',
                centrifugeRouter: '0xb1a07D21Fc8eD1eF2208395Bb3b262C66D3d3281',
            },
            {
                chainId: 42161,
                router: '0x85bafcadea202258e3512ffbc3e2c9ee6ad56365',
                centrifugeRouter: '0xF35501E7fC4a076E744dbAFA883CED74CCF5009d',
            },
            {
                chainId: 8453,
                router: '0x30e34260b895cae34a1cfb185271628c53311cf3',
                centrifugeRouter: '0x5B82fFdaC6D77fBd21a4eeb9b8c540F77eeD1231',
            },
            {
                chainId: 42220,
                router: '0xe4e34083a49df72e634121f32583c9ea59191cca',
                centrifugeRouter: '0x5a00C4fF931f37202aD4Be1FDB297E9EDc1CBb33',
            },
        ];

        return of(routers);
    }

  async function getManagerFromRouter(args: [router: string], options?: EvmQueryOptions) {
    const [router] = args
    const gatewayAddress = await contract(router, new Interface(ABI.Router), options).gateway()
    const managerAddress = await contract(gatewayAddress, new Interface(ABI.Gateway), options).investmentManager()
    return managerAddress as string
  }

  async function getRecentLPEvents(args: [lpAddress: string, user: string], options?: EvmQueryOptions) {
    const [lpAddress, user] = args
    const blockNumber = await getProvider(options)!.getBlockNumber()
    const cont = contract(lpAddress, new Interface(ABI.LiquidityPool), options)
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

    const poolManager = (await contract(
      investmentManager,
      new Interface(ABI.InvestmentManager),
      options
    ).poolManager()) as string

    const poolData = await multicall<{
      isActive: boolean
      canTrancheBeDeployed: Record<string, boolean>
      trancheTokens: Record<string, string | null>
      liquidityPools: Record<string, Record<string, string | null>>
      currencyNeedsAdding: Record<string, boolean>
      isAllowedAsset: Record<string, boolean>
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
        ...(currencies.flatMap((currency) => {
          return [
            {
              target: poolManager,
              call: ['function assetToId(address) view returns (uint128)', currency.address],
              returns: [[`currencyNeedsAdding[${currency.address}]`, (id: bigint) => id === 0n]],
            },
            {
              target: poolManager,
              call: ['function isAllowedAsset(uint64,address) view returns (bool)', poolId, currency.address],
              returns: [[`isAllowedAsset[${currency.address}]`]],
            },
          ]
        }) as Call[]),
      ],
      {
        rpcProvider: getProvider(options)!,
      }
    )
    poolData.canTrancheBeDeployed ??= {}
    poolData.trancheTokens ??= {}
    poolData.liquidityPools ??= {}
    poolData.currencyNeedsAdding ??= {}
    poolData.isAllowedAsset ??= {}

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

    const poolManager: string = await contract(
      managerAddress,
      new Interface(ABI.InvestmentManager),
      options
    ).poolManager()

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
      trancheTokenDecimals: BigInt
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
      trancheTokenDecimals: Number(currencyData.trancheTokenDecimals),
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
          lp.lpAddress,
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
      {
        target: getCentrifugeRouterAddress(chainId),
        call: ['function isEnabled(address, address) view returns (bool)', lp.lpAddress, user],
        returns: [['isRouterEnabled']],
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
      isRouterEnabled: boolean
    }>(calls, {
      rpcProvider: options?.rpcProvider ?? inst.config.evmSigner?.provider!,
    })

    return pool
  }

  async function getRestrictions(args: [trancheTokenAddress: string, address: string], options?: EvmQueryOptions) {
    const [trancheTokenAddress, user] = args
    const calls: Call[] = [
      {
        target: trancheTokenAddress,
        call: ['function hook() view returns (address)'],
        returns: [['hook']],
      },
    ]
    const trancheTokenHook = await multicall<{ hook: string }>(calls, {
      rpcProvider: options?.rpcProvider ?? inst.config.evmSigner?.provider!,
    })

    const data = await multicall<{ isFrozen: boolean; isMember: boolean }>(
      [
        {
          target: trancheTokenHook.hook,
          call: ['function isFrozen(address, address) view returns (bool)', trancheTokenAddress, user],
          returns: [['isFrozen']],
        },
        {
          target: trancheTokenHook.hook,
          call: ['function isMember(address, address) view returns (bool)', trancheTokenAddress, user],
          returns: [['isMember']],
        },
      ],
      {
        rpcProvider: options?.rpcProvider ?? inst.config.evmSigner?.provider!,
      }
    )
    return data
  }

  return {
    transferTrancheTokens,
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
    getCentrifugeRouterAllowance,
    enableCentrifugeRouter,
    getRestrictions,
  }
}
