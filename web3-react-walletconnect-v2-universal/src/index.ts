import type UniversalProvider from '@walletconnect/universal-provider'
import type { NamespaceConfig } from '@walletconnect/universal-provider'
import { getAccountsFromNamespaces, getChainsFromNamespaces } from '@walletconnect/utils'
import type { ProviderRpcError } from '@web3-react/types'
import { Connector } from '@web3-react/types'
import type { Web3Modal } from '@web3modal/standalone'
import EventEmitter3 from 'eventemitter3'
import type { StoreApi } from 'zustand'

export const URI_AVAILABLE = 'URI_AVAILABLE'
const DEFAULT_TIMEOUT = 5000

export type Web3ReactMultichainState = {
  chainId: string | undefined
  accounts: string[] | undefined
  activating: boolean
}

export type Web3ReactMultichainStore = StoreApi<Web3ReactMultichainState>
export declare type Web3ReactMultichainStateUpdate =
  | {
      chainId: string
      accounts: string[]
    }
  | {
      chainId: string
      accounts?: never
    }
  | {
      chainId?: never
      accounts: string[]
    }
export type MultichainActions = {
  startActivation: () => () => void
  update: (stateUpdate: Web3ReactMultichainStateUpdate) => void
  resetState: () => void
}
/**
 * Options to configure the WalletConnect provider.
 */
export type WalletConnectOptions = Parameters<typeof UniversalProvider.init>[0] & {
  // namespaces: NamespaceConfig
  // optionalNamespaces?: NamespaceConfig
}

/**
 * Options to configure the WalletConnect connector.
 */
export interface WalletConnectConstructorArgs {
  actions: MultichainActions
  store: Web3ReactMultichainStore
  chains: string[]
  rpcMap: { eip155?: Record<string, string>; polkadot?: Record<string, string> }
  /** Options to pass to `@walletconnect/ethereum-provider`. */
  options: WalletConnectOptions
  /** The chainId to connect to in activate if one is not provided. */
  defaultChainId?: string
  /**
   * @param timeout - Timeout, in milliseconds, after which to treat network calls to urls as failed when selecting
   * online urls.
   */
  timeout?: number
  /**
   * @param onError - Handler to report errors thrown from WalletConnect.
   */
  onError?: (error: Error) => void
}

export class WalletConnect extends Connector {
  /** {@inheritdoc Connector.provider} */
  // @ts-expect-error
  public provider?: UniversalProvider
  public readonly events = new EventEmitter3()
  private modal?: Web3Modal
  private store: Web3ReactMultichainStore
  private chains: Record<string, string[]>
  // @ts-expect-error
  private override actions: MultichainActions

  private readonly options: Omit<WalletConnectOptions, keyof Parameters<UniversalProvider['connect']>[0]>

  private readonly rpcMap?: { eip155?: Record<string, string>; polkadot?: Record<string, string> }
  private readonly connectOptions: Parameters<UniversalProvider['connect']>[0]
  private readonly defaultChainId?: string
  private readonly timeout: number

  private eagerConnection?: Promise<UniversalProvider>

  constructor({
    actions,
    store,
    options,
    chains,
    defaultChainId,
    timeout = DEFAULT_TIMEOUT,
    onError,
  }: WalletConnectConstructorArgs) {
    super(actions as any, onError)
    this.actions = actions

    const { ...rest } = options

    this.options = rest
    this.connectOptions = {}
    this.chains = { eip155: [], polkadot: [] }
    chains.forEach((chain) => {
      const key = chain.split(':')[0]
      if (this.chains[key]) this.chains[key].push(chain)
      else this.chains[key] = [chain]
    })
    this.defaultChainId = defaultChainId
    this.timeout = timeout
    this.store = store
  }

  private disconnectListener = (error: ProviderRpcError) => {
    this.actions.resetState()
    if (error) this.onError?.(error)
  }

  private chainChangedListener = (chainId: string): void => {
    console.log('chainId', chainId)
    // this.actions.update({ chainId: Number.parseInt(chainId, 16) })
  }

  private accountsChangedListener = (accounts: string[]): void => {
    console.log('accounts', accounts)
    // this.actions.update({ accounts })
  }

  // eslint-disable-next-line
  private URIListener = (uri: string): void => {
    console.log('uri', uri)
    this.modal?.closeModal()
    this.modal?.openModal({ uri })
    this.events.emit(URI_AVAILABLE, uri)
  }

  private isomorphicInitialize(): Promise<UniversalProvider> {
    if (this.eagerConnection) return this.eagerConnection

    // const rpcMap = this.rpcMap ? getBestUrlMap(this.rpcMap, this.timeout) : undefined
    // const chains = desiredChainId ? getChainsWithDefault(this.chains, desiredChainId) : this.chains

    return (this.eagerConnection = Promise.all([
      import('@walletconnect/universal-provider'),
      import('@web3modal/standalone'),
    ]).then(async ([uniProviderModule, { Web3Modal }]) => {
      const provider = (this.provider = await uniProviderModule.default.init({
        ...this.options,
      }))

      this.modal = new Web3Modal({
        projectId: this.options.projectId!,
        walletConnectVersion: 2,
      })

      console.log('provider', provider)

      // await session approval from the wallet app
      // const walletConnectSession = await approval()

      // Subscribe to session ping
      provider.on('session_ping', ({ id, topic }: any) => {
        console.log('session_ping', id, topic)
      })

      // Subscribe to session event
      provider.on('session_event', ({ event, chainId }: any) => {
        console.log('session_event', event, chainId)
      })

      // Subscribe to session update
      provider.on('session_update', ({ topic, params }: any) => {
        console.log('session_update', topic, params)
      })

      // Subscribe to session delete
      provider.on('session_delete', ({ id, topic }: any) => {
        console.log('session_delete', id, topic)
      })

      provider.on('disconnect', this.disconnectListener)
      provider.on('chainChanged', this.chainChangedListener)
      provider.on('accountsChanged', this.accountsChangedListener)
      provider.on('display_uri', this.URIListener)
      return provider
    }))
  }

  /** {@inheritdoc Connector.connectEagerly} */
  public async connectEagerly(): Promise<void> {
    const cancelActivation = this.actions.startActivation()

    try {
      const provider = await this.isomorphicInitialize()
      // WalletConnect automatically persists and restores active sessions
      if (!provider.session) {
        throw new Error('No active session found. Connect your wallet first.')
      }

      const chainId = getIdealChainId(provider.session)
      const accounts = getAccountsFromNamespaces(provider.session.namespaces)
        .filter((addr) => addr.startsWith(chainId))
        .map((addr) => addr.slice(chainId.length + 1))

      if (!chainId || !accounts?.length) throw new Error('No accounts found')

      this.actions.update({
        chainId,
        accounts,
      })
    } catch (error) {
      await this.deactivate()
      cancelActivation()
      throw error
    }
  }

  /**
   * @param desiredChainId - The desired CAIP-2-compatible chainId to connect to.
   */
  public async activate(desiredChainId?: string | string[]): Promise<void> {
    const provider = await this.isomorphicInitialize()
    const desiredChainIds = Array.isArray(desiredChainId) ? desiredChainId : desiredChainId ? [desiredChainId] : []

    if (provider.session) {
      const connectedTo = this.store.getState().chainId as any as string
      if (!desiredChainId || desiredChainIds.includes(connectedTo)) return
      const bestMatchChainId = getIdealChainId(provider.session, desiredChainIds)
      const isConnectedToDesiredChain = desiredChainIds.includes(bestMatchChainId)
      if (!isConnectedToDesiredChain) {
        throw new Error(`Cannot activate a chain (${desiredChainId}), as the wallet is not connected to it.`)
      }
      this.actions.update({ chainId: bestMatchChainId })
      // return provider.request<void>(
      //   {
      //     method: 'wallet_switchEthereumChain',
      //     params: [{ chainId: `0x${bestMatchChainId.toString(16)}` }],
      //   },
      //   bestMatchChainId
      // )
      return
    }

    const cancelActivation = this.actions.startActivation()

    try {
      const eip155OptionalChains = new Set(this.chains.eip155)
      const polkadotOptionalChains = new Set(this.chains.polkadot)
      const namespaces: NamespaceConfig = {}
      desiredChainIds.forEach((cid) => {
        if (cid.startsWith('eip155')) {
          if ('eip155' in namespaces) {
            namespaces.eip155.chains.push(cid)
          } else {
            namespaces.eip155 = {
              methods: ['eth_sendTransaction', 'eth_signTransaction', 'get_balance', 'personal_sign'],
              chains: [cid],
              events: ['chainChanged', 'accountsChanged'],
              rpcMap: this.rpcMap?.eip155,
            }
          }
          eip155OptionalChains.delete(cid)
        } else if (cid.startsWith('polkadot')) {
          if ('polkadot' in namespaces) {
            namespaces.polkadot.chains.push(cid)
          } else {
            namespaces.polkadot = {
              methods: ['polkadot_signTransaction', 'polkadot_signMessage'],
              chains: [cid],
              events: ['chainChanged", "accountsChanged'],
              rpcMap: this.rpcMap?.polkadot,
            }
          }
          polkadotOptionalChains.delete(cid)
        }
      })
      // const params = {
      //   namespaces,
      //   optionalNamespaces: {
      //     eip155: {
      //       methods: ['eth_sendTransaction', 'eth_signTransaction', 'get_balance', 'personal_sign'],
      //       chains: [...eip155OptionalChains],
      //       events: ['chainChanged', 'accountsChanged'],
      //       rpcMap: this.rpcMap?.eip155,
      //       // rpcMap:{
      //       //   5: 'https://goerli.infura.io/v3/bf808e7d3d924fbeb74672d9341d0550',
      //       //   999999: 'https://fullnode.development.cntrfg.com/',
      //       // },
      //     },
      //     polkadot: {
      //       methods: ['polkadot_signTransaction', 'polkadot_signMessage'],
      //       chains: [...polkadotOptionalChains],
      //       // chains: [
      //       //   'polkadot:91b171bb158e2d3848fa23a9f1c25182', // polkadot
      //       // ],
      //       events: ['chainChanged", "accountsChanged'],
      //       rpcMap: this.rpcMap?.polkadot,
      //     },
      //   },
      // }
      const params = {
        namespaces: {
          polkadot: {
            methods: ['polkadot_signTransaction', 'polkadot_signMessage'],
            chains: [
              'polkadot:91b171bb158e2d3848fa23a9f1c25182', // polkadot
            ],
            events: ['chainChanged", "accountsChanged'],
            rpcMap: this.rpcMap?.polkadot,
          },
        },
        optionalNamespaces: {
          eip155: {
            methods: ['eth_sendTransaction', 'eth_signTransaction', 'get_balance', 'personal_sign'],
            chains: ['eip155:5', 'eip155:1'],
            events: ['chainChanged', 'accountsChanged'],
            rpcMap: this.rpcMap?.eip155,
          },
        },
      }
      console.log('params', params)
      const session = await new Promise<any>((resolve, reject) => {
        this.modal?.subscribeModal((state) => {
          // the modal was closed so reject the promise
          if (!state.open && !provider.session) {
            provider.abortPairingAttempt()
            reject(new Error('Connection request reset. Please try again.'))
          }
        })
        provider
          .connect({
            ...this.connectOptions,
            ...params,
          })
          .then((session) => {
            resolve(session)
          })
          .catch((error: Error) => {
            reject(new Error(error.message))
          })
      })

      console.log('session', session)

      if (!session) throw new Error('Failed to establish session. Please try again')

      await provider.enable()
      console.log('provider2', provider)
      const chainId = getIdealChainId(session, desiredChainIds)
      const accounts = getAccountsFromNamespaces(session.namespaces)
        .filter((addr) => addr.startsWith(chainId))
        .map((addr) => addr.slice(chainId.length + 1))
      console.log('chainId, accounts', chainId, accounts)

      if (!chainId || !accounts?.length) throw new Error('No accounts found')

      this.actions.update({ chainId, accounts })
      // this.store.setState({ chainId, accounts, activating: false })
    } catch (error) {
      await this.deactivate()
      cancelActivation()
      throw error
    } finally {
      this.modal?.closeModal()
    }
  }

  /** {@inheritdoc Connector.deactivate} */
  public async deactivate(): Promise<void> {
    this.provider?.removeListener('disconnect', this.disconnectListener)
    this.provider?.removeListener('chainChanged', this.chainChangedListener)
    this.provider?.removeListener('accountsChanged', this.accountsChangedListener)
    this.provider?.removeListener('display_uri', this.URIListener)
    this.provider?.disconnect()
    this.provider = undefined
    this.eagerConnection = undefined
    this.actions.resetState()
  }
}

function getIdealChainId(session: Exclude<UniversalProvider['session'], undefined>, desiredChainIds?: string[]) {
  const chainIds = getChainsFromNamespaces(session.namespaces)
  const chainId = chainIds.find((cid) => desiredChainIds?.includes(cid)) || chainIds[0]
  return chainId
}
