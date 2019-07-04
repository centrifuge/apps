import { bnToHex } from './bnToHex';
// tslint:disable-next-line:import-name
import BN from 'bn.js';

test('formats correctly', () => {
  expect(bnToHex(new BN(0))).toBe('0x0');
  expect(bnToHex(new BN(8))).toBe('0x8');
  expect(bnToHex(new BN(18))).toBe('0x12');
});
