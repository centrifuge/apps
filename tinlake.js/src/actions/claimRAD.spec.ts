import assert from 'assert'
import { randomHex } from 'web3-utils'
import testConfig from '../test/config'
import { assertTxSuccess, createTinlake, TestProvider } from '../test/utils'
import { ITinlake } from '../types/tinlake'

const testProvider = new TestProvider(testConfig)
const acc = testProvider.createRandomAccount()
let tinl: ITinlake

const { FAUCET_AMOUNT } = testConfig

describe('claim rad tests', async () => {
  before(async () => {
    tinl = createTinlake(acc, testConfig)
    await testProvider.fundAccountWithETH(acc, FAUCET_AMOUNT)
  })

  after(async () => {
    await testProvider.refundETHFromAccount(acc)
  })

  describe('get empty, update, get', async () => {
    it('works', async () => {
      // get initial address, should be empty
      const addr1 = await tinl.getClaimRADAccountID(acc.address)
      assert.strictEqual(addr1, '0x0000000000000000000000000000000000000000000000000000000000000000')

      // update address, then get to verify
      const addr2 = randomHex(32)
      const tx = await tinl.updateClaimRADAccountID(addr2)
      await assertTxSuccess(tinl, tx)
      const addr3 = await tinl.getClaimRADAccountID(acc.address)
      assert.strictEqual(addr3, addr2)
    })
  })
})
