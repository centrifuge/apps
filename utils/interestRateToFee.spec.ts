import { interestRateToFee } from './interestRateToFee';

test('calculates correctly', () => {
  expect(interestRateToFee('0')).toBe('1000000000000000000000000000');
  expect(interestRateToFee('1')).toBe('1000000000315522921573372069');
  expect(interestRateToFee('2')).toBe('1000000000627937192491029810');
  expect(interestRateToFee('5')).toBe('1000000001547125957863212449');
  expect(interestRateToFee('7.5')).toBe('1000000002293273137447730715');
});
