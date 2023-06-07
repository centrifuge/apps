import type UniversalProvider from '@walletconnect/universal-provider'
import type { NamespaceConfig } from '@walletconnect/universal-provider'
import { getAccountsFromNamespaces, getChainsFromNamespaces } from '@walletconnect/utils'
import type { Actions, ProviderRpcError, Web3ReactStore } from '@web3-react/types'
import { Connector } from '@web3-react/types'
import type { Web3Modal } from '@web3modal/standalone'
import EventEmitter3 from 'eventemitter3'

export const URI_AVAILABLE = 'URI_AVAILABLE'
const DEFAULT_TIMEOUT = 5000

/**
 * Options to configure the WalletConnect provider.
 * For the full list of options, see {@link https://docs.walletconnect.com/2.0/javascript/providers/ethereum#initialization WalletConnect documentation}.
 */
export type WalletConnectOptions = Parameters<typeof UniversalProvider.init>[0] & {
  namespaces: NamespaceConfig
  optionalNamespaces?: NamespaceConfig
}

/**
 * Options to configure the WalletConnect connector.
 */
export interface WalletConnectConstructorArgs {
  actions: Actions
  store: Web3ReactStore
  /** Options to pass to `@walletconnect/ethereum-provider`. */
  options: WalletConnectOptions
  /** The chainId to connect to in activate if one is not provided. */
  defaultChainId?: number
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
  private store: Web3ReactStore

  private readonly options: Omit<WalletConnectOptions, keyof Parameters<UniversalProvider['connect']>[0]>

  private readonly rpcMap?: Record<number, string | string[]>
  private readonly connectOptions: Parameters<UniversalProvider['connect']>[0]
  private readonly defaultChainId?: number
  private readonly timeout: number

  private eagerConnection?: Promise<UniversalProvider>

  constructor({
    actions,
    store,
    options,
    defaultChainId,
    timeout = DEFAULT_TIMEOUT,
    onError,
  }: WalletConnectConstructorArgs) {
    super(actions, onError)

    const { namespaces, optionalNamespaces, ...rest } = options

    this.options = rest
    this.connectOptions = { namespaces, optionalNamespaces }
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
      provider.on('session_ping', ({ id, topic }) => {
        console.log('session_ping', id, topic)
      })

      // Subscribe to session event
      provider.on('session_event', ({ event, chainId }) => {
        console.log('session_event', event, chainId)
      })

      // Subscribe to session update
      provider.on('session_update', ({ topic, params }) => {
        console.log('session_update', topic, params)
      })

      // Subscribe to session delete
      provider.on('session_delete', ({ id, topic }) => {
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

      this.store.setState({
        chainId,
        accounts,
        activating: false,
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
      this.store.setState({ chainId: bestMatchChainId })
      return provider.request<void>(
        {
          method: 'wallet_switchEthereumChain',
          params: [{ chainId: `0x${bestMatchChainId.toString(16)}` }],
        },
        bestMatchChainId
      )
    }

    const cancelActivation = this.actions.startActivation()

    try {
      const params = {
        namespaces: {
          eip155: {
            methods: ['eth_sendTransaction', 'eth_signTransaction', 'get_balance', 'personal_sign'],
            chains: ['eip155:1'],
            events: ['chainChanged', 'accountsChanged'],
          },
        },
        optionalNamespaces: {
          polkadot: {
            methods: ['polkadot_signTransaction', 'polkadot_signMessage'],
            chains: [
              'polkadot:91b171bb158e2d3848fa23a9f1c25182', // polkadot
            ],
            events: ['chainChanged", "accountsChanged'],
          },
          eip155: {
            methods: ['eth_sendTransaction', 'eth_signTransaction', 'get_balance', 'personal_sign'],
            chains: ['eip155:5', 'eip155:999999'],
            events: ['chainChanged', 'accountsChanged'],
            rpcMap: {
              5: 'https://goerli.infura.io/v3/bf808e7d3d924fbeb74672d9341d0550',
              999999: 'https://fullnode.development.cntrfg.com/',
            },
          },
        },
      }
      const session = await new Promise<any>(async (resolve, reject) => {
        this.modal?.subscribeModal((state) => {
          // the modal was closed so reject the promise
          if (!state.open && !provider.session) {
            provider.abortPairingAttempt()
            reject(new Error('Connection request reset. Please try again.'))
          }
        })
        await provider
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

      this.store.setState({ chainId, accounts, activating: false })
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
