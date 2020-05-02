import { interestRateToFee } from './interestRateToFee';
import assert from 'assert';

it('interestRateToFee calculates correctly', () => {
  assert.equal(interestRateToFee('0'), '1000000000000000000000000000');
  assert.equal(interestRateToFee('1'), '1000000000315522921573372069');
  assert.equal(interestRateToFee('2'), '1000000000627937192491029810');
  assert.equal(interestRateToFee('5'), '1000000001547125957863212449');
  assert.equal(interestRateToFee('7.5'), '1000000002293273137447730715');
});
