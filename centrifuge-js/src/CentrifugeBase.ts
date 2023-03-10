import type { JsonRpcSigner } from '@ethersproject/providers'
import { ApiRx } from '@polkadot/api'
import { AddressOrPair, SubmittableExtrinsic } from '@polkadot/api/types'
import { SignedBlock } from '@polkadot/types/interfaces'
import { ISubmittableResult, Signer } from '@polkadot/types/types'
import { hexToBn } from '@polkadot/util'
import 'isomorphic-fetch'
import {
  bufferCount,
  catchError,
  combineLatest,
  combineLatestWith,
  filter,
  firstValueFrom,
  from,
  lastValueFrom,
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
import { CurrencyBalance } from './utils/BN'
import { getPolkadotApi } from './utils/web3'

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
  unpinFile?: (hash: string) => Promise<void>
  signer?: Signer
  signingAddress?: AddressOrPair
  evmSigner?: JsonRpcSigner
  printExtrinsics?: boolean
  proxy?: string
  debug?: boolean
}

export type UserProvidedConfig = Partial<Config>

export type PaymentInfo = {
  class: string
  partialFee: number | CurrencyBalance
  weight: number
}

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
}

const parachainRpcMethods = {
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

  getChainId() {
    return this.config.network === 'centrifuge' ? 36 : 136
  }

  wrapSignAndSend<T extends TransactionOptions>(api: ApiRx, submittable: SubmittableExtrinsic<'rxjs'>, options?: T) {
    if (options?.batch) return of(submittable)

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

    const { signer, signingAddress } = this.getSigner()

    try {
      let actualSubmittable = submittable
      if (this.config.proxy && !options?.sendOnly) {
        actualSubmittable = api.tx.proxy.proxy(this.config.proxy, undefined, submittable)
      }

      const $paymentInfo = submittable.paymentInfo(signingAddress)
      const $balances = api.query.system.account(signingAddress)

      if (options?.paymentInfo) {
        return lastValueFrom(
          $paymentInfo.pipe(
            map((paymentInfoRaw) => {
              const paymentInfo = paymentInfoRaw.toJSON() as PaymentInfo
              return {
                ...paymentInfo,
                partialFee: new CurrencyBalance(paymentInfo.partialFee, api.registry.chainDecimals[0]),
              }
            })
          )
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
    return getPolkadotApi(this.parachainUrl, parachainTypes, parachainRpcMethods)
  }

  getApiPromise() {
    return firstValueFrom(getPolkadotApi(this.parachainUrl, parachainTypes, parachainRpcMethods))
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

  getSignerAddress() {
    const { signingAddress } = this.getSigner()

    if (typeof signingAddress !== 'string' && 'address' in signingAddress) {
      return signingAddress.address
    }

    return signingAddress as string
  }

  setProxy(proxyAccount: string) {
    this.config.proxy = proxyAccount
  }

  clearProxy() {
    this.config.proxy = undefined
  }
}
