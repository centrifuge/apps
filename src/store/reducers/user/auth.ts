import { userLoginAction } from '../../actions/users';
import { LOCATION_CHANGE } from 'connected-react-router';

export type LoginState = {
  loading: boolean;
  hasError?: boolean;
  loggedIn: boolean;
  error?: Error;
};

const defaultState = {
  loading: false,
  hasError: false,
  loggedIn: false,
  error: undefined,
};

const auth = (
  state: LoginState = defaultState,
  { type, payload }: { type: string; payload?: string | Error },
): LoginState => {
  switch (type) {
    case LOCATION_CHANGE:
      return { ...state, error: undefined };
    case userLoginAction.start: {
      return { ...state, loading: true };
    }

    case userLoginAction.success: {
      return {
        ...state,
        loggedIn: true,
        loading: false,
      };
    }

    case userLoginAction.fail: {
      return {
        ...state,
        loading: false,
        hasError: true,
        error: payload as Error,
      };
    }
    default: {
      return state;
    }
  }
};

export default auth;
