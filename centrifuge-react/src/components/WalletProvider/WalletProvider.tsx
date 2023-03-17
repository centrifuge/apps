import { isWeb3Injected } from '@polkadot/extension-dapp'
import { getWallets } from '@subwallet/wallet-connect/dotsama/wallets'
import { Wallet } from '@subwallet/wallet-connect/types'
import { Web3ReactState } from '@web3-react/types'
import { WalletConnect } from '@web3-react/walletconnect'
import * as React from 'react'
import { useQuery } from 'react-query'
import { firstValueFrom } from 'rxjs'
import { ReplacedError, useAsyncCallback } from '../../hooks/useAsyncCallback'
import { useCentrifuge } from '../CentrifugeProvider'
import { EvmChains, getAddChainParameters, getEvmUrls } from './evm/chains'
import { EvmConnectorMeta, getEvmConnectors } from './evm/connectors'
import { getStore } from './evm/utils'
import { Account, Proxy, State } from './types'
import { useConnectEagerly } from './useConnectEagerly'
import { Action, getPersisted, persist, useWalletStateInternal } from './useWalletState'
import { useGetNetworkName } from './utils'
import { WalletDialog } from './WalletDialog'

type WalletContextType = {
  connectedType: 'evm' | 'substrate' | null
  connectedNetwork: State['walletDialog']['network']
  connectedNetworkName: string | null
  dispatch: (action: Action) => void
  showWallets: (network?: State['walletDialog']['network'], wallet?: State['walletDialog']['wallet']) => void
  showAccounts: () => void
  walletDialog: State['walletDialog']
  connect: (wallet: Wallet | EvmConnectorMeta, chainId?: number) => Promise<Account[] | string[] | undefined>
  disconnect: () => void
  pendingConnect: {
    isConnecting: boolean
    isError: boolean
    wallet: Wallet | EvmConnectorMeta | null
  }
  substrate: {
    accounts: Account[] | null
    selectedAccount: Account | null
    selectedAddress: string | null
    selectProxy: (address: string | null) => void
    isWeb3Injected: boolean
    selectAccount: (address: string) => void
    selectedWallet: Wallet | null
    proxy: Proxy | null
    proxies: Record<string, Proxy[]> | undefined
    subscanUrl?: string
  }
  evm: Pick<Web3ReactState, 'chainId' | 'accounts'> & {
    connectors: EvmConnectorMeta[]
    chains: EvmChains
    selectedWallet: EvmConnectorMeta | null
    selectedAddress: string | null
  }
}

const WalletContext = React.createContext<WalletContextType>(null as any)

export const wallets = getWallets()

export function useWallet() {
  const ctx = React.useContext(WalletContext)
  if (!ctx) throw new Error('useWallet must be used within Provider')
  return ctx
}

export function useAddress(typeOverride?: 'substrate' | 'evm') {
  const { connectedType, evm, substrate } = useWallet()
  const type = typeOverride ?? connectedType
  if (type === 'evm') {
    return evm.accounts?.[0]
  }
  return substrate.proxy?.delegator || substrate.selectedAccount?.address
}

type WalletProviderProps = {
  children: React.ReactNode
  evmChains?: EvmChains
  evmAdditionalConnectors?: EvmConnectorMeta[]
  subscanUrl?: string
}

let cachedEvmConnectors: EvmConnectorMeta[] | undefined = undefined

export function WalletProvider({
  children,
  evmChains = {
    1: {
      urls: ['https://cloudflare-eth.com'],
    },
  },
  evmAdditionalConnectors,
  subscanUrl,
}: WalletProviderProps) {
  if (!evmChains[1]?.urls[0]) throw new Error('Mainnet should be defined in EVM Chains')
  const evmConnectors =
    cachedEvmConnectors || (cachedEvmConnectors = getEvmConnectors(getEvmUrls(evmChains), evmAdditionalConnectors))

  const [state, dispatch] = useWalletStateInternal(evmConnectors)

  const unsubscribeRef = React.useRef<(() => void) | null>()

  React.useEffect(
    () => () => {
      if (unsubscribeRef.current) {
        unsubscribeRef.current()
        unsubscribeRef.current = null
      }
    },
    []
  )

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

    const { address: persistedAddress, proxy: persistedProxy } = getPersisted()
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
  }

  const selectAccount = React.useCallback((address: string) => {
    dispatch({ type: 'substrateSetState', payload: { selectedAccountAddress: address, proxyAddress: null } })
  }, [])

  const selectProxy = React.useCallback((proxyAddress: string | null) => {
    dispatch({ type: 'substrateSetState', payload: { proxyAddress } })
  }, [])

  const {
    execute: setPendingConnect,
    args: connectingArgs,
    isLoading: isConnectingByInteraction,
    isError: isConnectError,
  } = useAsyncCallback((_: EvmConnectorMeta | Wallet, cb: () => Promise<Account[] | string[] | undefined>) => cb(), {
    throwOnReplace: true,
  })

  const connectSubstrate = React.useCallback(async (wallet: Wallet) => {
    unsubscribeRef.current?.()

    if (!wallet?.installed) throw new Error('Wallet not available')

    const accounts = await setPendingConnect(wallet, async () => {
      try {
        const allAccounts = await wallet.getAccounts()
        if (!allAccounts) throw new Error('Failed to get accounts')

        setFilteredAccounts(allAccounts)
        dispatch({ type: 'substrateSetState', payload: { selectedWallet: wallet } })
        dispatch({ type: 'setConnectedType', payload: 'substrate' })

        unsubscribeRef.current = await wallet.subscribeAccounts(setFilteredAccounts)

        return allAccounts
      } catch (error) {
        if (error instanceof ReplacedError) return
        console.error(error)
        throw error
      }
    })
    return accounts
  }, [])

  const connectEvm = React.useCallback(async (wallet: EvmConnectorMeta, chainId?: number) => {
    const { connector } = wallet
    try {
      const accounts = await setPendingConnect(wallet, async () => {
        await (connector instanceof WalletConnect
          ? connector.activate(chainId)
          : connector.activate(chainId ? getAddChainParameters(evmChains, chainId) : undefined))
        return getStore(wallet.connector).getState().accounts
      })

      dispatch({ type: 'evmSetState', payload: { selectedWallet: wallet } })
      dispatch({ type: 'setConnectedType', payload: 'evm' })

      return accounts
    } catch (error) {
      if (error instanceof ReplacedError) return
      console.error(error)
      throw error
    }
  }, [])

  const connect = React.useCallback(async (wallet: Wallet | EvmConnectorMeta, chainId?: number) => {
    disconnect()
    if ('connector' in wallet) {
      return connectEvm(wallet, chainId)
    }
    return connectSubstrate(wallet)
  }, [])

  const disconnect = React.useCallback(async () => {
    evmConnectors.forEach((connectorMeta) => {
      if (connectorMeta.connector?.deactivate) {
        connectorMeta.connector.deactivate()
      } else {
        connectorMeta.connector.resetState()
      }
    })

    persist(null)
    if (unsubscribeRef.current) {
      unsubscribeRef.current()
      unsubscribeRef.current = null
    }

    dispatch({ type: 'reset' })
  }, [])

  const isTryingToConnectEagerly = useConnectEagerly(connect, dispatch, evmConnectors)
  const isConnecting = isConnectingByInteraction || isTryingToConnectEagerly
  const getNetworkName = useGetNetworkName(evmChains)

  const ctx: WalletContextType = React.useMemo(() => {
    const selectedSubstrateAccount =
      state.substrate.accounts?.find((acc) => acc.address === state.substrate.selectedAccountAddress) ?? null
    const connectedNetwork =
      state.connectedType === 'evm' ? state.evm.chainId! : state.connectedType === 'substrate' ? 'centrifuge' : null
    return {
      connectedType: state.connectedType,
      connectedNetwork,
      connectedNetworkName: connectedNetwork ? getNetworkName(connectedNetwork) : null,
      dispatch,
      showWallets: (network?: State['walletDialog']['network'], wallet?: State['walletDialog']['wallet']) =>
        dispatch({ type: 'showWalletDialog', payload: { view: 'wallets', network, wallet } }),
      showAccounts: () => dispatch({ type: 'showWalletDialogAccounts', payload: { network: state.evm.chainId } }),
      walletDialog: state.walletDialog,
      pendingConnect: {
        isConnecting,
        isError: isConnectError,
        wallet: connectingArgs?.[0] ?? null,
      },
      connect,
      disconnect,
      substrate: {
        ...state.substrate,
        selectedAccount: selectedSubstrateAccount,
        selectedAddress: selectedSubstrateAccount?.address ?? null,
        isWeb3Injected,
        selectAccount,
        selectProxy,
        proxy:
          state.substrate.selectedAccountAddress && state.substrate.proxyAddress && proxies
            ? proxies[state.substrate.selectedAccountAddress]?.find(
                (p) => p.delegator === state.substrate.proxyAddress
              ) ?? null
            : null,
        proxies,
        subscanUrl,
      },
      evm: {
        ...state.evm,
        selectedAddress: state.evm.accounts?.[0] ?? null,
        connectors: evmConnectors,
        chains: evmChains,
      },
    }
  }, [connect, disconnect, selectAccount, selectProxy, proxies, state, isConnectError, isConnecting])

  return (
    <WalletContext.Provider value={ctx}>
      {children}
      <WalletDialog evmChains={evmChains} />
    </WalletContext.Provider>
  )
}
