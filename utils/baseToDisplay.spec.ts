import { baseToDisplay } from './baseToDisplay';

test('formats correctly', () => {
  expect(baseToDisplay('0', 2)).toBe('0.00');
  expect(baseToDisplay('20', 2)).toBe('0.20');
  expect(baseToDisplay('1234', 18)).toBe('0.000000000000001234');
  expect(baseToDisplay('7890000000000000000', 18)).toBe('7.890000000000000000');
});
