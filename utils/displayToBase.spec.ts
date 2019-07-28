import { displayToBase } from './displayToBase';

test('formats correctly', () => {
  expect(displayToBase('0.00', 2)).toBe('000');
  expect(displayToBase('0.12345678901234567890', 18)).toBe('0123456789012345678');
  expect(displayToBase('123', 18)).toBe('123000000000000000000');
  expect(displayToBase('12.345678901234567890', 18)).toBe('12345678901234567890');
});
