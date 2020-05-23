import { AnyAction, Action } from 'redux';
import { ThunkAction } from 'redux-thunk';
import { networkIdToName } from '../utils/networkNameResolver';
import Apollo from '../services/apollo';
import { HYDRATE } from 'next-redux-wrapper';

// Actions
const CLEAR = 'tinlake-ui/auth/CLEAR';
const RECEIVE_ADDRESS = 'tinlake-ui/auth/RECEIVE_ADDRESS';
const LOAD_PERMISSIONS = 'tinlake-ui/auth/LOAD_PERMISSIONS';
const RECEIVE_PERMISSIONS = 'tinlake-ui/auth/RECEIVE_PERMISSIONS';
const LOAD_PROXIES = 'tinlake-ui/auth/LOAD_PROXIES';
const RECEIVE_PROXIES = 'tinlake-ui/auth/RECEIVE_PROXIES';
const RECEIVE_NETWORK = 'tinlake-ui/auth/RECEIVE_NETWORK';
const CLEAR_NETWORK = 'tinlake-ui/auth/CLEAR_NETWORK';
const OBSERVING_AUTH_CHANGES = 'tinlake-ui/auth/OBSERVING_AUTH_CHANGES';

// Address is independent of the selected pool/registry.
export type Address = string;

// Permissions depend on both the user and the selected pool/registry.
export interface Permissions {
  // loan admin permissions
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

// Proxies depend on both the user and the selected pool/registry.
export type Proxies = string[];

export interface AuthState {
  observingAuthChanges: boolean;
  address: null | Address;
  permissionsState: null | 'loading' | 'loaded';
  permissions: null | Permissions;
  proxiesState: null | 'loading' | 'loaded';
  proxies: null | Proxies;
  network: null | string;
}

const initialState: AuthState = {
  observingAuthChanges: false,
  address: null,
  permissionsState: null,
  permissions: null,
  proxiesState: null,
  proxies: null,
  network: null
};

// Reducer
export default function reducer(state: AuthState = initialState,
                                action: AnyAction = { type: '' }): AuthState {
  switch (action.type) {
    case HYDRATE: return { ...state, ...(action.payload.auth || {}) };
    case RECEIVE_ADDRESS: return { ...state, address: action.address };
    case CLEAR: return { ...state, address: null, permissions: null };
    case LOAD_PERMISSIONS: return { ...state, permissionsState: 'loading' };
    case RECEIVE_PERMISSIONS: return { ...state, permissionsState: 'loaded', permissions: action.permissions };
    case LOAD_PROXIES: return { ...state, proxiesState: 'loading' };
    case RECEIVE_PROXIES: return { ...state, proxiesState: 'loaded', proxies: action.proxies };
    case OBSERVING_AUTH_CHANGES: return { ...state, observingAuthChanges: true };
    case CLEAR_NETWORK: return { ...state, network: null };
    case RECEIVE_NETWORK: return { ...state, network: action.network };
    default: return state;
  }
}

// side effects, only as applicable
// e.g. thunks, epics, etc
export function loadUser(tinlake: any, address: string):
  ThunkAction<Promise<void>, { auth: AuthState }, undefined, Action> {
  return async (dispatch) => {
    console.log(`ducks/auth.ts loadUser(tinlake: _, address: ${address}), tinlake.addresses`, tinlake.contractAddresses);

    // clear if no address given
    if (!address) {
      dispatch({ type: CLEAR });
      return;
    }

    dispatch({ address, type: RECEIVE_ADDRESS });

    dispatch(loadProxies());
    dispatch(loadPermissions(tinlake));
  };
}

export function loadProxies():
  ThunkAction<Promise<void>, { auth: AuthState }, undefined, Action> {
  return async (dispatch, getState) => {
    console.log('ducks/auth.ts loadProxies()');

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
    console.log('ducks/auth.ts loadPermissions(tinlake: _), tinlake.addresses', tinlake.contractAddresses);

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
      // TODO: canActAsKeeper
    };

    console.log('ducks/auth.ts loadPermissions: got permissions:', permissions);

    dispatch({ permissions, type: RECEIVE_PERMISSIONS });
  };
}

export function loadNetwork(network: string):
  ThunkAction<Promise<void>, { auth: AuthState }, undefined, Action> {
  return async (dispatch, getState) => {
    console.log('ducks/auth.ts loadNetwork');

    if (!network) {
      dispatch({ type: CLEAR_NETWORK });
      return;
    }

    const { auth } = getState();

    const networkName = networkIdToName(network);
    // if network is already loaded, don't load again
    if (auth.network === networkName) {
      return;
    }

    dispatch({ network: networkName, type: RECEIVE_NETWORK });
  };
}

let providerChecks: number;

export function observeAuthChanges(tinlake: any):
  ThunkAction<Promise<void>, { auth: AuthState }, undefined, Action> {
  return async (dispatch, getState) => {

    console.log('ducks/auth.ts observeAuthChanges');

    const state = getState();
    if (state.auth.observingAuthChanges) {
      return;
    }
    // if HTTPProvider is present, regularly check for provider changes
    if (tinlake.provider.host) {
      if (!providerChecks) {
        // Found HTTPProvider - check for provider changes every 100 ms'
        providerChecks = setInterval(() => dispatch(observeAuthChanges(tinlake)), 500);
      }
      return;
    }

    if (providerChecks) {
      // 'Provider changed, clear checking'
      clearInterval(providerChecks);
      const providerConfig = tinlake.provider && tinlake.provider.publicConfigStore && tinlake.provider.publicConfigStore.getState();
      if (providerConfig) {
        dispatch(loadUser(tinlake, providerConfig.selectedAddress));
        dispatch(loadNetwork(providerConfig.networkVersion));
      } else {
        dispatch(loadUser(tinlake, tinlake.ethConfig.from));
      }
    }

    dispatch({ type: OBSERVING_AUTH_CHANGES });

    tinlake.provider.publicConfigStore.on('update',  (state: any) => {
      tinlake.ethConfig = { from: state.selectedAddress };
      dispatch(loadNetwork(state.networkVersion));
      dispatch(loadUser(tinlake, state.selectedAddress));
    });
  };
}

export function clearUser():
  ThunkAction<Promise<void>, AuthState, undefined, Action> {
  return async (dispatch) => {
    console.log('ducks/auth.ts clearUser');

    dispatch({ type: CLEAR });
  };
}
