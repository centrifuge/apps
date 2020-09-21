import { ITinlake } from '../types/tinlake'
import assert from 'assert'
import { createTinlake, TestProvider } from '../test/utils'
import testConfig from '../test/config'
import { ethers } from 'ethers'

const testProvider = new TestProvider(testConfig)
const adminAccount = ethers.Wallet.createRandom()
const borrowerAccount = ethers.Wallet.createRandom()
const lenderAccount = ethers.Wallet.createRandom()
const { SUCCESS_STATUS, FAUCET_AMOUNT, contractAddresses } = testConfig
let adminTinlake: ITinlake
let governanceTinlake: ITinlake

// ------------ admin tests borrower-site -------------
describe('admin tests', async () => {
  before(async () => {
    // fund admin account with eth
    adminTinlake = createTinlake(adminAccount, testConfig)
    governanceTinlake = createTinlake(testConfig.godAccount, testConfig)
    await testProvider.fundAccountWithETH(adminAccount.address, FAUCET_AMOUNT)
    await testProvider.fundAccountWithETH(borrowerAccount.address, FAUCET_AMOUNT)
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
