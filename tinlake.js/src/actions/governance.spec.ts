import assert from 'assert'
import { ethers } from 'ethers'
import testConfig from '../test/config'
import { createTinlake, TestProvider } from '../test/utils'
import { ContractName } from '../Tinlake'
import { ITinlake } from '../types/tinlake'

const testProvider = new TestProvider(testConfig)

// god account = governance address for the tinlake test deployment
const userAccount = testProvider.createRandomAccount()
let governanceTinlake: ITinlake

const { SUCCESS_STATUS, FAIL_STATUS, FAUCET_AMOUNT } = testConfig

describe('governance tests', async () => {
  before(async () => {
    governanceTinlake = createTinlake(testConfig.godAccount, testConfig)
  })

  describe('grant permissions', async () => {
    let randomAccount: ethers.Wallet

    before(async () => {
      randomAccount = testProvider.createRandomAccount()
      await testProvider.fundAccountWithETH(randomAccount, FAUCET_AMOUNT)
    })

    after(async () => {
      await testProvider.refundETHFromAccount(randomAccount)
    })

    it('success: rely account on the ceiling contract', async () => {
      // rely user account on the ceiling contract
      await relyAddress(userAccount.address, 'CEILING')
    })

    it('success: rely account on the junior operator contract', async () => {
      // rely user account on the operator contract
      await relyAddress(userAccount.address, 'JUNIOR_OPERATOR')
    })

    it('success: rely account on the pile contract', async () => {
      // rely user account on the pile contract
      await relyAddress(userAccount.address, 'PILE')
    })

    it('fail: account has no governance permissions', async () => {
      const randomTinlake = createTinlake(randomAccount, testConfig)

      const tx = await randomTinlake.relyAddress(userAccount.address, testConfig.contractAddresses['PILE'])
      const res = await randomTinlake.getTransactionReceipt(tx)

      assert.equal(res.status, FAIL_STATUS)
    })
  })
})

async function relyAddress(usr: string, contractName: ContractName) {
  const tx = await governanceTinlake.relyAddress(usr, testConfig.contractAddresses[contractName])
  const res = await governanceTinlake.getTransactionReceipt(tx)

  const isWard = await governanceTinlake.isWard(usr, contractName)

  assert.equal(isWard, 1)
  assert.equal(res.status, SUCCESS_STATUS)
}
