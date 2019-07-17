import { AnyAction, Action } from 'redux';
import Tinlake, { Address } from 'tinlake';
import { ThunkAction } from 'redux-thunk';

// Actions
const LOAD = 'tinlake-ui/auth/LOAD';
const RECEIVE = 'tinlake-ui/auth/RECEIVE';
const CLEAR = 'tinlake-ui/auth/CLEAR';

export interface User {
  isAdmin: boolean;
  address: Address;
}

export interface AuthState {
  state: null | 'loading' | 'loaded';
  user: null | User;
}

const initialState: AuthState = {
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
    default: return state;
  }
}

// side effects, only as applicable
// e.g. thunks, epics, etc
export function authUser(tinlake: Tinlake, address: Address):
  ThunkAction<Promise<void>, AuthState, undefined, Action> {
  return async (dispatch) => {
    dispatch({ type: LOAD });

    const isAdminPromise = tinlake.isAdmin(address);

    const user = {
      address,
      isAdmin: await isAdminPromise,
    };

    dispatch({ user, type: RECEIVE });
  };
}

export function clearUser():
  ThunkAction<Promise<void>, AuthState, undefined, Action> {
  return async (dispatch) => {
    dispatch({ type: CLEAR });
  };
}
