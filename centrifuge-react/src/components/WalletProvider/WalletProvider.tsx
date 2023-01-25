import { isWeb3Injected } from '@polkadot/extension-dapp'
import { getWalletBySource, getWallets } from '@subwallet/wallet-connect/dotsama/wallets'
import { Wallet, WalletAccount } from '@subwallet/wallet-connect/types'
import { Connector as EvmConnector, Web3ReactState } from '@web3-react/types'
import { WalletConnect } from '@web3-react/walletconnect'
import * as React from 'react'
import { useQuery } from 'react-query'
import { firstValueFrom } from 'rxjs'
import { useConnectorState } from '../../utils/evm'
import { EvmChains, getAddChainParameters, getEvmUrls } from '../../utils/evmChains'
import { EvmConnectorMeta, getEvmConnectors } from '../../utils/evmConnectors'
import { useCentrifuge } from '../CentrifugeProvider'

type Account = WalletAccount

type Proxy = { delegator: string; types: string[] }

type State = {
  selectedType: 'evm' | 'substrate' | null
  evm: {
    selectedConnector: EvmConnector | null
    error: Error | null
  }
  substrate: {
    accounts: Account[] | null
    selectedAccountAddress: string | null
    proxyAddress: string | null
    isConnecting: boolean
    selectedWallet: Wallet | null
  }
}

type WalletContextType = {
  accounts: Account[] | null
  selectedAccount: Account | null
  isConnecting: boolean
  isWeb3Injected: boolean
  connect: (source?: string) => Promise<void>
  disconnect: () => void
  selectAccount: (address: string) => void
  selectedWallet: Wallet | null
  selectProxy: (address: string | null) => void
  proxy: Proxy | null
  proxies: Record<string, Proxy[]> | undefined
  isActive: boolean
}

type EvmWalletContextType = Web3ReactState & {
  connectors: EvmConnectorMeta[]
  selectedConnector: EvmConnector | null
  selectedAccount: string | null
  connect: (connector: EvmConnector, chainId?: number) => Promise<void>
  disconnect: () => void
  isActive: boolean
}

const WalletContext = React.createContext<WalletContextType>(null as any)
const EvmWalletContext = React.createContext<EvmWalletContextType>(null as any)

export const wallets = getWallets()

const PERSIST_KEY = 'centrifugeWalletPersist'
const PERSISTED_EXTENSION_KEY = 'centrifugeWalletPersistedExtension'
const PERSISTED_ADDRESS_KEY = 'centrifugeWalletPersistedAddress'
const PERSISTED_PROXY_KEY = 'centrifugeWalletPersistedProxy'

export function useWallet() {
  const ctx = React.useContext(WalletContext)
  if (!ctx) throw new Error('useWallet must be used within Provider')
  return ctx
}

export function useEvmWallet() {
  const ctx = React.useContext(EvmWalletContext)
  if (!ctx) throw new Error('useEvmWallet must be used within Provider')
  return ctx
}

export function useAddress() {
  const { selectedAccount, proxy } = useWallet()
  return proxy?.delegator || selectedAccount?.address
}

let triedEager = false

type WalletProviderProps = {
  children: React.ReactNode
  evmChains?: EvmChains
  evmAdditionalConnectors?: EvmConnectorMeta[]
}

const initialState: State = {
  selectedType: null,
  evm: {
    selectedConnector: null,
    error: null,
  },
  substrate: {
    accounts: null,
    selectedAccountAddress: null,
    proxyAddress: null,
    isConnecting: false,
    selectedWallet: null,
  },
}
type Action =
  | {
      type: 'substrateReset'
    }
  | {
      type: 'evmReset'
    }
  | {
      type: 'substrateSetState'
      payload: Partial<State['substrate']>
    }
  | {
      type: 'evmSetState'
      payload: Partial<State['evm']>
    }
  | {
      type: 'setSelectedType'
      payload: State['selectedType']
    }

function reducer(state: State, action: Action) {
  switch (action.type) {
    case 'substrateSetState':
      return {
        ...state,
        substrate: {
          ...state.substrate,
          ...action.payload,
        },
      }

    case 'substrateReset':
      return {
        ...state,
        selectedType: state.evm.selectedConnector ? 'substrate' : null,
        substrate: {
          ...initialState.substrate,
        },
      }
    case 'evmSetState':
      return {
        ...state,
        evm: {
          ...state.evm,
          ...action.payload,
        },
      }
    case 'evmReset':
      return {
        ...state,
        selectedType: state.substrate.accounts?.length ? 'evm' : null,
        evm: {
          ...initialState.evm,
        },
      }
    case 'setSelectedType':
      return {
        ...state,
        selectedType: action.payload,
      }
  }
}

let cachedEvmConnectors: EvmConnectorMeta[] | undefined = undefined

export function WalletProvider({
  children,
  evmChains = {
    1: {
      urls: ['https://cloudflare-eth.com'],
      name: 'Mainnet',
    },
  },
  evmAdditionalConnectors,
}: WalletProviderProps) {
  if (!evmChains[1]?.urls[0]) throw new Error('Mainnet should be defined in EVM Chains')
  const [state, dispatch] = React.useReducer(reducer, initialState)
  const evmConnectors =
    cachedEvmConnectors || (cachedEvmConnectors = getEvmConnectors(getEvmUrls(evmChains), evmAdditionalConnectors))

  const unsubscribeRef = React.useRef<(() => void) | null>()
  const cent = useCentrifuge()
  const { data: proxies } = useQuery(
    ['proxies', state.substrate.accounts?.map((acc) => acc.address)],
    () =>
      firstValueFrom(cent.proxies.getMultiUserProxies([state.substrate.accounts!.map((acc) => acc.address)])).then(
        (proxies) => {
          return Object.fromEntries(
            Object.entries(proxies).map(([delegatee, ps]) => [
              cent.utils.formatAddress(delegatee),
              ps.map((p) => ({ ...p, delegator: cent.utils.formatAddress(p.delegator) })),
            ])
          )
        }
      ),
    {
      enabled: !!state.substrate.accounts?.length,
      staleTime: Infinity,
    }
  )

  function setFilteredAccounts(accounts: Account[]) {
    const mappedAccounts = accounts.map((acc) => ({
      ...acc,
      address: cent.utils.formatAddress(acc.address),
    }))

    const persistedAddress = localStorage.getItem(PERSISTED_ADDRESS_KEY)
    const persistedProxy = localStorage.getItem(PERSISTED_PROXY_KEY)
    const matchingAccount = persistedAddress && mappedAccounts.find((acc) => acc.address === persistedAddress)?.address
    const address = matchingAccount || mappedAccounts[0]?.address
    dispatch({
      type: 'substrateSetState',
      payload: {
        accounts: mappedAccounts,
        selectedAccountAddress: address,
        proxyAddress: (matchingAccount && persistedProxy) || null,
      },
    })
    localStorage.setItem(PERSISTED_ADDRESS_KEY, address ?? '')
  }

  const disconnect = React.useCallback(async () => {
    dispatch({ type: 'substrateReset' })
    localStorage.removeItem(PERSIST_KEY)
    localStorage.removeItem(PERSISTED_EXTENSION_KEY)
    localStorage.removeItem(PERSISTED_ADDRESS_KEY)
    localStorage.removeItem(PERSISTED_PROXY_KEY)
    if (unsubscribeRef.current) {
      unsubscribeRef.current()
      unsubscribeRef.current = null
    }
  }, [])

  const connect = React.useCallback(async (source?: string) => {
    unsubscribeRef.current?.()
    dispatch({ type: 'substrateSetState', payload: { isConnecting: true } })
    dispatch({ type: 'setSelectedType', payload: 'substrate' })

    try {
      const wallet = source ? getWalletBySource(source) : wallets.find((w) => w.installed)
      if (!wallet?.installed) throw new Error('Wallet not available')
      dispatch({ type: 'substrateSetState', payload: { selectedWallet: wallet } })

      await wallet.enable()

      const unsub = await wallet.subscribeAccounts((allAccounts) => {
        if (!allAccounts) throw new Error('No accounts')
        setFilteredAccounts(allAccounts)
      })
      unsubscribeRef.current = unsub as any

      localStorage.setItem(PERSIST_KEY, '1')
      localStorage.setItem(PERSISTED_EXTENSION_KEY, wallet.extensionName)
    } catch (e) {
      console.error(e)
      localStorage.removeItem(PERSIST_KEY)
      localStorage.removeItem(PERSISTED_EXTENSION_KEY)
      localStorage.removeItem(PERSISTED_ADDRESS_KEY)
      localStorage.removeItem(PERSISTED_PROXY_KEY)
      throw e
    } finally {
      dispatch({ type: 'substrateSetState', payload: { isConnecting: false } })
    }
  }, [])

  const selectAccount = React.useCallback((address: string) => {
    dispatch({ type: 'substrateSetState', payload: { selectedAccountAddress: address, proxyAddress: null } })
    localStorage.setItem(PERSISTED_ADDRESS_KEY, address)
  }, [])

  const selectProxy = React.useCallback((proxyAddress: string | null) => {
    dispatch({ type: 'substrateSetState', payload: { proxyAddress } })
    localStorage.setItem(PERSISTED_PROXY_KEY, proxyAddress ?? '')
  }, [])

  async function tryReconnect() {
    const source = localStorage.getItem(PERSISTED_EXTENSION_KEY)!
    // This script might have loaded quicker than the wallet extension,
    // so we'll wait up to 2 seconds for it to load
    let i = 8
    let hasWallet = false
    while (i--) {
      const wallet = getWalletBySource(source)
      if (wallet?.installed) {
        hasWallet = true
        break
      }
      await new Promise((res) => setTimeout(res, 250))
    }
    if (hasWallet) {
      connect(source)
    }
  }

  React.useEffect(() => {
    if (!triedEager && localStorage.getItem(PERSIST_KEY)) {
      tryReconnect()
    }
    triedEager = true

    return () => {
      if (unsubscribeRef.current) {
        unsubscribeRef.current()
        unsubscribeRef.current = null
      }
    }
  }, [])

  const ctx: WalletContextType = React.useMemo(
    () => ({
      ...state.substrate,
      selectedAccount:
        state.substrate.accounts?.find((acc) => acc.address === state.substrate.selectedAccountAddress) ?? null,
      isWeb3Injected,
      connect,
      disconnect,
      selectAccount,
      selectProxy,
      proxy:
        state.substrate.selectedAccountAddress && state.substrate.proxyAddress && proxies
          ? proxies[state.substrate.selectedAccountAddress]?.find(
              (p) => p.delegator === state.substrate.proxyAddress
            ) ?? null
          : null,
      proxies,
      isActive: state.selectedType === 'substrate',
    }),
    [connect, disconnect, selectAccount, selectProxy, proxies, state]
  )

  const connectEvm = React.useCallback(async (connector: EvmConnector, chainId?: number) => {
    dispatch({ type: 'evmSetState', payload: { selectedConnector: connector, error: null } })
    dispatch({ type: 'setSelectedType', payload: 'evm' })

    try {
      await (connector instanceof WalletConnect
        ? connector.activate(chainId)
        : connector.activate(chainId ? getAddChainParameters(evmChains, chainId) : undefined))
    } catch (error) {
      console.error('error', error)
      dispatch({ type: 'evmSetState', payload: { error } })
    }
  }, [])

  const disconnectEvm = React.useCallback(async () => {
    evmConnectors.forEach((connectorMeta) => {
      if (connectorMeta.connector?.deactivate) {
        connectorMeta.connector.deactivate()
      } else {
        connectorMeta.connector.resetState()
      }
    })
    dispatch({ type: 'evmReset' })
  }, [])

  const evmState = useConnectorState(state.evm.selectedConnector)

  const evmCtx: EvmWalletContextType = React.useMemo(
    () => ({
      ...state.evm,
      ...evmState,
      selectedAccount: evmState.accounts?.[0] ?? null,
      connect: connectEvm,
      disconnect: disconnectEvm,
      connectors: evmConnectors,
      isActive: state.selectedType === 'evm',
    }),
    [state.evm, evmState, connectEvm, disconnectEvm]
  )

  return (
    <WalletContext.Provider value={ctx}>
      <EvmWalletContext.Provider value={evmCtx}>{children}</EvmWalletContext.Provider>
    </WalletContext.Provider>
  )
}
