import { AnyAction, Action } from 'redux';
import { ThunkAction } from 'redux-thunk';
import { networkIdToName } from '../utils/networkNameResolver';
import Apollo from '../services/apollo';
import { HYDRATE } from 'next-redux-wrapper';
import { initOnboard, getOnboard } from '../services/onboard';
import { ITinlake } from 'tinlake';
import { getDefaultHttpProvider, getTinlake } from '../services/tinlake';
import config from '../config';

// Actions
const CLEAR = 'tinlake-ui/auth/CLEAR';
const SET_AUTH_STATE = 'tinlake-ui/auth/SET_AUTH_STATE';
const RECEIVE_ADDRESS = 'tinlake-ui/auth/RECEIVE_ADDRESS';
const LOAD_PERMISSIONS = 'tinlake-ui/auth/LOAD_PERMISSIONS';
const RECEIVE_PERMISSIONS = 'tinlake-ui/auth/RECEIVE_PERMISSIONS';
const LOAD_PROXIES = 'tinlake-ui/auth/LOAD_PROXIES';
const RECEIVE_PROXIES = 'tinlake-ui/auth/RECEIVE_PROXIES';
const RECEIVE_NETWORK = 'tinlake-ui/auth/RECEIVE_NETWORK';
const RECEIVE_PROVIDER_NAME = 'tinlake-ui/auth/RECEIVE_PROVIDER_NAME';
const CLEAR_NETWORK = 'tinlake-ui/auth/CLEAR_NETWORK';

// Address is independent of the selected pool/registry.
export type Address = string;

// Permissions depend on both the address and the selected pool/registry.
export interface Permissions {
  // asset admin permissions
  canIssueLoan: boolean;
  canSetInterestRate: boolean;
  // tranche admin permissions
  canSetMinimumJuniorRatio: boolean;
  canSetRiskScore: boolean;
  canSetSeniorTrancheInterestRate: boolean;
  // lender admin permissions
  canSetInvestorAllowanceJunior: boolean;
  canSetInvestorAllowanceSenior: boolean;
  // collector permissions
  canSetLoanPrice: boolean;
  canActAsKeeper: boolean;
}

// Proxies depend on both the address and the selected pool/registry.
export type Proxies = string[];

export interface AuthState {
  address: null | Address;
  authState: null | 'authing' | 'aborted' | 'authed';
  permissionsState: null | 'loading' | 'loaded';
  permissions: null | Permissions;
  proxiesState: null | 'loading' | 'loaded';
  proxies: null | Proxies;
  network: string;
  providerName: null | string;
}

const initialState: AuthState = {
  address: null,
  authState: null,
  permissionsState: null,
  permissions: null,
  proxiesState: null,
  proxies: null,
  network: config.network,
  providerName: null
};

// Reducer
export default function reducer(state: AuthState = initialState,
                                action: AnyAction = { type: '' }): AuthState {
  switch (action.type) {
    case HYDRATE: return { ...state, ...(action.payload.auth || {}) };
    case SET_AUTH_STATE: return { ...state, authState: action.authState };
    case RECEIVE_ADDRESS: return { ...state, address: action.address };
    case CLEAR: return { ...state, address: null, authState: null, permissionsState: null, permissions: null,
      proxiesState: null, proxies: null, network: config.network };
    case LOAD_PERMISSIONS: return { ...state, permissionsState: 'loading' };
    case RECEIVE_PERMISSIONS: return { ...state, permissionsState: 'loaded', permissions: action.permissions };
    case LOAD_PROXIES: return { ...state, proxiesState: 'loading' };
    case RECEIVE_PROXIES: return { ...state, proxiesState: 'loaded', proxies: action.proxies };
    case CLEAR_NETWORK: return { ...state, network: config.network };
    case RECEIVE_NETWORK: return { ...state, network: action.network };
    case RECEIVE_PROVIDER_NAME: return { ...state, providerName: action.name };
    default: return state;
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
export function load(tinlake: ITinlake): ThunkAction<Promise<void>, { auth: AuthState }, undefined, Action> {
  return async (dispatch, getState) => {
    const { auth } = getState();
    let onboard = getOnboard();

    // onboard is already initialized, only ensure values are correct and return
    if (onboard) {
      const { address, network, wallet } = onboard.getState();
      if (address !== auth.address) { dispatch(setAddressAndLoadData(tinlake, address)); }
      const networkName = networkIdToName(network);
      if (networkName !== auth.network && networkName) { dispatch(setNetwork(networkName)); }
      if (tinlake.provider !== wallet.provider && wallet.provider) { tinlake.setProvider(wallet.provider); }
      if (wallet.name !== auth.providerName) { dispatch(setProviderName(wallet.name)); }
      if (address) { dispatch(setAuthState('authed')); }
      return;
    }

    // onboard not yet initialized, initialize now
    onboard = initOnboard({
      address: (address) => {
        dispatch(setAddressAndLoadData(tinlake, address));
      },
      network: (network) => {
        const networkName = networkIdToName(network);
        dispatch(setNetwork(networkName));
      },
      wallet: ({ provider, name }) => {
        dispatch(setProviderName(name));

        if (provider) {
          tinlake.setProvider(provider);
        }

        // store the selected wallet name to be retrieved next time the app loads
        window.localStorage.setItem('selectedWallet', name || '');
      }
    });

    // get the selectedWallet value from local storage
    const previouslySelectedWallet = window.localStorage.getItem('selectedWallet');

    // call wallet select with that value if it exists
    if (previouslySelectedWallet !== null && previouslySelectedWallet !== '') {
      dispatch(setAuthState('authing'));

      const walletSelected = await onboard.walletSelect(previouslySelectedWallet);
      if (!walletSelected) {
        dispatch(setAuthState(null));
        return;
      }

      const walletChecked = await onboard.walletCheck();
      if (!walletChecked) {
        dispatch(setAuthState(null));
        return;
      }
    }
  };
}

let openAuthPromise: Promise<void> | null = null;

// auth opens onboard wallet select. If there is already an auth process, it blocks until that auth promise is resolved.
export function auth(): ThunkAction<Promise<void>, { auth: AuthState }, undefined, Action> {
  return async (dispatch) => {
    if (openAuthPromise) {
      return await openAuthPromise;
    }

    openAuthPromise = new Promise<void>(async (resolve, reject) => {
      dispatch(setAuthState('authing'));

      const onboard = getOnboard();
      if (!onboard) {
        reject('onboard not found');
        openAuthPromise = null;
        return;
      }

      const walletSelected = await onboard.walletSelect();

      if (!walletSelected) {
        dispatch(setAuthState('aborted'));
        reject('wallet not selected');
        openAuthPromise = null;
        return;
      }

      const walletChecked = await onboard.walletCheck();
      if (!walletChecked) {
        dispatch(setAuthState('aborted'));
        reject('wallet not checked');
        openAuthPromise = null;
        return;
      }

      dispatch(setAuthState('authed'));
      resolve();
      openAuthPromise = null;
      return;
    });

    return await openAuthPromise;
  };
}

// ensureAuthed checks whether status is authed or authing, otherwise initiates auth
export function ensureAuthed(): ThunkAction<Promise<void>, { auth: AuthState }, undefined, Action> {
  return async (dispatch, getState) => {
    const state = getState();
    if (openAuthPromise) { await openAuthPromise; }

    if (state.auth.authState === 'aborted' || state.auth.authState === null) {
      return dispatch(auth());
    }

    const onboard = getOnboard();
    if (!onboard) {
      throw new Error('onboard not found');
    }
    const walletChecked = await onboard!.walletCheck();
    if (!walletChecked) {
      throw new Error('wallet not checked');
    }
  };
}

export function setAddressAndLoadData(tinlake: ITinlake, address: string):
  ThunkAction<Promise<void>, { auth: AuthState }, undefined, Action> {
  return async (dispatch) => {
    // clear if no address given
    if (!address) {
      dispatch(clear());
      return;
    }

    tinlake.setEthConfig({ from: address });

    dispatch({ address, type: RECEIVE_ADDRESS });

    dispatch(loadProxies());
    dispatch(loadPermissions(tinlake));
  };
}

export function setAuthState(authState: null | 'authing' | 'aborted' | 'authed'):
  ThunkAction<Promise<void>, { auth: AuthState }, undefined, Action> {
  return async (dispatch) => {
    dispatch({ authState, type: SET_AUTH_STATE });
  };
}

export function loadProxies():
  ThunkAction<Promise<void>, { auth: AuthState }, undefined, Action> {
  return async (dispatch, getState) => {
    const { auth } = getState();

    // don't load again if already loading
    if (auth.proxiesState === 'loading') {
      return;
    }

    if (!auth.address) {
      return;
    }

    dispatch({ type: LOAD_PROXIES });

    const result =  await Apollo.getProxies(auth.address);
    const proxies = result.data;

    dispatch({ proxies, type: RECEIVE_PROXIES });
  };
}

export function loadPermissions(tinlake: any):
  ThunkAction<Promise<void>, { auth: AuthState }, undefined, Action> {
  return async (dispatch, getState) => {
    const { auth } = getState();

    // don't load again if already loading
    if (auth.permissionsState === 'loading') {
      return;
    }

    if (!auth.address) {
      return;
    }

    if (!tinlake.canQueryPermissions) {
      return;
    }

    dispatch({ type: LOAD_PERMISSIONS });

    const [
      interestRatePermission,
      loanPricePermission,
      equityRatioPermission,
      riskScorePermission,
      investorAllowancePermissionJunior,
      investorAllowancePermissionSenior
    ] = await Promise.all([
      tinlake.canSetInterestRate(auth.address),
      tinlake.canSetLoanPrice(auth.address),
      tinlake.canSetMinimumJuniorRatio(auth.address),
      tinlake.canSetRiskScore(auth.address),
      tinlake.canSetInvestorAllowanceJunior(auth.address),
      tinlake.canSetInvestorAllowanceSenior(auth.address)
    ]);

    const permissions = {
      canSetInterestRate: interestRatePermission,
      canSetLoanPrice: loanPricePermission,
      canSetMinimumJuniorRatio: equityRatioPermission,
      canSetRiskScore: riskScorePermission,
      canSetInvestorAllowanceJunior: investorAllowancePermissionJunior,
      canSetInvestorAllowanceSenior: investorAllowancePermissionSenior
    };

    dispatch({ permissions, type: RECEIVE_PERMISSIONS });
  };
}

export function setNetwork(network: string | null):
  ThunkAction<Promise<void>, { auth: AuthState }, undefined, Action> {
  return async (dispatch, getState) => {
    if (!network) {
      dispatch({ type: CLEAR_NETWORK });
      return;
    }

    const { auth } = getState();

    // if network is already set, don't set again
    if (auth.network === network) {
      return;
    }

    dispatch({ network, type: RECEIVE_NETWORK });
  };
}

export function setProviderName(name: string | null) {
  return { name, type: RECEIVE_PROVIDER_NAME };
}

export function clear():
  ThunkAction<Promise<void>, { auth: AuthState }, undefined, Action> {
  return async (dispatch) => {
    const tinlake = getTinlake();
    if (tinlake !== null) {
      tinlake.setProvider(getDefaultHttpProvider());
      tinlake.setEthConfig({ from: '' });
    }

    const onboard = getOnboard();
    onboard?.walletReset();
    window.localStorage.removeItem('selectedWallet');

    dispatch({ type: CLEAR });
  };
}
