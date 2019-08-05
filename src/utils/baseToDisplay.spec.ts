import { baseToDisplay } from './baseToDisplay';
import assert from 'assert';

it('formats correctly', () => {
  assert.equal(baseToDisplay('0', 2), '0.00');
  assert.equal(baseToDisplay('20', 2), '0.20');
  assert.equal(baseToDisplay('1234', 18), '0.000000000000001234');
  assert.equal(baseToDisplay('7890000000000000000', 18), '7.890000000000000000');
});
