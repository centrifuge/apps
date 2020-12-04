import assert from 'assert'
import BN from 'bn.js'
import { ethers } from 'ethers'
import testConfig from '../test/config'
import { createTinlake, TestProvider } from '../test/utils'
import { ITinlake } from '../types/tinlake'

const adminAccount = ethers.Wallet.createRandom()
let borrowerAccount: ethers.Wallet

// user with super powers can fund and rely accounts
let governanceTinlake: ITinlake
let adminTinlake: ITinlake
let borrowerTinlake: ITinlake

const testProvider = new TestProvider(testConfig)

const { SUCCESS_STATUS, FAUCET_AMOUNT, contractAddresses } = testConfig

describe.skip('borrower tests', async () => {
  before(async () => {
    governanceTinlake = createTinlake(testConfig.godAccount, testConfig)
    adminTinlake = createTinlake(adminAccount, testConfig)

    // fund borrowerAccount with ETH
    await testProvider.fundAccountWithETH(adminAccount.address, FAUCET_AMOUNT)

    // supply tranche with money
    const amount = '50'
    await fundTranche(amount)
  })

  beforeEach(async () => {
    borrowerAccount = ethers.Wallet.createRandom()
    borrowerTinlake = createTinlake(borrowerAccount, testConfig)
    await testProvider.fundAccountWithETH(borrowerAccount.address, FAUCET_AMOUNT)
  })

  it('success: issue loan from a minted collateral NFT', async () => {
    await mintIssue(borrowerAccount.address, borrowerTinlake)
  })

  it('success: close loan', async () => {
    const { loanId } = await mintIssue(borrowerAccount.address, borrowerTinlake)

    const closeTx = await borrowerTinlake.close(loanId)
    const closeResult = await borrowerTinlake.getTransactionReceipt(closeTx)

    assert.equal(closeResult.status, SUCCESS_STATUS)
  })

  it('success: lock nft', async () => {
    // mint nft & issue loan
    const { tokenId, loanId } = await mintIssue(borrowerAccount.address, borrowerTinlake)
    const approveTx = await borrowerTinlake.approveNFT(testConfig.nftRegistry, tokenId, contractAddresses['SHELF'])
    await borrowerTinlake.getTransactionReceipt(approveTx)

    // lock nft
    const lockTx = await borrowerTinlake.lock(loanId)
    await borrowerTinlake.getTransactionReceipt(lockTx)

    assert.equal(
      (await borrowerTinlake.getNFTOwner(testConfig.nftRegistry, tokenId)).toLowerCase(),
      contractAddresses['SHELF'].toLowerCase()
    )
  })

  it('success: unlock nft', async () => {
    // mint nft & issue loan
    const { tokenId, loanId } = await mintIssue(borrowerAccount.address, borrowerTinlake)
    const approveTx = await borrowerTinlake.approveNFT(testConfig.nftRegistry, tokenId, contractAddresses['SHELF'])
    await borrowerTinlake.getTransactionReceipt(approveTx)

    // lock nft
    const lockTx = await borrowerTinlake.lock(loanId)
    await borrowerTinlake.getTransactionReceipt(lockTx)

    // unlock nft
    const unlockTx = await borrowerTinlake.unlock(loanId)
    await borrowerTinlake.getTransactionReceipt(unlockTx)
  })

  it('success: borrow', async () => {
    const amount = '1000'
    await mintIssueBorrow(borrowerAccount.address, borrowerTinlake, amount)
  })

  it('success: repay', async () => {
    const amount = '1000'
    const { loanId } = await mintIssueBorrow(borrowerAccount.address, borrowerTinlake, amount)

    // wait to secs so that interest can accrue
    await new Promise((r) => setTimeout(r, 3000))

    // mint extra currency so that borrower can repay loan with interest
    const mintTx = await governanceTinlake.mintCurrency(borrowerAccount.address, FAUCET_AMOUNT)
    await governanceTinlake.getTransactionReceipt(mintTx)

    // repay loan
    const initialDebt = await borrowerTinlake.getDebt(loanId)
    console.log('initialDebt', initialDebt)

    // approve shelf to take currency
    const approveTx = await borrowerTinlake.approveCurrency(contractAddresses['SHELF'], initialDebt.toString())
    await borrowerTinlake.getTransactionReceipt(approveTx)

    const repayTx = await borrowerTinlake.repay(loanId, initialDebt.toString())
    const repayResult = await borrowerTinlake.getTransactionReceipt(repayTx)

    const newDebt = await borrowerTinlake.getDebt(loanId)

    assert.equal(newDebt.toString(), '0')
    assert.equal(repayResult.status, SUCCESS_STATUS)
  })
})

async function mintIssue(usr: string, tinlake: ITinlake) {
  // super user mints nft for borrower
  const tokenId = `${Math.floor(Math.random() * 10e15) + 1}`
  const mintTx = await governanceTinlake.mintNFT(testConfig.nftRegistry, usr, tokenId, '234', '345', '456')
  await governanceTinlake.getTransactionReceipt(mintTx)

  // assert usr = nftOwner
  const nftOwner = await tinlake.getNFTOwner(testConfig.nftRegistry, tokenId)
  assert.equal(`${nftOwner}`.toLowerCase(), usr.toLowerCase())

  const issueTx = await tinlake.issue(testConfig.nftRegistry, tokenId)
  const issueResult = await tinlake.getTransactionReceipt(issueTx)

  const loanId = `${(await tinlake.loanCount()).toNumber() - 1}`

  // assert loan successfully issued
  assert.equal(issueResult.status, SUCCESS_STATUS)

  // assert usr = loanOwner
  const titleOwner = `${await tinlake.getOwnerOfLoan(loanId)}`
  assert.equal(titleOwner.toLowerCase(), usr.toLowerCase())

  return { tokenId: `${tokenId}`, loanId: `${loanId}` }
}

async function mintIssueBorrow(usr: string, tinlake: ITinlake, amount: string) {
  const { tokenId, loanId } = await mintIssue(usr, tinlake)

  const relyTx = await governanceTinlake.relyAddress(adminAccount.address, contractAddresses['NFT_FEED'])
  await governanceTinlake.getTransactionReceipt(relyTx)

  const nftfeedId = await adminTinlake.getNftFeedId(testConfig.nftRegistry, Number(tokenId))
  const updateNftTx = await adminTinlake.updateNftFeed(nftfeedId, Number(amount))
  await adminTinlake.getTransactionReceipt(updateNftTx)

  // approve shelf to take nft
  const approveTx = await borrowerTinlake.approveNFT(testConfig.nftRegistry, tokenId, contractAddresses['SHELF'])
  await borrowerTinlake.getTransactionReceipt(approveTx)

  // lock nft
  const lockTx = await borrowerTinlake.lock(loanId)
  await borrowerTinlake.getTransactionReceipt(lockTx)

  const initialBorrowerCurrencyBalance = await borrowerTinlake.getCurrencyBalance(borrowerAccount.address)

  // supply tranche with money
  const borrowTx = await borrowerTinlake.borrow(loanId, amount)
  const borrowResult = await borrowerTinlake.getTransactionReceipt(borrowTx)

  const withdrawTx = await borrowerTinlake.withdraw(loanId, amount, borrowerAccount.address)
  const withdrawResult = await borrowerTinlake.getTransactionReceipt(withdrawTx)

  const newBorrowerCurrencyBalance = await borrowerTinlake.getCurrencyBalance(borrowerAccount.address)

  assert.equal(initialBorrowerCurrencyBalance.add(new BN(amount)).toString(), newBorrowerCurrencyBalance.toString())
  assert.equal(borrowResult.status, SUCCESS_STATUS)
  assert.equal(withdrawResult.status, SUCCESS_STATUS)

  return { tokenId, loanId }
}

async function fundTranche(amount: string) {
  const lenderAccount = ethers.Wallet.createRandom()
  const lenderTinlake = createTinlake(lenderAccount, testConfig)

  // fund lender accoutn with eth
  await testProvider.fundAccountWithETH(lenderAccount.address, FAUCET_AMOUNT)

  // make admin adress ward on tranche operator
  const relyTx = await governanceTinlake.relyAddress(adminAccount.address, contractAddresses['JUNIOR_OPERATOR'])
  await governanceTinlake.getTransactionReceipt(relyTx)

  // whitelist lender
  const approveAllowanceTx = await adminTinlake.approveAllowanceJunior(lenderAccount.address, amount, amount)
  await adminTinlake.getTransactionReceipt(approveAllowanceTx)

  // lender approves tranche to take currency
  const approveCurrencyTx = await lenderTinlake.approveCurrency(contractAddresses['JUNIOR'], amount)
  await lenderTinlake.getTransactionReceipt(approveCurrencyTx)

  // mint currency for lender
  const mintTx = await governanceTinlake.mintCurrency(lenderAccount.address, amount)
  await governanceTinlake.getTransactionReceipt(mintTx)

  // lender supplies tranche with funds
  const supplyTx = await lenderTinlake.supplyJunior(amount)
  await lenderTinlake.getTransactionReceipt(supplyTx)
}
