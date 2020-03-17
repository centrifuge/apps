import { AnyAction, Action } from 'redux';
import Tinlake, { Address } from '../containers/Loan/Issue/node_modules/tinlake';
import { ThunkAction } from 'redux-thunk';
import { networkIdToName } from '../utils/networkNameResolver';

// Actions
const LOAD = 'tinlake-ui/auth/LOAD';
const RECEIVE = 'tinlake-ui/auth/RECEIVE';
const CLEAR = 'tinlake-ui/auth/CLEAR';
const CLEAR_NETWORK = 'tinlake-ui/auth/CLEAR_NETWORK';
const RECEIVE_NETWORK = 'tinlake-ui/auth/RECEIVE_NETWORK';
const OBSERVING_AUTH_CHANGES = 'tinlake-ui/auth/OBSERVING_AUTH_CHANGES';

export interface User {
  address: Address;
  permissions: Permissions;
}

export interface Permissions {
  // loan admin permissions
  canIssueLoan: boolean;
  canSetCeiling: boolean;
  canSetInterestRate: boolean;
  // tranche admin permissions
  canSetEquityRatio: boolean;
  canSetRiskScore: boolean;
  canSetSeniorTrancheInterestRate: boolean;
  // lender admin permissions
  canSetInvestorAllowanceJunior: boolean;
  // collector permissions
  canSetThreshold: boolean;
  canSetLoanPrice: boolean;
  canActAsKeeper: boolean;
  ownerOf: Array<number>;
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
    case LOAD: return { ...state, state: 'loading' };
    case RECEIVE: return { ...state, state: 'loaded', user: action.user };
    case CLEAR: return { ...state, state: 'loaded', user: null };
    case OBSERVING_AUTH_CHANGES: return { ...state, observingAuthChanges: true };
    case CLEAR_NETWORK: return { ...state, network: null };
    case RECEIVE_NETWORK: return { ...state, network: action.network };
    default: return state;
  }
}

// side effects, only as applicable
// e.g. thunks, epics, etc
export function loadUser(tinlake: any, address: Address):
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

    const ceilingPermission = await tinlake.canSetCeiling(address)
    const interestRatePermission = await tinlake.canSetInterestRate(address)
    const thresholdPermission = await tinlake.canSetThreshold(address)
    const loanPricePermission = await tinlake.canSetLoanPrice(address)
    const equityRatioPermission = await tinlake.canSetEquityRatio(address)
    const riskScorePermission = await tinlake.canSetRiskScore(address)
    const investorAllowancePermissionJunior = await tinlake.canSetInvestorAllowanceJunior(address)

    const user = {
      address,
      permissions: {
        canSetCeiling: ceilingPermission,
        canSetInterestRate: interestRatePermission,
        canSetThreshold: thresholdPermission,
        canSetLoanPrice: loanPricePermission,
        canSetEquityRatio: equityRatioPermission,
        canSetRiskScore: riskScorePermission,
        canSetInvestorAllowanceJunior: investorAllowancePermissionJunior
        // TODO: canActAsKeeper
      }
    }
    dispatch({ user, type: RECEIVE });
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
