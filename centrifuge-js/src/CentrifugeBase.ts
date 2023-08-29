import type { JsonRpcSigner, TransactionRequest } from '@ethersproject/providers'
import { ApiRx } from '@polkadot/api'
import { AddressOrPair, SubmittableExtrinsic } from '@polkadot/api/types'
import { SignedBlock } from '@polkadot/types/interfaces'
import { DefinitionRpc, DefinitionsCall, ISubmittableResult, Signer } from '@polkadot/types/types'
import { hexToBn } from '@polkadot/util'
import { sortAddresses } from '@polkadot/util-crypto'
import 'isomorphic-fetch'
import {
  bufferCount,
  catchError,
  combineLatest,
  combineLatestWith,
  filter,
  firstValueFrom,
  from,
  map,
  mergeWith,
  Observable,
  of,
  share,
  startWith,
  Subject,
  switchMap,
  take,
  takeWhile,
  tap,
  throwError,
} from 'rxjs'
import { fromFetch } from 'rxjs/fetch'
import { TransactionOptions } from './types'
import { computeMultisig, evmToSubstrateAddress, isSameAddress } from './utils'
import { CurrencyBalance } from './utils/BN'
import { getPolkadotApi } from './utils/web3'

type ProxyType = string

const EVM_DISPATCH_PRECOMPILE = '0x0000000000000000000000000000000000000401'
const EVM_DISPATCH_OVERHEAD_GAS = 50_000

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
  metadataHost: 'https://altair.mypinata.cloud',
}

const relayChainTypes = {}

const parachainTypes = {
  // NFTs
  ClassId: 'u64',
  InstanceId: 'u128',
  // Crowdloan
  RootHashOf: 'Hash',
  TrieIndex: 'u32',
  RelayChainAccountId: 'AccountId',
  ParachainAccountIdOf: 'AccountId',
  Proof: {
    leafHash: 'Hash',
    sortedHashes: 'Vec<Hash>',
  },
  PoolId: 'u64',
  TrancheId: '[u8; 16]',
  RewardDomain: {
    _enum: ['Block', 'Liquidity'],
  },
  StakingCurrency: {
    _enum: ['BlockRewards'],
  },
  CurrencyId: {
    _enum: {
      Native: 'Native',
      Tranche: '(PoolId, TrancheId)',
      KSM: 'KSM',
      AUSD: 'AUSD',
      ForeignAsset: 'u32',
      Staking: 'StakingCurrency',
    },
  },
}

const parachainRpcMethods: Record<string, Record<string, DefinitionRpc>> = {
  pools: {
    trancheTokenPrices: {
      description: 'Retrieve prices for all tranches',
      params: [
        {
          name: 'pool_id',
          type: 'u64',
        },
      ],
      type: 'Vec<u128>',
    },
  },
  rewards: {
    listCurrencies: {
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
      type: 'Vec<CurrencyId>',
    },
    computeReward: {
      description: 'Compute the claimable reward for the given triplet of domain, currency and account',
      params: [
        {
          name: 'domain',
          type: 'RewardDomain',
        },
        {
          name: 'currency_id',
          type: 'CurrencyId',
        },
        {
          name: 'account_id',
          type: 'AccountId',
        },
      ],
      type: 'Option<Balance>',
    },
  },
}

const parachainRuntimeApi: DefinitionsCall = {
  PoolsApi: [
    {
      // Runtime API calls must be in snake case (as defined in rust)
      // However, RPCs are usually in camel case
      methods: {
        tranche_token_prices: parachainRpcMethods.pools.trancheTokenPrices,
      },
      version: 1,
    },
  ],
  RewardsApi: [
    {
      // Runtime API calls must be in snake case (as defined in rust)
      // However, RPCs are usually in camel case
      methods: {
        compute_reward: parachainRpcMethods.rewards.computeReward,
        list_currencies: parachainRpcMethods.rewards.listCurrencies,
      },
      version: 1,
    },
  ],
}

type Events = ISubmittableResult['events']

const txCompletedEvents: Record<string, Subject<Events>> = {}
const blockEvents: Record<string, Observable<Events>> = {}

export class CentrifugeBase {
  config: Config
  parachainUrl: string
  relayChainUrl: string
  subqueryUrl: string

  constructor(config: UserProvidedConfig = {}) {
    this.config = { ...defaultConfig, ...config }
    this.parachainUrl = this.config.network === 'centrifuge' ? this.config.centrifugeWsUrl : this.config.altairWsUrl
    this.relayChainUrl = this.config.network === 'centrifuge' ? this.config.polkadotWsUrl : this.config.kusamaWsUrl
    this.subqueryUrl =
      this.config.network === 'centrifuge' ? this.config.centrifugeSubqueryUrl : this.config.altairSubqueryUrl
  }

  async getChainId() {
    return this.getApiPromise().then((api) => api.registry.chainSS58 as number)
  }

  wrapSignAndSend<T extends TransactionOptions>(api: ApiRx, submittable: SubmittableExtrinsic<'rxjs'>, options?: T) {
    const isEvmTx = this.config.evmSigner && !this.config.signer
    let actualSubmittable = submittable

    if (options?.batch) return of(actualSubmittable)

    const proxies = (options?.proxies || this.config.proxies)?.map((p) =>
      Array.isArray(p) ? p : ([p, undefined] as const)
    )

    let transferTx
    if (options?.transferToActingAccount && (options?.multisig || proxies)) {
      const multi = options?.multisig && computeMultisig(options.multisig)
      transferTx = api.tx.balances.transfer(proxies?.at(-1)?.[0] || multi?.address, options.transferToActingAccount)
    }

    if (proxies && !options?.sendOnly) {
      actualSubmittable = proxies.reduceRight(
        (acc, [delegator, forceProxyType]) => api.tx.proxy.proxy(delegator, forceProxyType, acc),
        actualSubmittable
      )
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
      const $balances = api.query.system.account(signingAddress)

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
          switchMap(() => actualSubmittable.signAsync(signingAddress, { signer, era: options?.era }))
        )
      }

      return (
        options?.sendOnly
          ? actualSubmittable.send()
          : $checkBalance.pipe(
              switchMap(() => actualSubmittable.signAndSend(signingAddress, { signer, era: options?.era }))
            )
      ).pipe(
        tap((result) => {
          options?.onStatusChange?.(result)
          if (result.status.isInBlock) this.getTxCompletedEvents().next(result.events)
        }),
        takeWhile((result) => {
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
          const hasError = !!(result.dispatchError || errors.length)

          return !result.status.isInBlock && !hasError
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
        const gas = Math.ceil(weight / 20_000) + EVM_DISPATCH_OVERHEAD_GAS
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
              catchError(() => of([{ ...response, error: new Error('failed') }] as const)),
              tap(([result, receipt]) => {
                if ('error' in result || receipt?.status === 0) {
                  options?.onStatusChange?.({
                    events: [],
                    dispatchError: {},
                    status: {
                      hash: { toHex: () => result.hash as any },
                    },
                  } as any)
                } else {
                  options?.onStatusChange?.({
                    events: [],
                    status: {
                      isInBlock: receipt?.status === 1,
                      isFinalized: receipt?.status === 1,
                      hash: { toHex: () => result.hash as any },
                    },
                  } as any)
                }
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
    if (blockEvents[this.parachainUrl]) return blockEvents[this.parachainUrl]
    const $api = this.getApi()

    return (blockEvents[this.parachainUrl] = $api.pipe(
      switchMap((api) =>
        api.queryMulti([api.query.system.events, api.query.system.number]).pipe(
          bufferCount(2, 1), // Delay the events by one block, to make sure storage has been updated
          filter(([[events]]) => !!(events as any)?.length),
          map(([[events]]) => events as any)
        )
      ),
      share()
    ))
  }

  getTxCompletedEvents() {
    return txCompletedEvents[this.parachainUrl] || (txCompletedEvents[this.parachainUrl] = new Subject())
  }

  getEvents() {
    return this.getBlockEvents().pipe(
      mergeWith(this.getTxCompletedEvents()),
      combineLatestWith(this.getApi()),
      map(([events, api]) => ({ events, api }))
    )
  }

  getApi() {
    return getPolkadotApi(this.parachainUrl, parachainTypes, parachainRpcMethods, parachainRuntimeApi)
  }

  getApiPromise() {
    return firstValueFrom(getPolkadotApi(this.parachainUrl, parachainTypes, parachainRpcMethods, parachainRuntimeApi))
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

  getSignerAddress(type?: 'substrate') {
    const { signingAddress, evmSigningAddress } = this.config

    if (!signingAddress) {
      if (evmSigningAddress && this.config.substrateEvmChainId) {
        return type === 'substrate'
          ? evmToSubstrateAddress(evmSigningAddress, this.config.substrateEvmChainId)
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
