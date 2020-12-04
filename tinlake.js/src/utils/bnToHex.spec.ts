import assert from 'assert'
import BN from 'bn.js'
import { bnToHex } from './bnToHex'

it('bnToHex formats correctly', () => {
  assert.equal(bnToHex(new BN(0)), '0x0')
  assert.equal(bnToHex(new BN(8)), '0x8')
  assert.equal(bnToHex(new BN(18)), '0x12')
})
