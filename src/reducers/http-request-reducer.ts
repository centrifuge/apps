import { ActionType } from '../actions/action-type-generator';

export type RequestState<T> = {
  loading: boolean;
  hasError?: boolean;
  data?: T;
  error?: Error;
};

const defaultState = {
  loading: true,
  hasError: false,
  data: undefined,
  error: undefined,
};

export function httpRequestReducer<T>(actionType: ActionType) {
  return (
    state: RequestState<T> = defaultState,
    { type, payload }: { type: string; payload?: T | Error },
  ): RequestState<T> => {
    switch (type) {
      case actionType.start: {
        return defaultState;
      }
      case actionType.success: {
        return {
          ...defaultState,
          data: payload as T,
          loading: false
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
