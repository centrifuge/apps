export type ActionType = {
  start: string;
  success: string;
  fail: string;
};

export const getActions = (actionType: string): ActionType => ({
  start: `${actionType}`,
  success: `${actionType}_SUCCESS`,
  fail: `${actionType}_ERROR`,
});
