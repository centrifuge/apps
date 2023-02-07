import type { Networkish } from '@ethersproject/networks'
import type { BaseProvider, Web3Provider } from '@ethersproject/providers'
import { EMPTY } from '@web3-react/empty'
import { createWeb3ReactStoreAndActions } from '@web3-react/store'
import { Actions, Connector, Provider, Web3ReactState, Web3ReactStore } from '@web3-react/types'
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

export function getStore(connector?: Connector | null) {
  const store = connector ? stores.get(connector) : null
  return store ?? emptyStore
}

export function useConnectorState(connector?: Connector | null) {
  const store = getStore(connector)
  const state = React.useSyncExternalStore(store.subscribe, store.getState)
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

function computeIsActive({ chainId, accounts, activating }: Web3ReactState) {
  return Boolean(chainId && accounts && !activating)
}
