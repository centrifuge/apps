import assert from 'assert'
import {ethers, Wallet} from 'ethers';
import testConfig from '../test/config'
import { ITinlake } from '../types/tinlake'
import { createTinlake, TestProvider } from '../test/utils'
import BN from 'bn.js'

let lenderAccount: Wallet
let lenderTinlake: ITinlake

const adminAccount = ethers.Wallet.createRandom()
let adminTinlake: ITinlake
let governanceTinlake: ITinlake
const testProvider = new TestProvider(testConfig)

const { SUCCESS_STATUS, FAUCET_AMOUNT, FAIL_STATUS, contractAddresses } = testConfig

describe.skip('lender functions', async () => {
  before(async () => {
    adminTinlake = createTinlake(adminAccount, testConfig)
    governanceTinlake = createTinlake(testConfig.godAccount, testConfig)

    // fund lender & admin accounts with currency
    await testProvider.fundAccountWithETH(adminAccount.address, FAUCET_AMOUNT)

    // rely admin on junior operator
    const relyTx = await governanceTinlake.relyAddress(adminAccount.address, contractAddresses['JUNIOR_OPERATOR'])
    await governanceTinlake.getTransactionReceipt(relyTx)
  })

  beforeEach(async () => {
    lenderAccount = ethers.Wallet.createRandom()
    lenderTinlake = createTinlake(lenderAccount, testConfig)
    return await testProvider.fundAccountWithETH(lenderAccount.address, FAUCET_AMOUNT)
  })

  it('success: supply junior', async () => {
    const currencyAmount = '1000'
    const tokenAmount = '1'

    // whitelist investor
    const approveTx = await adminTinlake.approveAllowanceJunior(lenderAccount.address, currencyAmount, tokenAmount)
    await adminTinlake.getTransactionReceipt(approveTx)

    await supply(lenderAccount.address, `${currencyAmount}`, lenderTinlake)
  })

  it('fail: supply junior - no allowance', async () => {
    const currencyAmount = '10'
    // approve junior tranche to take currency
    const approveTx = await lenderTinlake.approveCurrency(contractAddresses['JUNIOR'], currencyAmount)
    const approval = await lenderTinlake.getTransactionReceipt(approveTx)
    // console.log('approval', approval)

    // fund investor with tinlake currency
    const mintTx = await governanceTinlake.mintCurrency(lenderAccount.address, currencyAmount)
    const mint = await governanceTinlake.getTransactionReceipt(mintTx)
    // console.log('mint', mint)

    // do not set allowance for lender
    const supplyTx = await lenderTinlake.supplyJunior(currencyAmount)
    const supplyResult = await lenderTinlake.getTransactionReceipt(supplyTx)

    // assert result failed
    assert.equal(supplyResult.status, FAIL_STATUS)
  })

  it('success: redeem junior', async () => {
    const currencyAmount = '10000'
    const tokenAmount = '100'

    // whitelist investor
    const approveTx = await adminTinlake.approveAllowanceJunior(lenderAccount.address, currencyAmount, tokenAmount)
    await adminTinlake.getTransactionReceipt(approveTx)

    // supply currency - receive tokens
    await supply(lenderAccount.address, `${currencyAmount}`, lenderTinlake)

    // approve junior tranche to take tokens
    const lenderApproveTx = await lenderTinlake.approveJuniorToken(tokenAmount)
    await lenderTinlake.getTransactionReceipt(lenderApproveTx)

    const initialLenderCurrencyBalance: BN = await lenderTinlake.getCurrencyBalance(lenderAccount.address)
    const initialTrancheCurrencyBalance: BN = await lenderTinlake.getCurrencyBalance(contractAddresses['JUNIOR'])
    const initialJuniorTokenBalance = await lenderTinlake.getJuniorTokenBalance(lenderAccount.address)

    const redeemTx = await lenderTinlake.redeemJunior(tokenAmount)
    const redeemResult = await lenderTinlake.getTransactionReceipt(redeemTx)

    const newTrancheCurrencyBalance = await lenderTinlake.getCurrencyBalance(contractAddresses['JUNIOR'])
    const newLenderCurrencyBalance = await lenderTinlake.getCurrencyBalance(lenderAccount.address)
    const newJuniorTokenBalance = await lenderTinlake.getJuniorTokenBalance(lenderAccount.address)

    assert.equal(redeemResult.status, SUCCESS_STATUS)
    assert.equal(
      initialTrancheCurrencyBalance.sub(new BN(tokenAmount)).toString(),
      newTrancheCurrencyBalance.toString()
    )
    assert.equal(
      initialLenderCurrencyBalance.add(new BN(tokenAmount)).toString(),
      newLenderCurrencyBalance.toString()
    )
    assert.equal(tokenAmount, initialJuniorTokenBalance.sub(newJuniorTokenBalance).toString())
  })

  it('fail: redeem junior - no allowance', async () => {
    const currencyAmount = '10'
    const tokenAmount = '1'

    // whitelist investor with no allowance to redeem
    const approveTx = await adminTinlake.approveAllowanceJunior(lenderAccount.address, currencyAmount, '0')
    await adminTinlake.getTransactionReceipt(approveTx)

    // supply currency - receive tokens
    await supply(lenderAccount.address, `${currencyAmount}`, lenderTinlake)

    // approve junior tranche to take tokens
    const lenderApproveTx = await lenderTinlake.approveJuniorToken(tokenAmount)
    await lenderTinlake.getTransactionReceipt(lenderApproveTx)

    const redeemTx = await lenderTinlake.redeemJunior(tokenAmount)
    const redeemResult = await lenderTinlake.getTransactionReceipt(redeemTx)

    assert.equal(redeemResult.status, FAIL_STATUS)
  })
})

async function supply(investor: string, currencyAmount: string, tinlake: ITinlake) {
  // approve junior tranche to take currency
  const approveTx = await tinlake.approveCurrency(contractAddresses['JUNIOR'], currencyAmount)
  await tinlake.getTransactionReceipt(approveTx)

  // fund investor with tinlake currency
  const mintTx = await governanceTinlake.mintCurrency(investor, currencyAmount)
  await governanceTinlake.getTransactionReceipt(mintTx)

  const initialLenderCurrencyBalance = await tinlake.getCurrencyBalance(investor)
  const initialTrancheCurrencyBalance = await tinlake.getCurrencyBalance(contractAddresses['JUNIOR'])
  const initialJuniorTokenBalance = await tinlake.getJuniorTokenBalance(investor)

  const supplyTx = await tinlake.supplyJunior(currencyAmount)
  const supplyResult = await tinlake.getTransactionReceipt(supplyTx)

  const newTrancheCurrencyBalance = await tinlake.getCurrencyBalance(contractAddresses['JUNIOR'])
  const newLenderCurrencyBalance = await tinlake.getCurrencyBalance(investor)
  const newJuniorTokenBalance = await tinlake.getJuniorTokenBalance(investor)

  // assert result successful
  assert.equal(supplyResult.status, SUCCESS_STATUS)

  // assert tranche balance increased by currency amount
  assert.equal(newTrancheCurrencyBalance.sub(initialTrancheCurrencyBalance).toString(), currencyAmount)

  // assert investor currency balanace decreased
  assert.equal(initialLenderCurrencyBalance.sub(newLenderCurrencyBalance).toString(), currencyAmount)

  // assert investor received tokens
  if (testConfig.isRealTestnet) {
    assert.ok(newJuniorTokenBalance.gt(initialJuniorTokenBalance))
  } else {
    assert.equal(initialJuniorTokenBalance.add(new BN(currencyAmount)).toString(), newJuniorTokenBalance.toString())
  }
}
