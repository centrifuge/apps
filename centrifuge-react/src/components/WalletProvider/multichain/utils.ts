// import { CurrencyBalance } from '@centrifuge/centrifuge-js'
import type { Networkish } from '@ethersproject/networks'
import type { BaseProvider, Web3Provider } from '@ethersproject/providers'
import { EMPTY } from '@web3-react/empty'
import { Actions, Connector, Provider, Web3ReactState, Web3ReactStore } from '@web3-react/types'
import * as React from 'react'
import { useQuery } from 'react-query'
import type { StoreApi } from 'zustand'
// import { useWallet } from '../WalletProvider'
import { createWeb3ReactStoreAndActions } from '../web3store'

export type Web3ReactMultichainState = {
  chainId: string | undefined
  accounts: string[] | undefined
  activating: boolean
}

export type Web3ReactMultichainStore = StoreApi<Web3ReactMultichainState>

const stores = new WeakMap<Connector, Web3ReactStore | Web3ReactMultichainStore>()
const storeTypes = new WeakMap<Connector, 'evm' | 'caip2'>()
const [emptyConnector, emptyStore] = createConnector(() => EMPTY)

export function createConnector<T extends Connector>(
  f: (actions: Actions, store: Web3ReactStore) => T,
  type: 'evm' | 'caip2' = 'evm'
): [T, Web3ReactStore] {
  const [store, actions] = createWeb3ReactStoreAndActions(type)
  const connector = f(actions, store)
  stores.set(connector, store)
  storeTypes.set(connector, type)
  return [connector, store]
}

export function getStore(connector?: Connector | null) {
  const store = connector ? stores.get(connector) : null
  return store ?? emptyStore
}

export function getConnectorType(connector?: Connector | null) {
  const storeType = connector ? storeTypes.get(connector) : null
  return storeType ?? 'evm'
}

export function useConnectorState(connector?: Connector | null) {
  const store = getStore(connector)
  const state = React.useSyncExternalStore(store.subscribe, store.getState as any) as
    | Web3ReactState
    | Web3ReactMultichainState
  return state
}

const providerKeys = new WeakMap<Provider, string>()
function getProviderKey(connector: Connector) {
  let providerKey
  if (connector.provider) {
    providerKey = providerKeys.get(connector.provider)
    if (!providerKey) {
      providerKey = Math.random().toString(36).substring(2)
      providerKeys.set(connector.provider, providerKey)
    }
  }
  return providerKey
}

export function useProviderForConnector<T extends BaseProvider = Web3Provider>(
  connector?: Connector | null,
  network?: Networkish
) {
  const conn = connector ?? emptyConnector
  const state = useConnectorState(conn)
  const isActive = computeIsActive(state)

  const { data: provider } = useQuery(
    ['provider', getProviderKey(conn), typeof network === 'object' ? network.chainId : network],
    async () => {
      if (getConnectorType(conn) === 'evm') {
        const { Web3Provider } = await import('@ethersproject/providers')
        const provider = new Web3Provider(conn.provider!, network)
        return provider
      } else {
        return null
      }
    },
    { enabled: !!conn.provider && isActive, staleTime: Infinity }
  )

  if (conn.customProvider) return conn.customProvider as T

  return provider as T | undefined
}

// export function useEvmProvider() {
//   const { evm } = useWallet()
//   return useProviderForConnector(evm.selectedWallet?.connector, evm.chainId)
// }

// export function useNativeBalance(address?: string) {
//   const provider = useEvmProvider()
//   const { evm } = useWallet()

//   const addr = address || evm.selectedAddress

//   const query = useQuery(
//     ['evmNativeBalance', addr, evm.chainId],
//     async () => {
//       const balance = await provider!.getBalance(addr!)
//       return new CurrencyBalance(balance.toString(), 18)
//     },
//     { enabled: !!provider && !!addr }
//   )
//   return query
// }

function computeIsActive({ chainId, accounts, activating }: Web3ReactState | Web3ReactMultichainState) {
  return Boolean(chainId && accounts && !activating)
}
