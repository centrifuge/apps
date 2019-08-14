import { AnyAction, Action } from 'redux';
import Tinlake, { Address } from 'tinlake';
import { ThunkAction } from 'redux-thunk';

declare var web3: any;

// Actions
const LOAD = 'tinlake-ui/auth/LOAD';
const RECEIVE = 'tinlake-ui/auth/RECEIVE';
const CLEAR = 'tinlake-ui/auth/CLEAR';
const OBSERVING_AUTH_CHANGES = 'tinlake-ui/auth/OBSERVING_AUTH_CHANGES';

export interface User {
  isAdmin: boolean;
  address: Address;
}

export interface AuthState {
  observingAuthChanges: boolean;
  state: null | 'loading' | 'loaded';
  user: null | User;
}

const initialState: AuthState = {
  observingAuthChanges: false,
  state: null,
  user: null,
};

// Reducer
export default function reducer(state: AuthState = initialState,
                                action: AnyAction = { type: '' }): AuthState {
  switch (action.type) {
    case LOAD: return { ...state, state: 'loading' };
    case RECEIVE: return { ...state, state: 'loaded', user: action.user };
    case CLEAR: return { ...state, state: 'loaded', user: null };
    case OBSERVING_AUTH_CHANGES: return { ...state, observingAuthChanges: true };
    default: return state;
  }
}

// side effects, only as applicable
// e.g. thunks, epics, etc
export function loadUser(tinlake: Tinlake, address: Address):
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
    if (auth.user && auth.user.address === address) {
      return;
    }

    dispatch({ type: LOAD });

    const isAdminPromise = tinlake.isAdmin(address);

    const user = {
      address,
      isAdmin: await isAdminPromise,
    };

    dispatch({ user, type: RECEIVE });
  };
}

let providerChecks: number;

export function observeAuthChanges(tinlake: Tinlake):
  ThunkAction<Promise<void>, { auth: AuthState }, undefined, Action> {
  return async (dispatch, getState) => {

    const state = getState();
    if (state.auth.observingAuthChanges) {
      return;
    }

    // if HTTPProvider is present, regularly check fox provider changes
    if (tinlake.provider.host) {
      if (!providerChecks) {
        // console.log('Found HTTPProvider - check for provider changes every 200 ms');
        providerChecks = setInterval(() => dispatch(observeAuthChanges(tinlake)), 2000);
      }
      return;
    }

    if (providerChecks) {
      // console.log('Provider changed, clear checking');
      clearInterval(providerChecks);
      dispatch(loadUser(tinlake, tinlake.ethConfig.from));
    }

    dispatch({ type: OBSERVING_AUTH_CHANGES });
    tinlake.provider.on('accountsChanged', (accounts: Address[]) => {
      tinlake.ethConfig = { from: accounts[0] };
      dispatch(loadUser(tinlake, accounts[0]));
    });
  };
}

export function clearUser():
  ThunkAction<Promise<void>, AuthState, undefined, Action> {
  return async (dispatch) => {
    dispatch({ type: CLEAR });
  };
}
