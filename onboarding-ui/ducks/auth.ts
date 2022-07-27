import { ITinlake } from '@centrifuge/tinlake-js'
import * as Sentry from '@sentry/react'
import { ethers } from 'ethers'
import { useSelector } from 'react-redux'
import { Action, AnyAction } from 'redux'
import { ThunkAction } from 'redux-thunk'
import config from '../config'
import Apollo from '../services/apollo'
import { getOnboard, initOnboard } from '../services/onboard'
import { getTinlake } from '../services/tinlake'
import { networkIdToName } from '../utils/networkNameResolver'

// Actions
const CLEAR = 'tinlake-ui/auth/CLEAR'
const SET_AUTH_STATE = 'tinlake-ui/auth/SET_AUTH_STATE'
const RECEIVE_ADDRESS = 'tinlake-ui/auth/RECEIVE_ADDRESS'
const LOAD_PERMISSIONS = 'tinlake-ui/auth/LOAD_PERMISSIONS'
const RECEIVE_PERMISSIONS = 'tinlake-ui/auth/RECEIVE_PERMISSIONS'
const LOAD_PROXIES = 'tinlake-ui/auth/LOAD_PROXIES'
const RECEIVE_PROXIES = 'tinlake-ui/auth/RECEIVE_PROXIES'
const RECEIVE_NETWORK = 'tinlake-ui/auth/RECEIVE_NETWORK'
const RECEIVE_PROVIDER_NAME = 'tinlake-ui/auth/RECEIVE_PROVIDER_NAME'
const CLEAR_NETWORK = 'tinlake-ui/auth/CLEAR_NETWORK'

// Address is independent of the selected pool/registry.
export type Address = string

// Permissions depend on both the address and the selected pool/registry.
export interface Permissions {
  // asset admin permissions
  canSetInterestRate: boolean
  // tranche admin permissions
  canSetMinimumJuniorRatio: boolean
  canSetRiskScore: boolean
  // lender admin permissions
  canSetInvestorAllowanceJunior: boolean
  canSetInvestorAllowanceSenior: boolean
  // collector permissions
  canSetLoanPrice: boolean
}

export interface PermissionsV3 {
  // asset admin permissions
  canSetMaxReserve: boolean
  canSetInterestRate: boolean
  // tranche admin permissions
  canSetMinimumJuniorRatio: boolean
  canSetRiskScore: boolean
  // collector permissions
  canSetLoanPrice: boolean
  // memberlist permissions
  canAddToJuniorMemberList: boolean
  canAddToSeniorMemberList: boolean
}

// Proxies depend on both the address and the selected pool/registry.
export type Proxies = string[]

export interface AuthState {
  address: null | Address
  authState: null | 'initialAuthing' | 'authing' | 'aborted' | 'authed'
  permissionsState: null | 'loading' | 'loaded'
  permissions: null | Permissions | PermissionsV3
  proxiesState: null | 'loading' | 'loaded'
  proxies: null | Proxies
  network: string
  providerName: null | string
}

const initialState: AuthState = {
  address: null,
  authState: null,
  permissionsState: null,
  permissions: null,
  proxiesState: null,
  proxies: null,
  network: config.network,
  providerName: null,
}

// Reducer
export default function reducer(state: AuthState = initialState, action: AnyAction = { type: '' }): AuthState {
  switch (action.type) {
    case SET_AUTH_STATE:
      return { ...state, authState: action.authState }
    case RECEIVE_ADDRESS:
      return { ...state, address: action.address }
    case CLEAR:
      return {
        ...state,
        address: null,
        authState: null,
        permissionsState: null,
        permissions: null,
        proxiesState: null,
        proxies: null,
        network: config.network,
      }
    case LOAD_PERMISSIONS:
      return { ...state, permissionsState: 'loading' }
    case RECEIVE_PERMISSIONS:
      return { ...state, permissionsState: 'loaded', permissions: action.permissions }
    case LOAD_PROXIES:
      return { ...state, proxiesState: 'loading' }
    case RECEIVE_PROXIES:
      return { ...state, proxiesState: 'loaded', proxies: action.proxies }
    case CLEAR_NETWORK:
      return { ...state, network: config.network }
    case RECEIVE_NETWORK:
      return { ...state, network: action.network }
    case RECEIVE_PROVIDER_NAME:
      return { ...state, providerName: action.name }
    default:
      return state
  }
}

// side effects, only as applicable
// e.g. thunks, epics, etc

// load loads onboard if not yet loaded, connects if the user previously chose a wallet and subscribes to changes. This
// function is called in different places and should not re-initialize onboard on every load. Therefore, onboard is a
// singleton. Unfortunately that implies that the subscriptions are not re-triggered for the initial load if a
// navigation event between pages, which discards the redux state, but does not discard onboard. Putting onboard into
// the state would work, but it would lead to two sources of truth. Consequently, we keep onboard as an external
// stateful API here and manually sync values over on load.
export function load(
  tinlake: ITinlake,
  debugAddress: string | null
): ThunkAction<Promise<void>, { auth: AuthState }, undefined, Action> {
  return async (dispatch, getState) => {
    const { auth } = getState()
    let onboard = getOnboard()

    // onboard is already initialized, only ensure values are correct and return
    if (onboard) {
      const state = onboard.getState()
      const { network, wallet } = state
      const address = debugAddress || state.address

      if (address !== auth.address) {
        dispatch(setAddressAndLoadData(tinlake, address))
      }
      const networkName = networkIdToName(network)
      if (networkName !== auth.network && networkName) {
        dispatch(setNetwork(networkName))
      }

      if (tinlake.provider !== wallet.provider && wallet.provider) {
        const web3Provider = new ethers.providers.Web3Provider(wallet.provider)
        const rpcProvider = new ethers.providers.JsonRpcProvider(config.rpcUrl)
        const fallbackProvider = new ethers.providers.FallbackProvider([web3Provider, rpcProvider])

        tinlake.setProviderAndSigner(fallbackProvider, web3Provider.getSigner(), web3Provider.provider)
      }

      if (wallet.name !== auth.providerName) {
        dispatch(setProviderName(wallet.name))
      }
      if (address) {
        dispatch(setAuthState('authed'))
      }
      return
    }

    // onboard not yet initialized, initialize now
    onboard = initOnboard({
      address: (address) => {
        // TODO: when you switch your account in Metamask, this address hook get called, but the wallet subscription
        // is not always being called. We should investigate whether this is an issue with the bnc-onboard library or
        // our usage/implementation of the library.
        dispatch(setAddressAndLoadData(tinlake, debugAddress || address))
      },
      network: (network) => {
        const networkName = networkIdToName(network)
        dispatch(setNetwork(networkName))
      },
      wallet: (wallet) => {
        dispatch(setProviderName(wallet.name))

        if (wallet.provider) {
          const web3Provider = new ethers.providers.Web3Provider(wallet.provider)
          const rpcProvider = new ethers.providers.JsonRpcProvider(config.rpcUrl)
          const fallbackProvider = new ethers.providers.FallbackProvider([web3Provider, rpcProvider])

          tinlake.setProviderAndSigner(fallbackProvider, web3Provider.getSigner(), web3Provider.provider)
        } else {
          const rpcProvider = new ethers.providers.JsonRpcProvider(config.rpcUrl)
          tinlake.setProviderAndSigner(rpcProvider)
        }

        // store the selected wallet name to be retrieved next time the app loads
        window.localStorage.setItem('selectedWallet', wallet.name || '')
      },
    })

    // get the selectedWallet value from local storage
    const previouslySelectedWallet = window.localStorage.getItem('selectedWallet')

    // call wallet select with that value if it exists
    if (previouslySelectedWallet !== null && previouslySelectedWallet !== '') {
      dispatch(setAuthState('initialAuthing'))

      const walletSelected = await onboard.walletSelect(previouslySelectedWallet)
      if (!walletSelected) {
        dispatch(setAuthState(null))
        return
      }

      const walletChecked = await onboard.walletCheck()
      if (!walletChecked) {
        dispatch(setAuthState(null))
        return
      }
    }
  }
}

let openAuthPromise: Promise<void> | null = null

// auth opens onboard wallet select. If there is already an auth process, it blocks until that auth promise is resolved.
export function auth(): ThunkAction<Promise<void>, { auth: AuthState }, undefined, Action> {
  return async (dispatch) => {
    if (openAuthPromise) {
      return await openAuthPromise
    }

    // eslint-disable-next-line no-async-promise-executor
    openAuthPromise = new Promise<void>(async (resolve, reject) => {
      dispatch(setAuthState('authing'))

      const onboard = getOnboard()
      if (!onboard) {
        reject('onboard not found')
        openAuthPromise = null
        return
      }

      const walletSelected = await onboard.walletSelect()

      if (!walletSelected) {
        dispatch(setAuthState('aborted'))
        reject('wallet not selected')
        openAuthPromise = null
        return
      }

      const walletChecked = await onboard.walletCheck()
      if (!walletChecked) {
        dispatch(setAuthState('aborted'))
        reject('wallet not checked')
        openAuthPromise = null
        return
      }

      dispatch(setAuthState('authed'))
      resolve()
      openAuthPromise = null
      return
    })

    return await openAuthPromise
  }
}

// ensureAuthed checks whether status is authed or authing, otherwise initiates auth
export function ensureAuthed(): ThunkAction<Promise<void>, { auth: AuthState }, undefined, Action> {
  return async (dispatch, getState) => {
    const state = getState()
    if (openAuthPromise) {
      await openAuthPromise
    }

    if (state.auth.authState === 'aborted' || state.auth.authState === null) {
      return dispatch(auth())
    }

    const onboard = getOnboard()
    if (!onboard) {
      throw new Error('onboard not found')
    }
    const walletChecked = await onboard!.walletCheck()
    if (!walletChecked) {
      throw new Error('wallet not checked')
    }
  }
}

export function setAddressAndLoadData(
  tinlake: ITinlake,
  address: string
): ThunkAction<Promise<void>, { auth: AuthState }, undefined, Action> {
  return async (dispatch) => {
    // clear if no address given
    if (!address) {
      dispatch(clear())
      return
    }

    dispatch({ address, type: RECEIVE_ADDRESS })
    dispatch(setAuthState('authed'))

    dispatch(loadProxies())
    dispatch(loadPermissions(tinlake))

    if (config.enableErrorLogging) Sentry.setUser({ id: address })
  }
}

export function setAuthState(
  authState: null | 'initialAuthing' | 'authing' | 'aborted' | 'authed'
): ThunkAction<Promise<void>, { auth: AuthState }, undefined, Action> {
  return async (dispatch) => {
    dispatch({ authState, type: SET_AUTH_STATE })
  }
}

export function loadProxies(): ThunkAction<Promise<void>, { auth: AuthState }, undefined, Action> {
  return async (dispatch, getState) => {
    const { auth } = getState()

    // don't load again if already loading
    if (auth.proxiesState === 'loading') {
      return
    }

    if (!auth.address) {
      return
    }

    dispatch({ type: LOAD_PROXIES })

    const result = await Apollo.getProxies(auth.address)
    const proxies = result.data

    dispatch({ proxies, type: RECEIVE_PROXIES })
  }
}

export function loadPermissions(tinlake: ITinlake): ThunkAction<Promise<void>, { auth: AuthState }, undefined, Action> {
  return async (dispatch, getState) => {
    // If no addresses are loaded, we are not in a pool, and can't check permisions (nor do we need to)
    if (Object.keys(tinlake.contractAddresses).length === 0) return

    const { auth } = getState()

    // don't load again if already loading
    if (auth.permissionsState === 'loading') {
      return
    }

    if (!auth.address) {
      return
    }

    if (!tinlake.canQueryPermissions()) {
      return
    }

    dispatch({ type: LOAD_PERMISSIONS })

    const [
      maxReservePermission,
      interestRatePermission,
      loanPricePermission,
      equityRatioPermission,
      riskScorePermission,
      juniorMemberListPermission,
      seniorMemberListPermission,
    ] = await Promise.all([
      tinlake.canSetMaxReserve(auth.address),
      tinlake.canSetSeniorTrancheInterest(auth.address),
      tinlake.canSetLoanPrice(auth.address),
      tinlake.canSetMinimumJuniorRatio(auth.address),
      tinlake.canSetRiskScore(auth.address),
      tinlake.canAddToJuniorMemberList(auth.address),
      tinlake.canAddToSeniorMemberList(auth.address),
    ])

    const permissions = {
      canSetMaxReserve: maxReservePermission,
      canSetInterestRate: interestRatePermission,
      canSetLoanPrice: loanPricePermission,
      canSetMinimumJuniorRatio: equityRatioPermission,
      canSetRiskScore: riskScorePermission,
      canAddToJuniorMemberList: juniorMemberListPermission,
      canAddToSeniorMemberList: seniorMemberListPermission,
    }

    dispatch({ permissions, type: RECEIVE_PERMISSIONS })
  }
}

export function setNetwork(network: string | null): ThunkAction<Promise<void>, { auth: AuthState }, undefined, Action> {
  return async (dispatch, getState) => {
    if (!network) {
      dispatch({ type: CLEAR_NETWORK })
      return
    }

    const { auth } = getState()

    // if network is already set, don't set again
    if (auth.network === network) {
      return
    }

    if (config.enableErrorLogging) {
      Sentry.setContext('network', {
        name: network,
      })
    }

    dispatch({ network, type: RECEIVE_NETWORK })
  }
}

export function setProviderName(name: string | null) {
  if (name && config.enableErrorLogging) {
    Sentry.setContext('wallet', {
      name,
    })
  }

  return { name, type: RECEIVE_PROVIDER_NAME }
}

export function clear(): ThunkAction<Promise<void>, { auth: AuthState }, undefined, Action> {
  return async (dispatch) => {
    const tinlake = getTinlake()
    if (tinlake !== null) {
      const rpcProvider = new ethers.providers.JsonRpcProvider(config.rpcUrl)
      tinlake.setProviderAndSigner(rpcProvider)
    }

    const onboard = getOnboard()
    onboard?.walletReset()
    window.localStorage.removeItem('selectedWallet')

    dispatch({ type: CLEAR })
  }
}

// Hooks
export const useAuth = (): AuthState => useSelector<any, AuthState>((state) => state.auth)
