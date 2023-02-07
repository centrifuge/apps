import * as React from 'react'
import { EvmConnectorMeta } from './evm/connectors'
import { useConnectorState } from './evm/utils'
import { State } from './types'

const initialState: State = {
  connectedType: null,
  walletDialog: {
    view: null,
    network: null,
    wallet: null,
  },
  evm: {
    selectedWallet: null,
  },
  substrate: {
    accounts: null,
    selectedAccountAddress: null,
    proxyAddress: null,
    selectedWallet: null,
  },
}
export type Action =
  | {
      type: 'reset'
    }
  | {
      type: 'showWalletDialog'
      payload?: Partial<State['walletDialog']>
    }
  | {
      type: 'showWalletDialogAccounts'
      payload?: Partial<State['walletDialog']>
    }
  | {
      type: 'closeWalletDialog'
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
      type: 'setConnectedType'
      payload: State['connectedType']
    }

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'showWalletDialog':
      return {
        ...state,
        walletDialog: action.payload
          ? { ...state.walletDialog, ...action.payload }
          : { view: 'wallets', network: null, wallet: null },
      }
    case 'showWalletDialogAccounts':
      return {
        ...state,
        walletDialog: {
          view: 'accounts',
          wallet: state[state.connectedType!].selectedWallet,
          network:
            state.connectedType === 'substrate'
              ? 'centrifuge'
              : action.payload?.network ?? state.walletDialog.network ?? 1,
        },
      }
    case 'closeWalletDialog':
      return {
        ...state,
        walletDialog: initialState.walletDialog,
      }
    case 'substrateSetState':
      return {
        ...state,
        substrate: {
          ...state.substrate,
          ...action.payload,
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
    case 'setConnectedType':
      return {
        ...state,
        connectedType: action.payload,
      }

    case 'reset':
      return initialState
  }
}

const PERSIST_KEY = 'centrifugeWalletPersist'
type PersistState = {
  type: 'substrate' | 'evm'
  wallet: string
  address: string
  proxy?: string | null
  chainId?: number
}

export function getPersisted(): Partial<PersistState> {
  try {
    return JSON.parse(localStorage.getItem(PERSIST_KEY) ?? '{}') as PersistState
  } catch {
    return {}
  }
}
export function persist(state: Partial<PersistState> | null) {
  if (!state) {
    localStorage.removeItem(PERSIST_KEY)
  } else {
    localStorage.setItem(PERSIST_KEY, JSON.stringify({ ...getPersisted(), ...state }))
  }
}

export function useWalletStateInternal(evmConnectors: EvmConnectorMeta[]) {
  const [reducerState, dispatch] = React.useReducer(reducer, initialState)

  const evmState = useConnectorState(reducerState.evm.selectedWallet?.connector)

  const state = React.useMemo(
    () => ({
      ...reducerState,
      evm: {
        ...reducerState.evm,
        accounts: evmState.accounts,
        chainId: evmState.chainId,
      },
    }),
    [reducerState, evmState]
  )

  React.useEffect(() => {
    if (state.connectedType === 'evm') {
      if (evmState.accounts?.length)
        persist({
          type: 'evm',
          wallet: evmConnectors.find((c) => c.connector === state.evm.selectedWallet!.connector)!.id,
          address: evmState.accounts[0],
          chainId: evmState.chainId,
        })
    } else if (state.connectedType === 'substrate') {
      if (state.substrate.selectedAccountAddress)
        persist({
          type: 'substrate',
          wallet: state.substrate.selectedWallet?.extensionName,
          address: state.substrate.selectedAccountAddress,
          proxy: state.substrate.proxyAddress,
        })
    }
  }, [state])

  return [state, dispatch] as const
}
