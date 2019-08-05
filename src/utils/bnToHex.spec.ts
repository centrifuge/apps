import { bnToHex } from './bnToHex';
import BN from 'bn.js';
import assert from 'assert';

it('formats correctly', () => {
  assert.equal(bnToHex(new BN(0)), '0x0');
  assert.equal(bnToHex(new BN(8)), '0x8');
  assert.equal(bnToHex(new BN(18)), '0x12');
});
