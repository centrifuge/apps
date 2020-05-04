import { interestRateToFee } from './interestRateToFee';
import assert from 'assert';

it('interestRateToFee calculates correctly', () => {
  assert.equal(interestRateToFee('0'), '1000000000000000000000000000');

  // assert.equal(interestRateToFee('1'), '1000000000315522921573372069');
  // assert.equal(interestRateToFee('2'), '1000000000627937192491029810');
  // assert.equal(interestRateToFee('5'), '1000000001547125957863212449');
  // assert.equal(interestRateToFee('7.5'), '1000000002293273137447730715');

  // CF risk group 0
  assert.equal(interestRateToFee('11'), '1000000003488077118214104515');
  // CF risk group 1
  assert.equal(interestRateToFee('11.5'), '1000000003646626078132927447');
  // CF risk group 2
  assert.equal(interestRateToFee('12'), '1000000003805175038051750380');
  // CF risk group 3
  assert.equal(interestRateToFee('12.5'), '1000000003963723997970573313');
  // CF risk group 4
  assert.equal(interestRateToFee('13'), '1000000004122272957889396245');
  // CF risk group 5
  assert.equal(interestRateToFee('13.5'), '1000000004280821917808219178');
  // CF risk group 6
  assert.equal(interestRateToFee('14'), '1000000004439370877727042110');
  // CF risk group 7
  assert.equal(interestRateToFee('14.5'), '1000000004597919837645865043');
  // CF risk group 8
  assert.equal(interestRateToFee('15'), '1000000004756468797564687975');
});
