import { ApiPromise } from '@polkadot/api'
import { AddressOrPair, SubmittableExtrinsic } from '@polkadot/api/types'
import { ISubmittableResult, Signer } from '@polkadot/types/types'
import { TransactionOptions } from './types'
import { getPolkadotApi } from './utils/web3'

export type Config = {
  network: 'altair' | 'centrifuge'
  centrifugeWsUrl: string
  altairWsUrl: string
  polkadotWsUrl: string
  kusamaWsUrl: string
  signer?: Signer
  signingAddress?: AddressOrPair
  printExtrinsics?: boolean
}

export type UserProvidedConfig = Partial<Config>

const defaultConfig: Config = {
  network: 'centrifuge',
  centrifugeWsUrl: 'wss://fullnode.centrifuge.io',
  altairWsUrl: 'wss://fullnode.altair.centrifuge.io',
  polkadotWsUrl: 'wss://rpc.polkadot.io',
  kusamaWsUrl: 'wss://kusama-rpc.polkadot.io',
}

const relayChainTypes = {}

const parachainTypes = {
  // NFTs
  ClassId: 'u64',
  InstanceId: 'u128',
}

export class CentrifugeBase {
  config: Config
  parachainUrl: string
  relayChainUrl: string

  constructor(config: UserProvidedConfig = {}) {
    this.config = { ...defaultConfig, ...config }
    this.parachainUrl = this.config.network === 'centrifuge' ? this.config.centrifugeWsUrl : this.config.altairWsUrl
    this.relayChainUrl = this.config.network === 'centrifuge' ? this.config.polkadotWsUrl : this.config.kusamaWsUrl
  }

  wrapSignAndSend<T extends TransactionOptions>(
    api: ApiPromise,
    submittable: SubmittableExtrinsic<'promise'>,
    options?: T
  ) {
    if (options?.batch) return submittable

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
    // eslint-disable-next-line no-async-promise-executor
    return new Promise<ISubmittableResult>(async (resolve, reject) => {
      try {
        const unsub = await submittable.signAndSend(signingAddress, { signer }, (result) => {
          options?.onStatusChange?.(result)
          const errors = result.events.filter(({ event }) => api.events.system.ExtrinsicFailed.is(event))

          if (result.dispatchError || errors.length) {
            if (this.config.printExtrinsics) {
              console.log(`=> ${result.dispatchError?.toString()}`)
            }
            reject(result)
          } else if (result.status.isInBlock || result.status.isFinalized) {
            resolve(result)
          }
          if (result.status.isFinalized) {
            unsub()
          }
        })
      } catch (e) {
        reject(e)
      }
    })
  }

  getVersionSpec(api: ApiPromise) {
    return api.query.system.lastRuntimeUpgrade()
  }

  getApi() {
    return getPolkadotApi(this.parachainUrl, parachainTypes)
  }

  getRelayChainApi() {
    return getPolkadotApi(this.relayChainUrl, relayChainTypes)
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

    return signingAddress
  }
}
