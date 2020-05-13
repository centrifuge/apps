import { AnyAction, Action } from 'redux';
import { ThunkAction } from 'redux-thunk';
import { networkIdToName } from '../utils/networkNameResolver';
import Apollo from '../services/apollo';
import { HYDRATE } from 'next-redux-wrapper';

// Actions
const LOAD = 'tinlake-ui/auth/LOAD';
const RECEIVE = 'tinlake-ui/auth/RECEIVE';
const CLEAR = 'tinlake-ui/auth/CLEAR';
const CLEAR_NETWORK = 'tinlake-ui/auth/CLEAR_NETWORK';
const RECEIVE_NETWORK = 'tinlake-ui/auth/RECEIVE_NETWORK';
const RECEIVE_PROXIES = 'tinlake-ui/auth/RECEIVE_PROXIES';
const OBSERVING_AUTH_CHANGES = 'tinlake-ui/auth/OBSERVING_AUTH_CHANGES';

export interface User {
  address: string;
  permissions: Permissions;
  proxies: string[];
}

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

export interface AuthState {
  observingAuthChanges: boolean;
  state: null | 'loading' | 'loaded';
  user: null | User;
  network: null | string;
}

const initialState: AuthState = {
  observingAuthChanges: false,
  state: null,
  user: null,
  network: null
};

// Reducer
export default function reducer(state: AuthState = initialState,
                                action: AnyAction = { type: '' }): AuthState {
  switch (action.type) {
    case HYDRATE: return { ...state, ...(action.payload.auth || {}) };
    case LOAD: return { ...state, state: 'loading' };
    case RECEIVE: return { ...state, state: 'loaded', user: action.user };
    case CLEAR: return { ...state, state: 'loaded', user: null };
    case OBSERVING_AUTH_CHANGES: return { ...state, observingAuthChanges: true };
    case CLEAR_NETWORK: return { ...state, network: null };
    case RECEIVE_NETWORK: return { ...state, network: action.network };
    case RECEIVE_PROXIES: return { ...state, user: action.user };
    default: return state;
  }
}

// side effects, only as applicable
// e.g. thunks, epics, etc
export function loadUser(tinlake: any, address: string):
  ThunkAction<Promise<void>, { auth: AuthState }, undefined, Action> {
  return async (dispatch, getState) => {
    const { auth } = getState();
    // don't load again if already loading
    if (auth.state === 'loading') {
      return;
    }

    // clear user if no address given
    if (!address) {
      dispatch({ type: CLEAR });
      return;
    }

    // if user is already loaded, don't load again
    if (auth.user && auth.user.address.toLowerCase() === address.toLowerCase()) {
      return;
    }

    dispatch({ type: LOAD });

    const interestRatePermission = await tinlake.canSetInterestRate(address);
    const loanPricePermission = await tinlake.canSetLoanPrice(address);
    const equityRatioPermission = await tinlake.canSetMinimumJuniorRatio(address);
    const riskScorePermission = await tinlake.canSetRiskScore(address);
    const investorAllowancePermissionJunior = await tinlake.canSetInvestorAllowanceJunior(address);
    const investorAllowancePermissionSenior = await tinlake.canSetInvestorAllowanceSenior(address);
    const result =  await Apollo.getProxies(address);
    const proxies = result.data;
    const user = {
      address,
      proxies,
      permissions: {
        canSetInterestRate: interestRatePermission,
        canSetLoanPrice: loanPricePermission,
        canSetMinimumJuniorRatio: equityRatioPermission,
        canSetRiskScore: riskScorePermission,
        canSetInvestorAllowanceJunior: investorAllowancePermissionJunior,
        canSetInvestorAllowanceSenior: investorAllowancePermissionSenior
        // TODO: canActAsKeeper
      }
    };
    dispatch({ user, type: RECEIVE });
  };
}

export function loadUserProxies():
ThunkAction<Promise<void>, { auth: AuthState }, undefined, Action> {
  return async (dispatch, getState) => {
    const { auth } = getState();
    // clear user if no address given
    if (!auth.user || !auth.user.address) {
      dispatch({ type: CLEAR });
      return;
    }

    const result =  await Apollo.getProxies(auth.user.address);
    const proxies = result.data;
    const user = {
      ...auth.user,
      proxies
    };
    dispatch({ user, type: RECEIVE_PROXIES });
  };
}

export function loadNetwork(network: string):
  ThunkAction<Promise<void>, { auth: AuthState }, undefined, Action> {
  return async (dispatch, getState) => {
    const { auth } = getState();

    if (!network) {
      dispatch({ type: CLEAR_NETWORK });
      return;
    }

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

    const state = getState();
    if (state.auth.observingAuthChanges) {
      return;
    }
    // if HTTPProvider is present, regularly check for provider changes
    if (tinlake.provider.host) {
      if (!providerChecks) {
        // Found HTTPProvider - check for provider changes every 100 ms'
        providerChecks = setInterval(() => dispatch(observeAuthChanges(tinlake)), 100);
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
    dispatch({ type: CLEAR });
  };
}
