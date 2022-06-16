import { ApiPromise, WsProvider } from '@polkadot/api'
import { InjectedAccountWithMeta } from '@polkadot/extension-inject/types'
import config from '../../config'
import { accountIdToCentChainAddr } from './accountIdToCentChainAddr'
import { centChainAddrToAccountId } from './centChainAddrToAccountId'
import { types } from './types'

// const { Keyring } = require('@polkadot/keyring')

// TODO: generate types https://polkadot.js.org/docs/api/examples/promise/typegen

export class CentChain {
  private _api: ApiPromise | null = null
  private _unsubscribe: null | (() => void) = null

  constructor(public readonly url: string) {}

  public async connect(onAccountsChange: (accounts: InjectedAccountWithMeta[]) => void) {
    const { web3AccountsSubscribe, web3Enable } = await import('@polkadot/extension-dapp')

    // this call fires up the authorization popup
    const extensions = await web3Enable('Tinlake')
    if (extensions.length === 0) {
      // no extension installed, or the user did not accept the authorization
      // in this case we should inform the use and give a link to the extension
      throw new Error('No extension or not authorized')
    }
    // we are now informed that the user has at least one extension and that we
    // will be able to show and use accounts
    // we subscribe to any account change and log the new list.
    // note that `web3AccountsSubscribe` returns the function to unsubscribe
    this._unsubscribe = await web3AccountsSubscribe(onAccountsChange)
  }

  public async disconnect() {
    // don't forget to unsubscribe when needed, e.g when unmounting a component
    if (this._unsubscribe) {
      this._unsubscribe()
    }
  }

  public async init() {
    const wsProvider = new WsProvider(this.url)
    this._api = await ApiPromise.create({ types, provider: wsProvider })
  }

  async api(): Promise<ApiPromise> {
    if (!this._api) {
      await this.init()
    }
    return this._api!
  }

  public async account(accountId: string) {
    return await (await this.api()).query.system.account(accountId)
  }

  public async claimedCFGRewards(addr: string) {
    const claimed = await (await this.api()).query.claims.claimedAmounts(centChainAddrToAccountId(addr))
    return claimed
  }

  /**
   *
   * @param claimerAccountID ID of Centrifuge Chain account that should receive the rewards
   * @param amount amount that should be received
   * @param proof proof for the given claimer and amount
   * @returns txHash string
   */
  public async claimCFGRewards(claimerAccountID: string, amount: string, proof: Uint8Array[]): Promise<string> {
    const { web3FromAddress } = await import('@polkadot/extension-dapp')

    const address = accountIdToCentChainAddr(claimerAccountID)

    const injector = await web3FromAddress(address)

    // eslint-disable-next-line no-async-promise-executor
    return new Promise(async (resolve, reject) => {
      const api = await this.api()
      const extrinsic = api.tx.claims.claim(claimerAccountID, amount, proof)
      await extrinsic
        .signAndSend(address, { signer: injector.signer }, ({ status, dispatchError }) => {
          // status would still be set, but in the case of error we can shortcut
          // to just check it (so an error would indicate InBlock or Finalized)
          if (dispatchError) {
            if (dispatchError.isModule) {
              // for module errors, we have the section indexed, lookup
              const decoded = api.registry.findMetaError(dispatchError.asModule)
              const { docs, name, section } = decoded
              reject(`claim error name: ${section}.${name}: ${docs.join(' ')}`)
              return
            }
            // Other, CannotLookup, BadOrigin, no extra info
            reject(`claim error other: ${dispatchError.toString()}`)
            return
          }

          if (status.isFinalized) {
            resolve(extrinsic.hash.toHex())
            return
          }

          if (status.isBroadcast) {
            console.log(`claim broadcast at block hash #${status.asBroadcast.toString()}`)
          } else {
            console.log(`claim status: ${status.type}`)
          }
        })
        .catch((error: any) => {
          reject(`claim transaction failed: ${error}`)
        })
    })
  }
}

let _centChainService: CentChain | null = null

// centChainService returns a singleton of CentChain for convenience
export function centChainService() {
  if (_centChainService === null) {
    _centChainService = new CentChain(config.centrifugeChainUrl)
  }
  return _centChainService
}
