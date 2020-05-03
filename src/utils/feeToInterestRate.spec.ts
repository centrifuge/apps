import { feeToInterestRate } from './feeToInterestRate';
import assert from 'assert';

it('feeToInterestRate formats correctly', () => {
  assert.equal(feeToInterestRate('0'), '0');
  assert.equal(feeToInterestRate('1000000000000000000000000000'), '0');
  assert.equal(feeToInterestRate('1000000000315522921573372069'), '1');
  assert.equal(feeToInterestRate('1000000000627937192491029810'), '2');
  assert.equal(feeToInterestRate('1000000001547125957863212449'), '5');
  assert.equal(feeToInterestRate('1000000002293273137447730715'), '7.5');
});
