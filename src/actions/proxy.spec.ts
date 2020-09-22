import assert from 'assert'
import { createTinlake, TestProvider } from '../test/utils'
import testConfig from '../test/config'
import { ITinlake } from '../types/tinlake'
import { ethers } from 'ethers'

const testProvider = new TestProvider(testConfig)
const borrowerAccount = ethers.Wallet.createRandom()
const lenderAccount = ethers.Wallet.createRandom()
let borrowerTinlake: ITinlake
let governanceTinlake: ITinlake
let lenderTinlake: ITinlake

const { SUCCESS_STATUS, FAIL_STATUS, FAUCET_AMOUNT, contractAddresses } = testConfig

const SENIOR = 'senior'
const JUNIOR = 'junior'

const juniorAmount = '300'
const seniorAmount = '100'
const amount = '100'

// valid until Sunday, 21 December 2025
const validityTimestamp = 1766327170

describe('proxy tests', async () => {
  before(async () => {
    borrowerTinlake = createTinlake(borrowerAccount, testConfig)
    governanceTinlake = createTinlake(testConfig.godAccount, testConfig)
    lenderTinlake = createTinlake(lenderAccount, testConfig)

    // fund accounts with ETH
    await testProvider.fundAccountWithETH(borrowerAccount.address, FAUCET_AMOUNT)
    await testProvider.fundAccountWithETH(testConfig.godAccount.address, FAUCET_AMOUNT)
    await testProvider.fundAccountWithETH(lenderAccount.address, FAUCET_AMOUNT)
  })

  describe('borrow - lend - repay - redeem flow', async () => {
    it('success: full loan cycle', async () => {
      await governanceTinlake.setMinimumJuniorRatio('0')
      const ratio = await governanceTinlake.getMaxJuniorRatio()
      assert.equal(ratio, 1000000000000000000000000000)

      await governanceTinlake.setMinimumEpochTime('1')
      const minimumEpochTime = await governanceTinlake.getMinimumEpochTime()
      assert.equal(minimumEpochTime.toString(), '1')

      await governanceTinlake.setMinimumChallengeTime('1')
      const challengeTime = await governanceTinlake.getChallengeTime()
      assert.equal(challengeTime.toString(), '1')

      // add governance address to memberlists
      await governanceTinlake.updateJuniorMemberList(contractAddresses['GOVERNANCE'], validityTimestamp)
      await governanceTinlake.updateSeniorMemberList(contractAddresses['GOVERNANCE'], validityTimestamp)

      // create new proxy and mint collateral NFT to borrower
      const proxyAddr = await borrowerTinlake.proxyCreateNew(borrowerAccount.address)
      const tokenId = await governanceTinlake.mintTitleNFT(testConfig.nftRegistry, borrowerAccount.address)
      const approveTx = await borrowerTinlake.approveNFT(testConfig.nftRegistry, tokenId, proxyAddr)
      await verifyTransactionSuccess(approveTx)

      // issue loan from collateral NFT
      const issueTx = await borrowerTinlake.proxyTransferIssue(proxyAddr, testConfig.nftRegistry, tokenId)
      await verifyTransactionSuccess(issueTx)
      assert.equal(await borrowerTinlake.getNFTOwner(testConfig.nftRegistry, tokenId), proxyAddr)

      // set loan parameters and fund tranche
      const loanId = await borrowerTinlake.nftLookup(testConfig.nftRegistry, tokenId)
      const nftfeedId = await governanceTinlake.getNftFeedId(testConfig.nftRegistry, tokenId)
      await governanceTinlake.updateNftFeed(nftfeedId, amount)
      const nftValue = await governanceTinlake.getNftFeedValue(nftfeedId)
      assert.equal(nftValue.toString(), amount)
      await governanceTinlake.setMaturityDate(nftfeedId, validityTimestamp)

      await fundTranche(juniorAmount, JUNIOR)
      await fundTranche(seniorAmount, SENIOR)
      const state = await governanceTinlake.getCurrentEpochState()
      assert.equal(state, 'can-be-closed')

      const solveTx = await governanceTinlake.solveEpoch()
      await verifyTransactionSuccess(solveTx)

      const initialReserveValue = await governanceTinlake.getCurrencyBalance(contractAddresses['RESERVE'])

      // borrow: split into two proxy actions to avoid gas limit failures
      const principal = await borrowerTinlake.getPrincipal(loanId.toString())
      assert.equal(principal.toString(), amount)

      const lockTx = await borrowerTinlake.proxyLock(proxyAddr, loanId)
      await verifyTransactionSuccess(lockTx)

      const borrowTx = await borrowerTinlake.proxyBorrowWithdraw(proxyAddr, loanId, amount, borrowerAccount.address)
      await verifyTransactionSuccess(borrowTx)

      const borrowerValue = await governanceTinlake.getCurrencyBalance(borrowerAccount.address)
      const newReserveValue = await governanceTinlake.getCurrencyBalance(contractAddresses['RESERVE'])
      // assert.equal(borrowerValue.toString(), principal.toString())
      // assert.equal(newReserveValue.toString(), initialReserveValue.sub(principal).toString());

      // fuel borrower with extra to cover loan interest, approve borrower proxy to take currency
      const secondMintTx = await governanceTinlake.mintCurrency(borrowerAccount.address, amount)
      await governanceTinlake.getTransactionReceipt(secondMintTx)

      const secondApproveTx = await borrowerTinlake.approveCurrency(proxyAddr, amount)
      await borrowerTinlake.getTransactionReceipt(secondApproveTx)

      // repay
      const repayTx = await borrowerTinlake.proxyRepayUnlockClose(proxyAddr, tokenId, loanId, testConfig.nftRegistry)
      await verifyTransactionSuccess(repayTx)

      // borrower should be owner of collateral NFT again
      // reserve balance should be back to pre-borrow amount
      const owner = await governanceTinlake.getNFTOwner(testConfig.nftRegistry, tokenId)
      assert.equal(ethers.utils.getAddress(owner.toString()), ethers.utils.getAddress(borrowerAccount.address))

      const finalReserveValue = await borrowerTinlake.getCurrencyBalance(contractAddresses['RESERVE'])
      assert.equal(initialReserveValue.toString(), finalReserveValue.toString())

      await redeemTranche(seniorAmount, SENIOR)
    })
  })
})

// TODO: move to utils, requires moving xTinlake
async function verifyTransactionSuccess(transaction: any) {
  const transactionResult = await lenderTinlake.getTransactionReceipt(transaction)
  assert.equal(transactionResult.status, SUCCESS_STATUS)
}

async function redeemTranche(amount: string, tranche: string) {
  if (tranche === JUNIOR) {
    // first call disburse in case there are outstanding orders
    const jrDisburseTx = await lenderTinlake.disburseJunior()
    await verifyTransactionSuccess(jrDisburseTx)

    // approve tranche to take investment tokens
    const transferTx = await lenderTinlake.approveJuniorForToken(juniorAmount)
    await verifyTransactionSuccess(transferTx)

    const redeemJunior = await lenderTinlake.submitJuniorRedeemOrder(juniorAmount)
    await verifyTransactionSuccess(redeemJunior)

    const state = await governanceTinlake.getCurrentEpochState()
    assert.equal(state, 'can-be-closed')
    const solveTx = await governanceTinlake.solveEpoch()
    await verifyTransactionSuccess(solveTx)

    const jrCalc2 = await governanceTinlake.calcJuniorDisburse(lenderAccount.address)
    assert.equal(jrCalc2.payoutTokenAmount, 0)
    const juniorTokenBalance2 = await governanceTinlake.getJuniorTokenBalance(lenderAccount.address)
    assert.equal(juniorTokenBalance2, 0)
  } else if (tranche === SENIOR) {
    // first call disburse in case there are outstanding orders
    const srCalc = await governanceTinlake.calcSeniorDisburse(lenderAccount.address)
    assert.equal(srCalc.payoutTokenAmount.toString(), seniorAmount)

    const srDisburseTx = await lenderTinlake.disburseSenior()
    await verifyTransactionSuccess(srDisburseTx)
    const seniorTokenBalance = await governanceTinlake.getSeniorTokenBalance(lenderAccount.address)
    assert.equal(seniorTokenBalance.toString(), seniorAmount)

    // approve tranche to take investment tokens
    const transferTx = await lenderTinlake.approveSeniorForToken(seniorAmount)
    await verifyTransactionSuccess(transferTx)

    const redeemSenior = await lenderTinlake.submitSeniorRedeemOrder(seniorAmount)
    await verifyTransactionSuccess(redeemSenior)

    const state = await governanceTinlake.getCurrentEpochState()
    assert.equal(state, 'can-be-closed')
    const solveTx = await governanceTinlake.solveEpoch()
    await verifyTransactionSuccess(solveTx)

    const srCalc2 = await governanceTinlake.calcSeniorDisburse(lenderAccount.address)
    assert.equal(srCalc2.payoutTokenAmount, 0)
    const seniorTokenBalance2 = await governanceTinlake.getSeniorTokenBalance(lenderAccount.address)
    assert.equal(seniorTokenBalance2, 0)
  }
}

async function fundTranche(amount: string, tranche: 'senior' | 'junior') {
  if (tranche === JUNIOR) {
    // make admin address ward on memberlist & whitelist lender address for tranche
    const whitelistTx = await governanceTinlake.updateJuniorMemberList(lenderAccount.address, validityTimestamp)
    await verifyTransactionSuccess(whitelistTx)

    // lender approves tranche to take currency
    const approveResult = await lenderTinlake.approveJuniorForCurrency(amount)

    // mint currency for lender
    const mintTx = await governanceTinlake.mintCurrency(lenderAccount.address, amount)
    await verifyTransactionSuccess(mintTx)

    // lender supplies tranche with funds
    const supplyTx = await lenderTinlake.submitJuniorSupplyOrder(amount)
    await verifyTransactionSuccess(supplyTx)
  } else if (tranche === SENIOR) {
    // make admin address ward on memberlist & whitelist lender address for tranche
    const whitelistTx = await governanceTinlake.updateSeniorMemberList(lenderAccount.address, validityTimestamp)
    await verifyTransactionSuccess(whitelistTx)

    // lender approves tranche to take currency
    const approveResult = await lenderTinlake.approveSeniorForCurrency(amount)

    // mint currency for lender
    const mintTx = await governanceTinlake.mintCurrency(lenderAccount.address, amount)
    await verifyTransactionSuccess(mintTx)

    // lender supplies tranche with funds
    const supplyTx = await lenderTinlake.submitSeniorSupplyOrder(amount)
    await verifyTransactionSuccess(supplyTx)
  }
}
