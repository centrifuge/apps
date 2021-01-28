import assert from 'assert'
import { ethers } from 'ethers'
import testConfig from '../test/config'
import { createTinlake, TestProvider } from '../test/utils'
import { ITinlake } from '../types/tinlake'

const testProvider = new TestProvider(testConfig)
const adminAccount = testProvider.createRandomAccount()
const borrowerAccount = testProvider.createRandomAccount()
const lenderAccount = testProvider.createRandomAccount()
const { SUCCESS_STATUS, FAUCET_AMOUNT, contractAddresses } = testConfig
let adminTinlake: ITinlake
let governanceTinlake: ITinlake

// ------------ admin tests borrower-site -------------
describe.skip('admin tests', async () => {
  before(async () => {
    // fund admin account with eth
    adminTinlake = createTinlake(adminAccount, testConfig)
    governanceTinlake = createTinlake(testConfig.godAccount, testConfig)
    await testProvider.fundAccountWithETH(adminAccount, FAUCET_AMOUNT)
    await testProvider.fundAccountWithETH(borrowerAccount, FAUCET_AMOUNT)
  })

  after(async () => {
    await testProvider.refundETHFromAccount(adminAccount)
    await testProvider.refundETHFromAccount(borrowerAccount)
  })

  // ------------ admin tests lender-site -------------
  describe('operator', async () => {
    it('success: set allowance for junior investor', async () => {
      // rely admin on junior operator
      const relyTx = await governanceTinlake.relyAddress(adminAccount.address, contractAddresses['JUNIOR_OPERATOR'])
      await governanceTinlake.getTransactionReceipt(relyTx)

      const maxCurrency = '10'
      const maxToken = '1'

      // set allowance for lender address
      const allowanceTx = await adminTinlake.approveAllowanceJunior(lenderAccount.address, maxCurrency, maxToken)
      const allowanceResult = await allowanceTx.receipt()

      const maxSupplyAmount = await adminTinlake.getMaxSupplyAmountJunior(lenderAccount.address)
      const maxRedeemAmount = await adminTinlake.getMaxRedeemAmountJunior(lenderAccount.address)

      assert.equal(allowanceResult.status, SUCCESS_STATUS)
      assert.equal(maxRedeemAmount, maxToken)
      assert.equal(maxSupplyAmount, maxCurrency)
    })
  })
})
