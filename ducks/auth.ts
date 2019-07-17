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
    case CLEAR: return { ...state, state: null, user: null };
    case OBSERVING_AUTH_CHANGES: return { ...state, observingAuthChanges: true };
    default: return state;
  }
}

// side effects, only as applicable
// e.g. thunks, epics, etc
export function authUser(tinlake: Tinlake, address: Address):
  ThunkAction<Promise<void>, { auth: AuthState }, undefined, Action> {
  return async (dispatch, getState) => {
    if (!address) {
      dispatch({ type: CLEAR });
      return;
    }

    const { auth } = getState();
    if (auth.user && auth.user.address === address) {
      return;
    }

    dispatch({ type: LOAD });

    const isAdminPromise = tinlake.isAdmin(address);

    const user = {
      address,
      isAdmin: await isAdminPromise,
    };

    console.log('Will update authed user to:', user);
    dispatch({ user, type: RECEIVE });
  };
}

let providerChecks: number;

export function observeAuthChanges(tinlake: Tinlake):
  ThunkAction<Promise<void>, { auth: AuthState }, undefined, Action> {
  return async (dispatch, getState) => {
    console.log('Observe auth changes');

    // if HTTPProvider is present, regularly check fox provider changes
    if (tinlake.provider.host) {
      if (!providerChecks) {
        console.log('Found HTTPProvider - check for provider changes every 200 ms');
        providerChecks = setInterval(() => dispatch(observeAuthChanges(tinlake)), 2000);
      }
      return;
    }

    if (providerChecks) {
      console.log('Provider changed, clear checking');
      clearInterval(providerChecks);
      dispatch(authUser(tinlake, tinlake.ethConfig.from));
    }

    const state = getState();
    if (state.auth.observingAuthChanges) {
      console.log('Already observing auth changes');
      return;
    }

    dispatch({ type: OBSERVING_AUTH_CHANGES });
    tinlake.provider.on('accountsChanged', (accounts: Address[]) => {
      console.log('Active account changed, will update tinlake and authedUser');
      tinlake.ethConfig = { from: accounts[0] };
      dispatch(authUser(tinlake, accounts[0]));
    });
  };
}

export function clearUser():
  ThunkAction<Promise<void>, AuthState, undefined, Action> {
  return async (dispatch) => {
    dispatch({ type: CLEAR });
  };
}
