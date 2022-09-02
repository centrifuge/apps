import { HYDRATE } from 'next-redux-wrapper'
import { Action, AnyAction } from 'redux'
import { ThunkAction } from 'redux-thunk'
import { centChainService } from '../services/centChain'
import { substrateToCentChainAddr } from '../services/centChain/substrateToCentChainAddr'

// Actions
const CONNECT = 'tinlake-ui/cent-chain-wallet/CONNECT'
const CONNECTED = 'tinlake-ui/cent-chain-wallet/CONNECTED'
const CONNECTION_ERROR = 'tinlake-ui/cent-chain-wallet/CONNECTION_ERROR'
const DISCONNECT = 'tinlake-ui/cent-chain-wallet/DISCONNECT'
const INJECT_ACCOUNTS = 'tinlake-ui/cent-chain-wallet/INJECT_ACCOUNTS'

// Errors
const ERR_NO_EXT_OR_NOT_AUTH = 'No extension or not authorized'

export interface InjectedAccount {
  name: string | undefined
  source: string
  addrInjected: string // this is the address as received from the extension. It seems that it always comes as the default Substrat SS58 encoded address, no matter what is set on the extension.
  addrCentChain: string // this is the same public key as in addrInjected, but transformed to the Centrifuge Chain network prefix.
}

export interface CentChainWalletState {
  state: 'disconnected' | 'connecting' | 'connected'
  error: null | typeof ERR_NO_EXT_OR_NOT_AUTH
  accounts: InjectedAccount[]
}

const initialState: CentChainWalletState = {
  state: 'disconnected',
  error: null,
  accounts: [],
}

export default function reducer(
  state: CentChainWalletState = initialState,
  action: AnyAction = { type: '' }
): CentChainWalletState {
  switch (action.type) {
    case HYDRATE:
      return { ...state, ...(action.payload.centChainWallet || {}) }
    case CONNECT:
      return { ...state, state: 'connecting', error: null }
    case CONNECTED:
      return { ...state, state: 'connected' }
    case CONNECTION_ERROR:
      return { ...state, state: 'disconnected', error: action.error }
    case DISCONNECT:
      return { ...state, state: 'disconnected' }
    case INJECT_ACCOUNTS:
      return { ...state, accounts: action.accounts || [] }
    default:
      return state
  }
}

export function connect(): ThunkAction<Promise<void>, { centChainWallet: CentChainWalletState }, undefined, Action> {
  return async (dispatch) => {
    dispatch({ type: CONNECT })
    try {
      await centChainService().connect((accounts) => {
        dispatch({
          type: INJECT_ACCOUNTS,
          accounts: accounts.map((a) => ({
            name: a.meta.name,
            source: a.meta.source,
            addrInjected: a.address,
            addrCentChain: substrateToCentChainAddr(a.address),
          })),
        })
      })
    } catch (e: any) {
      if (e?.message === ERR_NO_EXT_OR_NOT_AUTH) {
        dispatch({ type: CONNECTION_ERROR, error: ERR_NO_EXT_OR_NOT_AUTH })
        return
      }
      throw e
    }
    dispatch({ type: CONNECTED })
  }
}

export function disconnect(): ThunkAction<Promise<void>, { centChainWallet: CentChainWalletState }, undefined, Action> {
  return async (dispatch) => {
    dispatch({ type: DISCONNECT })
    await centChainService().disconnect()
  }
}
