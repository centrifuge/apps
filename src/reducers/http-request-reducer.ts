import { ActionType } from '../actions/action-type-generator';

export type RequestState<T> = {
  loading: boolean;
  hasError?: boolean;
  data?: T;
  error?: Error;
};

const defaultState = {
  loading: false,
  hasError: false,
  data: undefined,
  error: undefined,
};

/**'
 * Creates a reducer for http requests
 * @param actionType - the http action type
 */
export function httpRequestReducer<T>(actionType: ActionType) {
  return (
    state: RequestState<T> = defaultState,
    { type, payload }: { type: string; payload?: T | Error },
  ): RequestState<T> => {
    switch (type) {
      case actionType.start: {
        return { ...defaultState, loading: true };
      }
      case actionType.success: {
        return {
          ...defaultState,
          data: payload as T,
          loading: false,
        };
      }
      case actionType.fail: {
        return {
          ...defaultState,
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
}
