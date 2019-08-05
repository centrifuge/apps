import { interestRateToFee } from './interestRateToFee';
import assert from 'assert';

it('calculates correctly', () => {
  assert(interestRateToFee('0'), '1000000000000000000000000000');
  assert(interestRateToFee('1'), '1000000000315522921573372069');
  assert(interestRateToFee('2'), '1000000000627937192491029810');
  assert(interestRateToFee('5'), '1000000001547125957863212449');
  assert(interestRateToFee('7.5'), '1000000002293273137447730715');
});
