import { ApiPromise, WsProvider } from '@polkadot/api'
import { Signer } from '@polkadot/api/types'
import { InjectedAccountWithMeta } from '@polkadot/extension-inject/types'
import config from '../../config'
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
    this._api = await ApiPromise.create({ provider: wsProvider, types })
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

  public async claimedRADRewards(addr: string) {
    const claimed = await (await this.api()).query.radClaims.accountBalances(centChainAddrToAccountId(addr))
    console.log('received claimed rewards', { addr, claimed: claimed.toHuman() })
    return claimed
  }

  public claimRADRewards(
    claimer: { addr: string; signer: Signer },
    amount: string,
    sorted_hashes: string[]
  ): Promise<void> {
    return new Promise(async (resolve, reject) => {
      const api = await this.api()
      const extrinsic = await api.tx.radClaims.claim(centChainAddrToAccountId(claimer.addr), amount, sorted_hashes)
      extrinsic
        .signAndSend(claimer.addr, { signer: claimer.signer }, ({ status, dispatchError }) => {
          // status would still be set, but in the case of error we can shortcut
          // to just check it (so an error would indicate InBlock or Finalized)
          if (dispatchError) {
            if (dispatchError.isModule) {
              // for module errors, we have the section indexed, lookup
              const decoded = api.registry.findMetaError(dispatchError.asModule)
              const { documentation, name, section } = decoded

              console.log(`error, rejecting with: ${section}.${name}: ${documentation.join(' ')}`)
              reject(`${section}.${name}: ${documentation.join(' ')}`)
              return
            } else {
              // Other, CannotLookup, BadOrigin, no extra info
              console.log(`error, rejecting with: ${dispatchError.toString()}`)
              reject(dispatchError.toString())
              return
            }
          }

          if (status.isBroadcast) {
            console.log(`Finalized at block hash #${status.asBroadcast.toString()}`)
            resolve()
            return
          } else {
            console.log(`Current status: ${status.type}`)
          }
        })
        .catch((error: any) => {
          console.log(':( transaction failed', error)
          reject(':( transaction failed')
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
