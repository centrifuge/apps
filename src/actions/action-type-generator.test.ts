import { getActions } from './action-type-generator';

it('generates action types', () => {
  const actionType = 'SOME_ACTION';
  const actionTypes = getActions(actionType);
  expect(actionTypes.start).toBe(actionType);
  expect(actionTypes.success).toBe(`${actionType}_SUCCESS`);
  expect(actionTypes.fail).toBe(`${actionType}_ERROR`);
});
