import { displayToBase } from './displayToBase';
import assert from 'assert';

it('displayToBase formats correctly', () => {
  assert.equal(displayToBase('0.00', 2), '000');
  assert.equal(displayToBase('0.12345678901234567890', 18), '0123456789012345678');
  assert.equal(displayToBase('123', 18), '123000000000000000000');
  assert.equal(displayToBase('12.345678901234567890', 18), '12345678901234567890');
  assert.equal(displayToBase('-0.02', 2), '-002');
  assert.equal(displayToBase('-7.890000000000000000', 18), '-7890000000000000000');
  assert.equal(displayToBase('--0.02', 2), '-002');
});
