import { feeToInterestRate } from './feeToInterestRate';
import assert from 'assert';

it('feeToInterestRate formats correctly', () => {
  assert.equal(feeToInterestRate('0'), '0');
  assert.equal(feeToInterestRate('1000000000000000000000000000'), '0');

  // assert.equal(feeToInterestRate('1000000000315522921573372069'), '1');
  // assert.equal(feeToInterestRate('1000000000627937192491029810'), '2');
  // assert.equal(feeToInterestRate('1000000001547125957863212449'), '5');
  // assert.equal(feeToInterestRate('1000000002293273137447730715'), '7.5');

  // CF risk group 0
  assert.equal(feeToInterestRate('1000000003488077118214104515'), '11');
  // CF risk group 1
  assert.equal(feeToInterestRate('1000000003646626078132927447'), '11.5');
  // CF risk group 2
  assert.equal(feeToInterestRate('1000000003805175038051750380'), '12');
  // CF risk group 3
  assert.equal(feeToInterestRate('1000000003963723997970573313'), '12.5');
  // CF risk group 4
  assert.equal(feeToInterestRate('1000000004122272957889396245'), '13');
  // CF risk group 5
  assert.equal(feeToInterestRate('1000000004280821917808219178'), '13.5');
  // CF risk group 6
  assert.equal(feeToInterestRate('1000000004439370877727042110'), '14');
  // CF risk group 7
  assert.equal(feeToInterestRate('1000000004597919837645865043'), '14.5');
  // CF risk group 8
  assert.equal(feeToInterestRate('1000000004756468797564687975'), '15');
});
