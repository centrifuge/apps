export type ActionType = {
  start: string;
  success: string;
  fail: string;
  reset: string;
};

/**
 * Generates action types for asynchronous requests
 * @param actionType - name of the action
 */
export const getActions = (actionType: string): ActionType => ({
  start: `${actionType}_START`,
  success: `${actionType}_SUCCESS`,
  fail: `${actionType}_ERROR`,
  reset: `${actionType}_RESET`,
});
