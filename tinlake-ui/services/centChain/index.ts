import { ApiPromise, WsProvider } from '@polkadot/api'
import { InjectedAccountWithMeta } from '@polkadot/extension-inject/types'
import config from '../../config'

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
    this._api = await ApiPromise.create({ provider: wsProvider })
    // const keyring = new Keyring({ type: 'sr25519' })
    // const alice = keyring.addFromUri('//Alice')
    // try {
    //   console.log('waiting')
    //   await storeProofRoot(api, alice, hexToU8a('0xb86441971a590bb28da204c422f8f90e5bdbe4eed7149c489be23b534f8eff6b'))
    //   console.log('done waiting')
    // } finally {
    //   await wsProvider.disconnect()
    // }
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
}

let _centChainService: CentChain | null = null

// centChainService returns a singleton of CentChain for convenience
export function centChainService() {
  if (_centChainService === null) {
    _centChainService = new CentChain(config.centrifugeChainUrl)
  }
  return _centChainService
}
