import { computeMultisig, Multisig } from '@centrifuge/centrifuge-js'
import { isAddress } from '@polkadot/util-crypto'
import { GnosisSafe } from '@web3-react/gnosis-safe'
import { Web3ReactState } from '@web3-react/types'
import * as React from 'react'
import { ConnectorMeta } from './multichain/connectors'
import { useConnectorState, Web3ReactMultichainState } from './multichain/utils'
import { State } from './types'

const PERSIST_KEY = 'centrifugeWalletPersist_v2'
const SUBSTRATE_MULTISIGS_PERSIST_KEY = 'centrifugeWalletPersistMultisigs'

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
  multichain: {
    selectedWallet: null,
  },
  substrate: {
    accounts: null,
    selectedAccountAddress: null,
    proxyAddresses: null,
    selectedWallet: null,
    multisigAddress: null,
    multisigs: getPersistedMultisigs().map(computeMultisig),
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
      type: 'substrateAddMultisig'
      payload: Multisig
    }
  | {
      type: 'evmSetState'
      payload: Partial<State['evm']>
    }
  | {
      type: 'multichainSetState'
      payload: Partial<State['multichain']>
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
          : { view: 'networks', network: null, wallet: null },
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
    case 'substrateAddMultisig': {
      if (!action.payload.signers.every((addr) => isAddress(addr))) return state

      const newMulti = computeMultisig(action.payload)
      if (state.substrate.multisigs.find((m) => m.address === newMulti.address)) return state
      return {
        ...state,
        substrate: {
          ...state.substrate,
          multisigs: [...state.substrate.multisigs, computeMultisig(action.payload)],
        },
      }
    }
    case 'evmSetState':
      return {
        ...state,
        evm: {
          ...state.evm,
          ...action.payload,
        },
      }
    case 'multichainSetState':
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

type PersistState = {
  type: 'substrate' | 'evm' | 'multichain'
  wallet: string
  address: string
}

export function getPersistedMultisigs(): Multisig[] {
  try {
    return JSON.parse(localStorage.getItem(SUBSTRATE_MULTISIGS_PERSIST_KEY) ?? '[]')
  } catch {
    return []
  }
}
export function persistMultisigs(multisigs?: Multisig[]) {
  if (!multisigs) {
    localStorage.removeItem(SUBSTRATE_MULTISIGS_PERSIST_KEY)
  } else {
    localStorage.setItem(SUBSTRATE_MULTISIGS_PERSIST_KEY, JSON.stringify(multisigs))
  }
}

export function getPersisted(): Partial<PersistState> {
  try {
    return JSON.parse(localStorage.getItem(PERSIST_KEY) ?? '{}')
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

export function useWalletStateInternal(evmConnectors: ConnectorMeta[], multichainConnectors: ConnectorMeta[]) {
  const [reducerState, dispatch] = React.useReducer(reducer, initialState)

  const evmState = useConnectorState(reducerState.evm.selectedWallet?.connector) as Web3ReactState
  const multichainState = useConnectorState(
    reducerState.multichain.selectedWallet?.connector
  ) as Web3ReactMultichainState

  console.log('reducerState', reducerState, evmState)

  const state = React.useMemo(() => {
    return {
      ...reducerState,
      evm: {
        ...reducerState.evm,
        accounts: evmState.accounts,
        chainId: evmState.chainId,
      },
      multichain: {
        ...reducerState.multichain,
        accounts: multichainState.accounts,
        chainId: multichainState.chainId,
      },
    }
  }, [reducerState, evmState])

  React.useEffect(() => {
    if (state.connectedType === 'evm') {
      if (evmState.accounts?.length && !(state.evm.selectedWallet!.connector instanceof GnosisSafe)) {
        persist({
          type: 'evm',
          wallet: evmConnectors.find((c) => c.connector === state.evm.selectedWallet!.connector)!.id,
          address: evmState.accounts[0],
        })
      }
      if (!evmState.accounts) {
        dispatch({ type: 'reset' })
      }
    } else if (state.connectedType === 'substrate') {
      if (state.substrate.selectedAccountAddress) {
        persist({
          type: 'substrate',
          wallet: state.substrate.selectedWallet?.extensionName,
          address: state.substrate.selectedAccountAddress,
        })
      }
    } else if (state.connectedType === 'multichain') {
      if (multichainState.accounts?.length && !(state.multichain.selectedWallet!.connector instanceof GnosisSafe)) {
        persist({
          type: 'multichain',
          wallet: multichainConnectors.find((c) => c.connector === state.multichain.selectedWallet!.connector)!.id,
          address: multichainState.accounts[0],
        })
      }
    }
    persistMultisigs(state.substrate.multisigs)
  }, [state])

  return [state, dispatch] as const
}
