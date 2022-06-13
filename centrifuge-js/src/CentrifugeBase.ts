import { ApiRx } from '@polkadot/api'
import { AddressOrPair, SubmittableExtrinsic } from '@polkadot/api/types'
import { Codec, IEventRecord, Signer } from '@polkadot/types/types'
import 'isomorphic-fetch'
import {
  bufferCount,
  catchError,
  filter,
  firstValueFrom,
  map,
  Observable,
  of,
  share,
  startWith,
  Subject,
  switchMap,
  takeWhile,
  tap,
  throwError,
} from 'rxjs'
import { fromFetch } from 'rxjs/fetch'
import { TransactionOptions } from './types'
import { getPolkadotApi } from './utils/web3'

export type Config = {
  network: 'altair' | 'centrifuge'
  centrifugeWsUrl: string
  altairWsUrl: string
  polkadotWsUrl: string
  kusamaWsUrl: string
  centrifugeSubqueryUrl: string
  altairSubqueryUrl: string
  signer?: Signer
  signingAddress?: AddressOrPair
  printExtrinsics?: boolean
  proxy?: string
  debug?: boolean
}

export type UserProvidedConfig = Partial<Config>

const defaultConfig: Config = {
  network: 'centrifuge',
  centrifugeWsUrl: 'wss://fullnode.centrifuge.io',
  altairWsUrl: 'wss://fullnode.altair.centrifuge.io',
  polkadotWsUrl: 'wss://rpc.polkadot.io',
  kusamaWsUrl: 'wss://kusama-rpc.polkadot.io',
  centrifugeSubqueryUrl: 'https://api.subquery.network/sq/centrifuge/pools',
  altairSubqueryUrl: 'https://api.subquery.network/sq/centrifuge/pools__Y2Vud',
}

const relayChainTypes = {}

const parachainTypes = {
  // NFTs
  ClassId: 'u64',
  InstanceId: 'u128',
}

export const $txCompleted = new Subject<void>()

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
    if (options?.paymentInfo) {
      return submittable.paymentInfo(options.paymentInfo)
    }
    try {
      let actualSubmittable = submittable
      if (this.config.proxy) {
        actualSubmittable = api.tx.proxy.proxy(this.config.proxy, undefined, submittable)
      }
      return actualSubmittable.signAndSend(signingAddress, { signer }).pipe(
        tap((result) => {
          options?.onStatusChange?.(result)
          if (result.status.isInBlock) $txCompleted.next()
        }),
        takeWhile((result) => {
          const errors = result.events.filter(({ event }) => api.events.system.ExtrinsicFailed.is(event))
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

  _$blockEvents: null | Observable<{ api: ApiRx; events: (IEventRecord<any> & Codec)[] }> = null

  getBlockEvents() {
    if (this._$blockEvents) return this._$blockEvents
    const $api = this.getApi()

    return (this._$blockEvents = $api.pipe(
      switchMap((api) =>
        api.queryMulti([api.query.system.events, api.query.system.number]).pipe(
          bufferCount(2, 1), // Delay the events by one block, to make sure storage has been updated
          filter(([[events]]) => !!(events as any)?.length),
          map(([[events]]) => ({ api, events: events as any }))
        )
      ),
      share()
    ))
  }

  getApi() {
    return getPolkadotApi(this.parachainUrl, parachainTypes)
  }

  getApiPromise() {
    return firstValueFrom(getPolkadotApi(this.parachainUrl, parachainTypes))
  }

  getRelayChainApi() {
    return getPolkadotApi(this.relayChainUrl, relayChainTypes)
  }

  getRelayChainApiPromise() {
    return firstValueFrom(getPolkadotApi(this.relayChainUrl, relayChainTypes))
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
