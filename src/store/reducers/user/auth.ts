import { userLoginAction } from '../../actions/users';
import { LOCATION_CHANGE } from 'connected-react-router';
import { User } from '../../../common/models/user';

export type LoginState = {
  loading: boolean;
  hasError?: boolean;
  loggedInUser: User | null;
  error?: Error;
};

const defaultState = {
  loading: false,
  hasError: false,
  loggedInUser: null,
  error: undefined,
};

const auth = (
  state: LoginState = defaultState,
  { type, payload }: { type: string; payload?: User | string | Error },
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
        loggedInUser: payload as User,
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
