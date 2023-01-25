import type { Networkish } from '@ethersproject/networks'
import type { BaseProvider, Web3Provider } from '@ethersproject/providers'
import { CoinbaseWallet } from '@web3-react/coinbase-wallet'
import { EMPTY } from '@web3-react/empty'
import { MetaMask } from '@web3-react/metamask'
import { createWeb3ReactStoreAndActions } from '@web3-react/store'
import { Actions, Connector, Provider, Web3ReactState, Web3ReactStore } from '@web3-react/types'
import { WalletConnect } from '@web3-react/walletconnect'
import * as React from 'react'
import { useQuery } from 'react-query'

const stores = new WeakMap<Connector, Web3ReactStore>()
const [emptyConnector, emptyStore] = createConnector(() => EMPTY)

export function createConnector<T extends Connector>(f: (actions: Actions) => T): [T, Web3ReactStore] {
  const [store, actions] = createWeb3ReactStoreAndActions()
  const connector = f(actions)
  stores.set(connector, store)
  return [connector, store]
}

export function getFallbackStore(connector?: Connector | null) {
  const store = connector ? stores.get(connector) : null
  return store ?? emptyStore
}

// @ts-expect-error
window.stores = stores

export function useConnectorState(connector?: Connector | null) {
  const store = getFallbackStore(connector)
  const state = React.useSyncExternalStore(store.subscribe, store.getState)
  return state
}

const providerKeys = new WeakMap<Provider, string>()
function getProviderKey(connector: Connector) {
  let providerKey
  if (connector.provider) {
    providerKey = providerKeys.get(connector.provider)
    if (!providerKey) {
      providerKey = Math.random().toString(36)
      providerKeys.set(connector.provider, providerKey)
    }
  }
  return providerKey
}

export function useProvider<T extends BaseProvider = Web3Provider>(connector?: Connector | null, network?: Networkish) {
  const conn = connector ?? emptyConnector
  const state = useConnectorState(conn)
  const isActive = computeIsActive(state)

  const { data: provider } = useQuery(
    ['evmProvider', getProviderKey(conn), typeof network === 'object' ? network.chainId : network],
    async () => {
      const { Web3Provider } = await import('@ethersproject/providers')
      const provider = new Web3Provider(conn.provider!, network)
      return provider
    },
    { enabled: !!conn.provider && isActive, staleTime: Infinity }
  )

  if (conn.customProvider) return conn.customProvider as T

  return provider as T | undefined
}

export function getName(connector: Connector) {
  if (connector instanceof MetaMask) return 'MetaMask'
  if (connector instanceof WalletConnect) return 'WalletConnect'
  if (connector instanceof CoinbaseWallet) return 'Coinbase Wallet'
  return 'Unknown'
}

function computeIsActive({ chainId, accounts, activating }: Web3ReactState) {
  return Boolean(chainId && accounts && !activating)
}

// /**
//  * Creates a variety of convenience `hooks` that return data associated with a particular passed connector.
//  *
//  * @param initializedConnectors - Two or more [connector, hooks(, store)] arrays, as returned from initializeConnector.
//  * @returns hooks - A variety of convenience hooks that wrap the hooks returned from initializeConnector.
//  */
// export function getSelectedConnector(
//   ...initializedConnectors: [Connector, Web3ReactHooks][] | [Connector, Web3ReactHooks, Web3ReactStore][]
// ) {
//   function getIndex(connector: Connector) {
//     const index = initializedConnectors.findIndex(([initializedConnector]) => connector === initializedConnector)
//     if (index === -1) throw new Error('Connector not found')
//     return index
//   }

//   function useSelectedStore(connector: Connector) {
//     const store = initializedConnectors[getIndex(connector)][2]
//     if (!store) throw new Error('Stores not passed')
//     return store
//   }

//   // the following code calls hooks in a map a lot, which violates the eslint rule.
//   // this is ok, though, because initializedConnectors never changes, so the same hooks are called each time
//   function useSelectedChainId(connector: Connector) {
//     // eslint-disable-next-line react-hooks/rules-of-hooks
//     const values = initializedConnectors.map(([, { useChainId }]) => useChainId())
//     return values[getIndex(connector)]
//   }

//   function useSelectedAccounts(connector: Connector) {
//     // eslint-disable-next-line react-hooks/rules-of-hooks
//     const values = initializedConnectors.map(([, { useAccounts }]) => useAccounts())
//     return values[getIndex(connector)]
//   }

//   function useSelectedIsActivating(connector: Connector) {
//     // eslint-disable-next-line react-hooks/rules-of-hooks
//     const values = initializedConnectors.map(([, { useIsActivating }]) => useIsActivating())
//     return values[getIndex(connector)]
//   }

//   function useSelectedAccount(connector: Connector) {
//     // eslint-disable-next-line react-hooks/rules-of-hooks
//     const values = initializedConnectors.map(([, { useAccount }]) => useAccount())
//     return values[getIndex(connector)]
//   }

//   function useSelectedIsActive(connector: Connector) {
//     // eslint-disable-next-line react-hooks/rules-of-hooks
//     const values = initializedConnectors.map(([, { useIsActive }]) => useIsActive())
//     return values[getIndex(connector)]
//   }

//   /**
//    * @typeParam T - A type argument must only be provided if one or more of the connectors passed to
//    * getSelectedConnector is using `connector.customProvider`, in which case it must match every possible type of this
//    * property, over all connectors.
//    */
//   function useSelectedProvider<T extends BaseProvider = Web3Provider>(
//     connector: Connector,
//     network?: Networkish
//   ): T | undefined {
//     const index = getIndex(connector)
//     // eslint-disable-next-line react-hooks/rules-of-hooks
//     const values = initializedConnectors.map(([, { useProvider }], i) => useProvider<T>(network, i === index))
//     return values[index]
//   }

//   function useSelectedENSNames(connector: Connector, provider?: BaseProvider) {
//     const index = getIndex(connector)
//     const values = initializedConnectors.map(([, { useENSNames }], i) =>
//       // eslint-disable-next-line react-hooks/rules-of-hooks
//       useENSNames(i === index ? provider : undefined)
//     )
//     return values[index]
//   }

//   function useSelectedENSName(connector: Connector, provider?: BaseProvider) {
//     const index = getIndex(connector)
//     // eslint-disable-next-line react-hooks/rules-of-hooks
//     const values = initializedConnectors.map(([, { useENSName }], i) => useENSName(i === index ? provider : undefined))
//     return values[index]
//   }

//   return {
//     useSelectedStore,
//     useSelectedChainId,
//     useSelectedAccounts,
//     useSelectedIsActivating,
//     useSelectedAccount,
//     useSelectedIsActive,
//     useSelectedProvider,
//     useSelectedENSNames,
//     useSelectedENSName,
//   }
// }

// /**
//  * Creates a variety of convenience `hooks` that return data associated with the first of the `initializedConnectors`
//  * that is active.
//  *
//  * @param initializedConnectors - Two or more [connector, hooks(, store)] arrays, as returned from initializeConnector.
//  * @returns hooks - A variety of convenience hooks that wrap the hooks returned from initializeConnector.
//  */
// export function getPriorityConnector(
//   ...initializedConnectors: [Connector, Web3ReactHooks][] | [Connector, Web3ReactHooks, Web3ReactStore][]
// ) {
//   const {
//     useSelectedStore,
//     useSelectedChainId,
//     useSelectedAccounts,
//     useSelectedIsActivating,
//     useSelectedAccount,
//     useSelectedIsActive,
//     useSelectedProvider,
//     useSelectedENSNames,
//     useSelectedENSName,
//   } = getSelectedConnector(...initializedConnectors)

//   function usePriorityConnector() {
//     // eslint-disable-next-line react-hooks/rules-of-hooks
//     const values = initializedConnectors.map(([, { useIsActive }]) => useIsActive())
//     const index = values.findIndex((isActive) => isActive)
//     return initializedConnectors[index === -1 ? 0 : index][0]
//   }

//   function usePriorityStore() {
//     return useSelectedStore(usePriorityConnector())
//   }

//   function usePriorityChainId() {
//     return useSelectedChainId(usePriorityConnector())
//   }

//   function usePriorityAccounts() {
//     return useSelectedAccounts(usePriorityConnector())
//   }

//   function usePriorityIsActivating() {
//     return useSelectedIsActivating(usePriorityConnector())
//   }

//   function usePriorityAccount() {
//     return useSelectedAccount(usePriorityConnector())
//   }

//   function usePriorityIsActive() {
//     return useSelectedIsActive(usePriorityConnector())
//   }

//   /**
//    * @typeParam T - A type argument must only be provided if one or more of the connectors passed to
//    * getPriorityConnector is using `connector.customProvider`, in which case it must match every possible type of this
//    * property, over all connectors.
//    */
//   function usePriorityProvider<T extends BaseProvider = Web3Provider>(network?: Networkish) {
//     return useSelectedProvider<T>(usePriorityConnector(), network)
//   }

//   function usePriorityENSNames(provider?: BaseProvider) {
//     return useSelectedENSNames(usePriorityConnector(), provider)
//   }

//   function usePriorityENSName(provider?: BaseProvider) {
//     return useSelectedENSName(usePriorityConnector(), provider)
//   }

//   return {
//     useSelectedStore,
//     useSelectedChainId,
//     useSelectedAccounts,
//     useSelectedIsActivating,
//     useSelectedAccount,
//     useSelectedIsActive,
//     useSelectedProvider,
//     useSelectedENSNames,
//     useSelectedENSName,
//     usePriorityConnector,
//     usePriorityStore,
//     usePriorityChainId,
//     usePriorityAccounts,
//     usePriorityIsActivating,
//     usePriorityAccount,
//     usePriorityIsActive,
//     usePriorityProvider,
//     usePriorityENSNames,
//     usePriorityENSName,
//   }
// }

// function getDerivedHooks({ useChainId, useAccounts, useIsActivating }: ReturnType<typeof getStateHooks>) {
//   function useAccount(): string | undefined {
//     return useAccounts()?.[0]
//   }

//   function useIsActive(): boolean {
//     const chainId = useChainId()
//     const accounts = useAccounts()
//     const activating = useIsActivating()

//     return computeIsActive({
//       chainId,
//       accounts,
//       activating,
//     })
//   }

//   return { useAccount, useIsActive }
// }

// /**
//  * @returns ENSNames - An array of length `accounts.length` which contains entries which are either all `undefined`,
//  * indicated that names cannot be fetched because there's no provider, or they're in the process of being fetched,
//  * or `string | null`, depending on whether an ENS name has been set for the account in question or not.
//  */
// function useENS(provider?: BaseProvider, accounts: string[] = []): undefined[] | (string | null)[] {
//   const [ENSNames, setENSNames] = useState<(string | null)[] | undefined>()

//   useEffect(() => {
//     if (provider && accounts.length) {
//       let stale = false

//       Promise.all(accounts.map((account) => provider.lookupAddress(account)))
//         .then((ENSNames) => {
//           if (stale) return
//           setENSNames(ENSNames)
//         })
//         .catch((error) => {
//           if (stale) return
//           console.debug('Could not fetch ENS names', error)
//           setENSNames(new Array<null>(accounts.length).fill(null))
//         })

//       return () => {
//         stale = true
//         setENSNames(undefined)
//       }
//     }
//   }, [provider, accounts])

//   return ENSNames ?? new Array<undefined>(accounts.length).fill(undefined)
// }

// function getAugmentedHooks<T extends Connector>(
//   connector: T,
//   { useAccounts, useChainId }: ReturnType<typeof getStateHooks>,
//   { useAccount, useIsActive }: ReturnType<typeof getDerivedHooks>
// ) {
//   /**
//    * Avoid type erasure by returning the most qualified type if not otherwise set.
//    * Note that this function's return type is `T | undefined`, but there is a code path
//    * that returns a Web3Provider, which could conflict with a user-provided T. So,
//    * it's important that users only provide an override for T if they know that
//    * `connector.customProvider` is going to be defined and of type T.
//    *
//    * @typeParam T - A type argument must only be provided if using `connector.customProvider`, in which case it
//    * must match the type of this property.
//    */
//   function useProvider<T extends BaseProvider = Web3Provider>(network?: Networkish, enabled = true): T | undefined {
//     const isActive = useIsActive()
//     const chainId = useChainId()

//     // ensure that Provider is going to be available when loaded if @ethersproject/providers is installed
//     const [loaded, setLoaded] = useState(DynamicProvider !== undefined)
//     useEffect(() => {
//       if (loaded) return
//       let stale = false
//       void importProvider().then(() => {
//         if (stale) return
//         setLoaded(true)
//       })
//       return () => {
//         stale = true
//       }
//     }, [loaded])

//     return useMemo(() => {
//       // to ensure connectors remain fresh, we condition re-renders on loaded, isActive and chainId
//       void loaded && isActive && chainId
//       if (enabled) {
//         if (connector.customProvider) return connector.customProvider as T
//         // see tsdoc note above for return type explanation.
//         else if (DynamicProvider && connector.provider)
//           return new DynamicProvider(connector.provider, network) as unknown as T
//       }
//     }, [loaded, enabled, isActive, chainId, network])
//   }

//   function useENSNames(provider?: BaseProvider): undefined[] | (string | null)[] {
//     const accounts = useAccounts()
//     return useENS(provider, accounts)
//   }

//   function useENSName(provider?: BaseProvider): undefined | string | null {
//     const account = useAccount()
//     const accounts = useMemo(() => (account === undefined ? undefined : [account]), [account])
//     return useENS(provider, accounts)?.[0]
//   }

//   return { useProvider, useENSNames, useENSName }
// }
