import { feeToInterestRate } from './feeToInterestRate';
import assert from 'assert';

it('formats correctly', () => {
  assert(feeToInterestRate('0'), '0');
  assert(feeToInterestRate('1000000000000000000000000000'), '0');
  assert(feeToInterestRate('1000000000315522921573372069'), '1');
  assert(feeToInterestRate('1000000000627937192491029810'), '2');
  assert(feeToInterestRate('1000000001547125957863212449'), '5');
  assert(feeToInterestRate('1000000002293273137447730715'), '7.5');
});
