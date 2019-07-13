import { feeToInterestRate } from './feeToInterestRate';

test('formats correctly', () => {
  expect(feeToInterestRate('1000000000000000000000000000')).toBe('0');
  expect(feeToInterestRate('1000000000315522921573372069')).toBe('1');
  expect(feeToInterestRate('1000000000627937192491029810')).toBe('2');
  expect(feeToInterestRate('1000000001547125957863212449')).toBe('5');
  expect(feeToInterestRate('1000000002293273137447730715')).toBe('7.5');
});
