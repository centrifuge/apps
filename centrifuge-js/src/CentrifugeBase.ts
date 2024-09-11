import { ApiRx } from '@polkadot/api'
import { AddressOrPair, SubmittableExtrinsic } from '@polkadot/api/types'
import { EventRecord, SignedBlock } from '@polkadot/types/interfaces'
import { DefinitionRpc, DefinitionsCall, ISubmittableResult, Signer } from '@polkadot/types/types'
import { hexToBn } from '@polkadot/util'
import { sortAddresses } from '@polkadot/util-crypto'
import type { JsonRpcSigner, TransactionRequest } from 'ethers'
import 'isomorphic-fetch'
import {
  Observable,
  Subject,
  bufferCount,
  catchError,
  combineLatest,
  combineLatestWith,
  filter,
  firstValueFrom,
  from,
  map,
  mergeAll,
  mergeWith,
  of,
  share,
  startWith,
  switchMap,
  take,
  takeWhile,
  tap,
  throwError,
} from 'rxjs'
import { fromFetch } from 'rxjs/fetch'
import { TransactionErrorResult, TransactionOptions, TransactionResult } from './types'
import { computeMultisig, evmToSubstrateAddress, isSameAddress } from './utils'
import { CurrencyBalance } from './utils/BN'
import { getPolkadotApi } from './utils/web3'

type ProxyType = string

const EVM_DISPATCH_PRECOMPILE = '0x0000000000000000000000000000000000000401'
const WEIGHT_PER_GAS = 25_000
const GAS_LIMIT_POV_SIZE_RATIO = 4
const EVM_DISPATCH_OVERHEAD_GAS = 1_000_000

export type Config = {
  network: 'altair' | 'centrifuge'
  centrifugeWsUrl: string
  altairWsUrl: string
  polkadotWsUrl: string
  kusamaWsUrl: string
  centrifugeSubqueryUrl: string
  altairSubqueryUrl: string
  metadataHost: string
  pinFile?: (b64URI: string) => Promise<{ uri: string }>
  pinJson?: (json: string) => Promise<{ uri: string }>
  signer?: Signer
  signingAddress?: AddressOrPair
  evmSigner?: JsonRpcSigner
  evmSigningAddress?: string
  printExtrinsics?: boolean
  proxies?: ([delegator: string, forceProxyType?: ProxyType] | string)[]
  debug?: boolean
  substrateEvmChainId?: number
}

export type UserProvidedConfig = Partial<Config>

export type PaymentInfo = {
  class: string
  partialFee: number | CurrencyBalance
  weight: number
}

export type RewardDomain = 'Block' | 'Liquidity'

const defaultConfig: Config = {
  network: 'centrifuge',
  centrifugeWsUrl: 'wss://fullnode.parachain.centrifuge.io',
  altairWsUrl: 'wss://fullnode.altair.centrifuge.io',
  polkadotWsUrl: 'wss://rpc.polkadot.io',
  kusamaWsUrl: 'wss://kusama-rpc.polkadot.io',
  centrifugeSubqueryUrl: 'https://api.subquery.network/sq/centrifuge/pools',
  altairSubqueryUrl: 'https://api.subquery.network/sq/centrifuge/pools-altair',
  metadataHost: 'https://centrifuge.mypinata.cloud',
}

const relayChainTypes = {}

const parachainTypes = {
  ActiveLoanInfo: {
    activeLoan: 'PalletLoansEntitiesLoansActiveLoan',
    presentValue: 'Balance',
    outstandingPrincipal: 'Balance',
    outstandingInterest: 'Balance',
    currentPrice: 'Option<Balance>',
  },
  RewardDomain: {
    _enum: ['Block', 'Liquidity'],
  },
  InvestmentPortfolio: {
    poolCurrencyId: 'CfgTypesTokensCurrencyId',
    pendingInvestCurrency: 'Balance',
    claimableTrancheTokens: 'Balance',
    freeTrancheTokens: 'Balance',
    reservedTrancheTokens: 'Balance',
    pendingRedeemTrancheTokens: 'Balance',
    claimableCurrency: 'Balance',
  },
  PoolNav: {
    navAum: 'Balance',
    navFees: 'Balance',
    reserve: 'Balance',
    total: 'Balance',
  },
  PoolFeesList: 'Vec<PoolFeesOfBucket>',
  PoolFeesOfBucket: {
    bucket: 'CfgTraitsFeePoolFeeBucket',
    fees: 'Vec<CfgTypesPoolsPoolFee>',
  },
  PriceCollectionInput: {
    _enum: ['Empty', 'Custom(BoundedBTreeMap<OracleKey, Balance, MaxActiveLoansPerPool>)', 'FromRegistry'],
  },
}

// NOTE: Should never be extended due to deprecation of RPC in favor of RtAPI calls
const parachainRpcMethods: Record<string, Record<string, DefinitionRpc>> = {}

// NOTE: Runtime API calls must be in snake case (as defined in rust)
// However, RPCs are usually in camel case
const parachainRuntimeApi: DefinitionsCall = {
  PoolsApi: [
    {
      methods: {
        tranche_token_prices: {
          description: 'Retrieve prices for all tranches',
          params: [
            {
              name: 'pool_id',
              type: 'u64',
            },
          ],
          type: 'Option<Vec<u128>>',
        },
        nav: {
          description: 'Retrieve the net asset value of a pool',
          params: [
            {
              name: 'pool_id',
              type: 'u64',
            },
          ],
          type: 'Option<PoolNav>',
        },
      },
      version: 1,
    },
  ],
  RewardsApi: [
    {
      methods: {
        compute_reward: {
          description: 'Compute the claimable reward for the given triplet of domain, currency and account',
          params: [
            {
              name: 'domain',
              type: 'RewardDomain',
            },
            {
              name: 'currency_id',
              type: 'CfgTypesTokensCurrencyId',
            },
            {
              name: 'account_id',
              type: 'AccountId',
            },
          ],
          type: 'Option<Balance>',
        },
        list_currencies: {
          description:
            'List all reward currencies for the given domain and account. These currencies could be used as keys for the computeReward call',
          params: [
            {
              name: 'domain',
              type: 'RewardDomain',
            },
            {
              name: 'account_id',
              type: 'AccountId',
            },
          ],
          type: 'Vec<CfgTypesTokensCurrencyId>',
        },
      },
      version: 1,
    },
  ],
  InvestmentsApi: [
    {
      methods: {
        investment_portfolio: {
          description: 'Get account portfolio',
          params: [
            {
              name: 'account_id',
              type: 'AccountId',
            },
          ],
          type: 'Vec<(CfgTypesTokensTrancheCurrency, InvestmentPortfolio)>',
        },
      },
      version: 1,
    },
  ],
  LoansApi: [
    {
      methods: {
        portfolio: {
          description: 'Get active pool loan',
          params: [
            {
              name: 'pool_id',
              type: 'u64',
            },
          ],
          type: 'Vec<(u64, ActiveLoanInfo)>',
        },
        portfolio_loan: {
          description: 'Get active pool loan',
          params: [
            {
              name: 'pool_id',
              type: 'u64',
            },
            {
              name: 'loan_id',
              type: 'u64',
            },
          ],
          type: 'Option<PalletLoansEntitiesLoansActiveLoan>',
        },
        portfolio_valuation: {
          description: 'Get an emulated portfolio update with custom prices',
          params: [
            {
              name: 'pool_id',
              type: 'u64',
            },
            {
              name: 'input_prices',
              type: 'PriceCollectionInput',
            },
          ],
          type: 'Result<Balance, DispatchError>',
        },
      },
      version: 3,
    },
  ],
  AccountConversionApi: [
    {
      methods: {
        conversion_of: {
          description: 'Get converted address',
          params: [
            {
              name: 'location',
              type: 'StagingXcmV3MultiLocation',
            },
          ],
          type: 'Option<AccountId32>',
        },
      },
      version: 1,
    },
  ],
  PoolFeesApi: [
    {
      methods: {
        list_fees: {
          description: 'Simulate pool fees update and get all fees for the given pool',
          params: [
            {
              name: 'pool_id',
              type: 'u64',
            },
          ],
          type: 'PoolFeesList',
        },
      },
      version: 1,
    },
  ],
}

type Events = ISubmittableResult['events']

const txCompletedEvents: Record<string, Subject<Events>> = {}
const blockEvents: Record<string, Observable<Events>> = {}
let parachainUrlCache: string | null = null

export class CentrifugeBase {
  config: Config
  relayChainUrl: string
  subqueryUrl: string
  rpcEndpoints: string[]

  constructor(config: UserProvidedConfig = {}) {
    this.config = { ...defaultConfig, ...config }
    this.relayChainUrl = this.config.network === 'centrifuge' ? this.config.polkadotWsUrl : this.config.kusamaWsUrl
    this.subqueryUrl =
      this.config.network === 'centrifuge' ? this.config.centrifugeSubqueryUrl : this.config.altairSubqueryUrl
    this.rpcEndpoints = this.config.centrifugeWsUrl.split(',').map((url) => url.trim())
  }

  private async findHealthyWs(): Promise<string | null> {
    const url = await Promise.any(this.rpcEndpoints.map((url) => this.checkWsHealth(url)))
    if (url) {
      console.log(`Connection to ${url} established`)
      return url
    }
    console.error('Error: No healthy parachain URL found')
    return null
  }

  private checkWsHealth(url: string, timeoutMs: number = 5000): Promise<string> {
    return new Promise((resolve, reject) => {
      const ws = new WebSocket(url)
      const timer = setTimeout(() => {
        ws.close()
        console.log(`Connection to ${url} timed out`)
        reject()
      }, timeoutMs)

      ws.onopen = () => {
        clearTimeout(timer)
        ws.close()
        resolve(url)
      }

      ws.onerror = () => {
        clearTimeout(timer)
        ws.close()
        console.log(`Connection to ${url} failed`)
        reject()
      }
    })
  }

  private async getCachedParachainUrl(): Promise<string> {
    const cachedUrl = parachainUrlCache
    if (cachedUrl) {
      return cachedUrl
    }
    parachainUrlCache = await this.findHealthyWs()
    if (!parachainUrlCache) {
      throw new Error('No healthy parachain URL available')
    }
    return parachainUrlCache
  }

  async getChainId() {
    return this.getApiPromise().then((api) => api.registry.chainSS58 as number)
  }

  wrapSignAndSend<T extends TransactionOptions>(api: ApiRx, submittable: SubmittableExtrinsic<'rxjs'>, options?: T) {
    const isEvmTx = this.config.evmSigner && !this.config.signer
    let actualSubmittable = submittable

    if (options?.batch) return of(actualSubmittable)

    const proxies = (options?.proxies || this.config.proxies)?.map((p) =>
      Array.isArray(p) ? p : ([p, undefined] as [string, undefined])
    )

    let transferTx
    if (options?.transferToActingAccount && (options?.multisig || proxies)) {
      const multi = options?.multisig && computeMultisig(options.multisig)
      transferTx = api.tx.balances.transferKeepAlive(
        proxies?.at(-1)?.[0] || multi?.address,
        options.transferToActingAccount
      )
    }

    if (proxies && !options?.sendOnly) {
      actualSubmittable = wrapProxyCalls(api, actualSubmittable, proxies)
    }

    if (options?.multisig) {
      const otherSigners = sortAddresses(
        options.multisig.signers.filter(
          (signer) =>
            !isSameAddress(
              signer,
              isEvmTx
                ? evmToSubstrateAddress(this.config.evmSigningAddress!, this.config.substrateEvmChainId!)
                : this.getSignerAddress()
            )
        )
      )
      console.log('multisig callData', actualSubmittable.method.toHex())
      actualSubmittable = api.tx.multisig.asMulti(options.multisig.threshold, otherSigners, null, actualSubmittable, 0)
    }

    if (transferTx) {
      actualSubmittable = api.tx.utility.batchAll([transferTx, actualSubmittable])
    }

    if (this.config.printExtrinsics) {
      if (submittable.method.method === 'batchAll' || submittable.method.method === 'batch') {
        console.log(`utility.${submittable.method.method}([`)
        ;(submittable.method.args as any)[0].forEach((call: any) => {
          const callDetails = api.findCall(call.callIndex)
          console.log(
            `\t${callDetails.section}.${callDetails.method}(${call.args.map((arg: any) => arg.toString()).join(', ')})`
          )
        })
        console.log(`])`)
      } else {
        console.log(
          `${submittable.method.section}.${submittable.method.method}(${submittable.method.args
            .map((arg) => arg.toString())
            .join(', ')})`
        )
      }
    }

    if (isEvmTx) {
      // TODO: signOnly and sendOnly
      return this.wrapSubstrateEvmSignAndSend(api, actualSubmittable, options)
    }

    const { signer, signingAddress } = this.getSigner()

    try {
      const $paymentInfo = submittable.paymentInfo(signingAddress)
      const $balances = api.query.system.account(this.getSignerAddress())

      if (options?.paymentInfo) {
        return $paymentInfo.pipe(
          map((paymentInfoRaw) => {
            const paymentInfo = paymentInfoRaw.toJSON() as any
            return {
              ...paymentInfo,
              partialFee: new CurrencyBalance(hexToBn(paymentInfo.partialFee), api.registry.chainDecimals[0]),
            }
          })
        )
      }

      const $checkBalance = combineLatest([$balances, $paymentInfo]).pipe(
        take(1),
        takeWhile(([balancesRaw, paymentInfoRaw]) => {
          const paymentInfo = paymentInfoRaw.toJSON() as { partialFee: number }
          const nativeBalance = balancesRaw.toJSON() as { data: { free: string } }
          const txFee = Number(paymentInfo.partialFee.toString()) / 10 ** api.registry.chainDecimals[0]
          const balance = new CurrencyBalance(hexToBn(nativeBalance.data.free), api.registry.chainDecimals[0])
          if (balance.lten(txFee)) {
            throw new Error(`${api.registry.chainTokens[0]} balance too low`)
          }
          return true
        })
      )

      if (options?.signOnly) {
        return $checkBalance.pipe(
          switchMap(() =>
            actualSubmittable.signAsync(signingAddress, { signer, era: options?.era, withSignedTransaction: true })
          )
        )
      }

      return (
        options?.sendOnly
          ? actualSubmittable.send()
          : $checkBalance.pipe(
              switchMap(() =>
                actualSubmittable.signAndSend(signingAddress, {
                  signer,
                  era: options?.era,
                  withSignedTransaction: true,
                })
              )
            )
      ).pipe(
        map((result) => {
          const errors = result.events.filter(({ event }) => {
            const possibleProxyErr = event.data[0]?.toHuman()
            return (
              api.events.system.ExtrinsicFailed.is(event) ||
              (api.events.proxy.ProxyExecuted.is(event) &&
                possibleProxyErr &&
                typeof possibleProxyErr === 'object' &&
                'Err' in possibleProxyErr)
            )
          })
          if (errors.length && this.config.debug) {
            console.log('🚨 error', JSON.stringify(errors))
          }
          return {
            data: result,
            events: result.events,
            status: result.status.type,
            error: result.dispatchError || errors[0],
            txHash: result.txHash.toHuman() as string,
            blockNumber: (result as any).blockNumber ? Number((result as any).blockNumber?.toString()) : undefined,
          }
        }),
        tap(async (result) => {
          options?.onStatusChange?.(result)
          if (result.status === 'InBlock') {
            ;(await this.getTxCompletedEvents()).next(result.events)
          }
        }),
        takeWhile((result) => {
          return result.status !== 'InBlock' && !result.error
        }, true)
      )
    } catch (e) {
      return throwError(() => e)
    }
  }

  wrapSubstrateEvmSignAndSend<T extends TransactionOptions>(
    _: ApiRx,
    submittable: SubmittableExtrinsic<'rxjs'>,
    options?: T
  ) {
    const address = evmToSubstrateAddress(this.config.evmSigningAddress!, this.config.substrateEvmChainId!)

    return submittable.paymentInfo(address).pipe(
      switchMap((paymentInfo) => {
        const weight = paymentInfo.weight.refTime.toPrimitive() as number
        const gas = (Math.ceil(weight / WEIGHT_PER_GAS) + EVM_DISPATCH_OVERHEAD_GAS) * GAS_LIMIT_POV_SIZE_RATIO
        const tx: TransactionRequest = {
          // type: 2,
          to: EVM_DISPATCH_PRECOMPILE,
          data: submittable.method.toHex(),
          gasLimit: gas,
          // gas: 0 // TODO: How to estimate gas here?,
          // NOTE: value is unused, the Dispatch requires no additional payment beyond tx fees
        }
        const txPromise = this.config.evmSigner!.sendTransaction(tx)
        return from(txPromise).pipe(
          switchMap((response) => {
            return from(response.wait()).pipe(
              map((receipt) => [response, receipt] as const),
              startWith([response, null] as const),
              switchMap(([response, receipt]) => {
                const $events = receipt?.blockNumber ? this.getEventsByBlockNumber(receipt.blockNumber) : of(null)
                return combineLatest([of(response), of(receipt), $events])
              }),
              map(([response, receipt, events]) => {
                const result: TransactionResult = {
                  data: { response, receipt: receipt ?? undefined },
                  events: (events as any) ?? [],
                  status: receipt ? 'InBlock' : 'Broadcast',
                  error: receipt?.status === 0 ? new Error('failed') : undefined,
                  txHash: response.hash,
                  blockNumber: receipt?.blockNumber,
                }
                return result
              }),
              catchError(() => {
                const result: TransactionErrorResult = {
                  data: { response, receipt: undefined },
                  events: [],
                  status: 'Invalid',
                  error: new Error('failed'),
                  txHash: response.hash,
                  blockNumber: undefined,
                }
                return of(result)
              }),
              tap((result) => {
                options?.onStatusChange?.(result)
              })
            )
          })
        )
      })
    )
  }

  async querySubquery<T = any>(query: string, variables?: any) {
    const res = await fetch(this.subqueryUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify({ query, variables }),
    })
    const { data, errors } = await res.json()
    if (errors?.length) throw errors
    return data as T
  }

  getSubqueryObservable<T = any>(query: string, variables?: any, optional = true) {
    const $ = fromFetch<T | null>(this.subqueryUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify({ query, variables }),
      selector: async (res) => {
        const { data, errors } = await res.json()
        if (errors?.length) {
          if (optional) return null
          throw errors
        }
        return data as T
      },
    })
    if (optional) {
      return $.pipe(
        startWith(null),
        catchError(() => of(null))
      )
    }

    return $
  }

  getMetadataObservable<T = any>(url: string, optional = true) {
    if (new URL(url)?.hostname !== new URL(this.config.metadataHost).hostname) {
      console.warn('Invalid url')
      return from([])
    }
    const $ = fromFetch(url)
    if (optional) {
      return $.pipe(
        startWith(null),
        catchError(() => of(null)),
        switchMap((res) => {
          return from(res?.json() || []) as Observable<T>
        })
      )
    }

    return $.pipe(
      switchMap((res) => {
        return from(res.json()) as Observable<T>
      })
    )
  }

  getBlockEvents() {
    return from(this.getCachedParachainUrl()).pipe(
      switchMap((url) => {
        if (blockEvents[url]) return blockEvents[url]
        const $api = this.getApi()

        return (blockEvents[url] = $api.pipe(
          switchMap((api) =>
            api.queryMulti([api.query.system.events, api.query.system.number]).pipe(
              bufferCount(2, 1),
              filter(([[events]]) => !!(events as any)?.length),
              map(([[events]]) => events as any)
            )
          ),
          share()
        ))
      })
    )
  }

  async getTxCompletedEvents() {
    const parachainUrl = await this.getCachedParachainUrl()
    return txCompletedEvents[parachainUrl] || (txCompletedEvents[parachainUrl] = new Subject<EventRecord[]>())
  }

  getEvents() {
    return this.getBlockEvents().pipe(
      mergeWith(from(this.getTxCompletedEvents()).pipe(mergeAll())),
      combineLatestWith(this.getApi()),
      map(([events, api]) => ({ events, api }))
    )
  }

  getApi() {
    return from(this.getCachedParachainUrl()).pipe(
      switchMap((parachainUrl) =>
        getPolkadotApi(parachainUrl, parachainTypes, parachainRpcMethods, parachainRuntimeApi)
      )
    )
  }

  getApiPromise() {
    return this.getCachedParachainUrl().then((parachainUrl) =>
      firstValueFrom(getPolkadotApi(parachainUrl, parachainTypes, parachainRpcMethods, parachainRuntimeApi))
    )
  }

  getRelayChainApi() {
    return getPolkadotApi(this.relayChainUrl, relayChainTypes)
  }

  getRelayChainApiPromise() {
    return firstValueFrom(getPolkadotApi(this.relayChainUrl, relayChainTypes))
  }

  getBlocks(): Observable<SignedBlock> {
    const $api = this.getApi()
    // subscribes to all incoming headers
    const $header = $api.pipe(switchMap((api) => api.rpc.chain.subscribeNewHeads()))
    return combineLatest([$api, $header]).pipe(
      switchMap(([api, header]) => {
        return api.rpc.chain.getBlock(header.hash.toHex())
      })
    )
  }

  getBlockByBlockNumber(blockNumber: number): Observable<SignedBlock> {
    const $api = this.getApi()
    const $hash = $api.pipe(switchMap((api) => api.rpc.chain.getBlockHash(blockNumber)))
    return combineLatest([$api, $hash]).pipe(
      switchMap(([api, hashByBlockNumber]) => {
        return api.rpc.chain.getBlock(hashByBlockNumber?.toHex())
      })
    )
  }

  getEventsByBlockNumber(blockNumber: number) {
    const $api = this.getApi()
    const $hash = $api.pipe(switchMap((api) => api.rpc.chain.getBlockHash(blockNumber)))
    return combineLatest([$api, $hash]).pipe(
      switchMap(([api, hashByBlockNumber]) => {
        return api.query.system.events.at(hashByBlockNumber)
      })
    )
  }

  getSigner() {
    const { signer, signingAddress } = this.config
    if (!signingAddress || ((typeof signingAddress === 'string' || !('sign' in signingAddress)) && !signer)) {
      throw new Error('No signer set')
    }
    return {
      signer,
      signingAddress,
    }
  }

  getSignerAddress(type?: 'substrate' | 'evm') {
    const { signingAddress, evmSigningAddress } = this.config

    if (type === 'evm') {
      if (!evmSigningAddress) throw new Error('no signer set')
      return evmSigningAddress
    }
    if (!signingAddress) {
      if (evmSigningAddress) {
        if (type === 'substrate' && !this.config.substrateEvmChainId) throw new Error('no signer set')
        return type === 'substrate'
          ? evmToSubstrateAddress(evmSigningAddress, this.config.substrateEvmChainId!)
          : evmSigningAddress
      }
      throw new Error('no signer set')
    }

    if (typeof signingAddress !== 'string' && 'address' in signingAddress) {
      return signingAddress.address
    }

    return signingAddress as string
  }

  getActingAddress(txOptions?: TransactionOptions) {
    if (txOptions?.proxies) {
      const proxy = txOptions.proxies.at(-1)!
      return typeof proxy === 'string' ? proxy : proxy[0]
    }

    if (txOptions?.multisig) {
      return computeMultisig(txOptions.multisig).address
    }

    return this.getSignerAddress('substrate')
  }

  setProxies(proxies: Config['proxies']) {
    this.config.proxies = proxies
  }

  clearProxies() {
    this.config.proxies = undefined
  }
}

export function wrapProxyCalls(
  api: ApiRx,
  tx: SubmittableExtrinsic<'rxjs'>,
  proxies: Exclude<Config['proxies'], undefined>
) {
  const mapped = proxies.map((p) => (Array.isArray(p) ? p : ([p, undefined] as const)))
  return mapped.reduceRight(
    (acc, [delegator, forceProxyType]) => api.tx.proxy.proxy(delegator, forceProxyType, acc),
    tx
  )
}
