import assert from 'assert'
import { createTinlake, TestProvider } from '../test/utils'
import testConfig from '../test/config'
import { ITinlake } from '../types/tinlake'
import { ethers } from 'ethers'

const testProvider = new TestProvider(testConfig)
const borrowerAccount = ethers.Wallet.createRandom()
const adminAccount = ethers.Wallet.createRandom()
let borrowerTinlake: ITinlake
let adminTinlake: ITinlake
let governanceTinlake: ITinlake

const { SUCCESS_STATUS, FAIL_STATUS, FAUCET_AMOUNT, contractAddresses } = testConfig

describe('proxy tests', async () => {
  before(async () => {
    borrowerTinlake = createTinlake(borrowerAccount, testConfig)
    adminTinlake = createTinlake(adminAccount, testConfig)
    governanceTinlake = createTinlake(testConfig.godAccount, testConfig)

    // fund accounts with ETH
    await testProvider.fundAccountWithETH(adminAccount.address, FAUCET_AMOUNT)
    await testProvider.fundAccountWithETH(borrowerAccount.address, FAUCET_AMOUNT)
    await testProvider.fundAccountWithETH(testConfig.godAccount.address, FAUCET_AMOUNT)
  })

  describe('proxy registry', async () => {
    it('success: full loan cycle - open, borrow, lock, withdraw, repay, unlock, close', async () => {

      // add governance address to memberlists
      // await governanceTinlake.updateJuniorMemberList(contractAddresses['GOVERNANCE'], 1608492994)
      // await governanceTinlake.updateSeniorMemberList(contractAddresses['GOVERNANCE'], 1608492994)

      // create new proxy and mint collateral NFT to borrower
      // const epochTx = await governanceTinlake.setMinimumEpochTime('1')
      // const challengeTx = await governanceTinlake.setMinimumChallengeTime('1')
      // const epochResult = await governanceTinlake.getTransactionReceipt(epochTx)
      // assert.equal(epochResult.status, SUCCESS_STATUS)
      // const challengeResult = await governanceTinlake.getTransactionReceipt(challengeTx)
      // assert.equal(challengeResult.status, SUCCESS_STATUS)
      //
      // const proxyAddr = await borrowerTinlake.proxyCreateNew(borrowerAccount.address)
      // const tokenId = await governanceTinlake.mintTitleNFT(testConfig.nftRegistry, borrowerAccount.address)
      // const approveTx = await borrowerTinlake.approveNFT(testConfig.nftRegistry, tokenId, proxyAddr)
      // const approveResult = await borrowerTinlake.getTransactionReceipt(approveTx)
      // assert.equal(approveResult.status, SUCCESS_STATUS)
      //
      // // issue loan from collateral NFT
      // const issueTx = await borrowerTinlake.proxyTransferIssue(proxyAddr, testConfig.nftRegistry, tokenId)
      // const issueResult = await borrowerTinlake.getTransactionReceipt(issueTx)
      //
      // assert.equal(issueResult.status, SUCCESS_STATUS)
      // assert.equal(await borrowerTinlake.getNFTOwner(testConfig.nftRegistry, tokenId), proxyAddr)
      //
      // // set loan parameters and fund tranche
      // const loanId = await borrowerTinlake.nftLookup(testConfig.nftRegistry, tokenId);
      // const amount = 100;
      // const relyTx = await governanceTinlake.relyAddress(adminAccount.address, contractAddresses['FEED']);
      // const relyResult = await governanceTinlake.getTransactionReceipt(relyTx)
      // assert.equal(relyResult.status, SUCCESS_STATUS)
      //
      // const nftfeedId = await adminTinlake.getNftFeedId(testConfig.nftRegistry, Number(tokenId))
      // const updateNftTx = await adminTinlake.updateNftFeed(nftfeedId, amount)
      // const updateNftResult = await adminTinlake.getTransactionReceipt(updateNftTx)
      // assert.equal(updateNftResult.status, SUCCESS_STATUS)
      //
      // const juniorAmount = '900'
      // const seniorAmount = '100'

      const balance = await borrowerTinlake.getCurrencyBalance(contractAddresses['RESERVE']);
      console.log(balance.toNumber())

      // await fundTranche(juniorAmount, 'junior');
      // await fundTranche(seniorAmount, 'senior');
      // const state = await governanceTinlake.getCurrentEpochState()
      // assert.equal(state, 'open')
      //
      // // assert.equal(state1, 'open')
      // const solveTx = await governanceTinlake.solveEpoch()
      // const executeTx = await governanceTinlake.executeEpoch()
      // const executeResult = await governanceTinlake.getTransactionReceipt(executeTx)
      // console.log(solveTx)
      // assert.equal(executeResult, SUCCESS_STATUS)

      // const disburseTx = await governanceTinlake.disburseSenior()
      // console.log(disburseTx)
      // const disburseResult = await governanceTinlake.getTransactionReceipt(disburseTx)
      // assert.equal(disburseResult.status, SUCCESS_STATUS)

      // borrow

      // const principal = await borrowerTinlake.getPrincipal(loanId.toString())
      // const principalAmount = principal.toString()
      // const principal = await borrowerTinlake.getCollateral(loanId.toString())
      // const principal2 = await borrowerTinlake.getNftFeedValue(nftfeedId)
      // console.log( 'principal2', principal2.toNumber())
      // console.log( 'principal', principal)
      // console.log( 'principal1', principal1.toNumber())
      // const borrowTx = await borrowerTinlake.proxyLockBorrowWithdraw(proxyAddr, loanId, '60', borrowerAccount.address);
      // add borrower address to memberlist so it can receive the restricted token
      // await governanceTinlake.approveCurrency(borrowerAccount.address, principalAmount)
      // const borrowTx = await borrowerTinlake.proxyLock(proxyAddr, loanId);
      // const borrowTx1 = await borrowerTinlake.proxyBorrowWithdraw(proxyAddr, loanId, principalAmount, borrowerAccount.address);
      // console.log('borrowTx', borrowTx)
      // const borrowResult = await borrowerTinlake.getTransactionReceipt(borrowTx)
      // console.log('borrowResult', borrowResult)
      //
      // const balance = await borrowerTinlake.getCurrencyBalance(borrowerAccount.address);
      // const secondTrancheBalance = await borrowerTinlake.getCurrencyBalance(contractAddresses['JUNIOR']);
      //
      // assert.equal(borrowResult.status, SUCCESS_STATUS);
      // assert.equal(balance.toString(), amount);
      // assert.equal(secondTrancheBalance.toString(), initialTrancheBalance.sub(new BN(amount)).toString());
      //
      // // fuel borrower with extra to cover loan interest, approve borrower proxy to take currency
      // const secondMintTx = await governanceTinlake.mintCurrency(borrowerAccount.address, amount.toString());
      // await governanceTinlake.getTransactionReceipt(secondMintTx)
      //
      // const secondApproveTx = await borrowerTinlake.approveCurrency(proxyAddr, amount.toString());
      // await borrowerTinlake.getTransactionReceipt(secondApproveTx)
      //
      // // repay
      // const repayTx = await borrowerTinlake.proxyRepayUnlockClose(proxyAddr, tokenId, loanId, testConfig.nftRegistry);
      // const repayResult = await borrowerTinlake.getTransactionReceipt(repayTx)
      // assert.equal(repayResult.status, SUCCESS_STATUS);
      //
      // // borrower should be owner of collateral NFT again
      // // tranche balance should be back to pre-borrow amount
      // const owner = await governanceTinlake.getNFTOwner(testConfig.nftRegistry, tokenId);
      // assert.equal(ethers.utils.getAddress(owner.toString()), ethers.utils.getAddress(borrowerAccount.address));
      //
      // await borrowerTinlake.getCurrencyBalance(proxyAddr);
      // const finalTrancheBalance = await borrowerTinlake.getCurrencyBalance(contractAddresses['JUNIOR']);
      //
      // assert.equal(initialTrancheBalance.toString(), finalTrancheBalance.toString());
    })
    //
    // it('fail: does not succeed if the proxy is not approved to take the NFT', async () => {
    //   const proxyAddr = await borrowerTinlake.proxyCreateNew(borrowerAccount.address)
    //   const tokenId = `${Math.floor(Math.random() * 10e15) + 1}`
    //
    //   const mintTx = await governanceTinlake.mintNFT(testConfig.nftRegistry, borrowerAccount.address, tokenId, '234', '345', '456')
    //   await governanceTinlake.getTransactionReceipt(mintTx)
    //
    //   const issueTx = await borrowerTinlake.proxyTransferIssue(proxyAddr, testConfig.nftRegistry, tokenId)
    //   const issueResult = await borrowerTinlake.getTransactionReceipt(issueTx)
    //
    //   assert.equal(issueResult.status, FAIL_STATUS)
    // })

    // it('fail: does not succeed if the proxy is not approved to transfer currency from the borrower', async () => {
    //   // create new proxy and mint collateral NFT to borrower
    //   const proxyAddr = await borrowerTinlake.proxyCreateNew(borrowerAccount.address);

    //   const nftId = await governanceTinlake.mintTitleNFT(testConfig.nftRegistry, borrowerAccount.address);
    //   const approveTx = await borrowerTinlake.approveNFT(testConfig.nftRegistry, nftId.toString(), proxyAddr);
    //   await borrowerTinlake.getTransactionReceipt(approveTx)
      
    //   // issue loan from collateral NFT
    //   const proxyTransferTx = await borrowerTinlake.proxyTransferIssue(proxyAddr, testConfig.nftRegistry, nftId);
    //   await borrowerTinlake.getTransactionReceipt(proxyTransferTx)
      
    //   // set loan parameters and fund tranche
    //   const loanId = await borrowerTinlake.nftLookup(testConfig.nftRegistry, nftId);
    //   const amount = 10;
    //   const relyTx = await governanceTinlake.relyAddress(adminAccount.address, contractAddresses['NFT_FEED']);
    //   await governanceTinlake.getTransactionReceipt(relyTx)
      
    //   const nftfeedId = await adminTinlake.getNftFeedId(testConfig.nftRegistry, Number(nftId))
    //   const updateNftTx = await adminTinlake.updateNftFeed(nftfeedId, Number(amount))
    //   await adminTinlake.getTransactionReceipt(updateNftTx)

    //   await fundTranche('10000000');
    //   await borrowerTinlake.getCurrencyBalance(contractAddresses['JUNIOR']);
      
    //   // borrow
    //   const proxyLockBorrowWithdrawTx = await borrowerTinlake.proxyLockBorrowWithdraw(proxyAddr, loanId, amount.toString(), borrowerAccount.address);
    //   await borrowerTinlake.getTransactionReceipt(proxyLockBorrowWithdrawTx)

    //   await borrowerTinlake.getCurrencyBalance(borrowerAccount.address);
    //   await borrowerTinlake.getCurrencyBalance(contractAddresses['JUNIOR']);
      
    //   // does not approve proxy to transfer currency
    //   const mintTx = await governanceTinlake.mintCurrency(borrowerAccount.address, amount.toString());
    //   await governanceTinlake.getTransactionReceipt(mintTx)
      
    //   // repay
    //   const repayTx = await borrowerTinlake.proxyRepayUnlockClose(proxyAddr, nftId, loanId, testConfig.nftRegistry);
    //   const repayResult = await borrowerTinlake.getTransactionReceipt(repayTx)
    //   assert.equal(repayResult.status, FAIL_STATUS);
    // })
  })
})

async function closeEpoch() {
  await governanceTinlake.setMinimumEpochTime('1')
  setTimeout(async () => {
  }, 2000)
}

// TODO: move to utils
async function fundTranche(amount: string, tranche: string) {
  const lenderAccount = ethers.Wallet.createRandom()
  const lenderTinlake = createTinlake(lenderAccount, testConfig)

  // fund lender account with eth
  await testProvider.fundAccountWithETH(lenderAccount.address, FAUCET_AMOUNT)

  if (tranche === 'junior') {
    // make admin address ward on memberlist & whitelist lender address for tranche
    await governanceTinlake.relyAddress(adminAccount.address, contractAddresses['JUNIOR_MEMBERLIST'])
    const whitelistTx = await adminTinlake.updateJuniorMemberList(lenderAccount.address, 1606780800)
    const whitelistResult = await governanceTinlake.getTransactionReceipt(whitelistTx)
    assert.equal(whitelistResult.status, SUCCESS_STATUS)


    // lender approves tranche to take currency
    const approveResult = await lenderTinlake.approveJuniorForCurrency(amount)
    assert.equal(approveResult && approveResult.status, SUCCESS_STATUS)

    // mint currency for lender
    const mintTx = await governanceTinlake.mintCurrency(lenderAccount.address, amount)
    const mintResult = await governanceTinlake.getTransactionReceipt(mintTx)
    assert.equal(mintResult.status, SUCCESS_STATUS)

    // lender supplies tranche with funds
    const supplyTx = await lenderTinlake.submitJuniorSupplyOrder(amount)
    const supplyResult = await lenderTinlake.getTransactionReceipt(supplyTx)
    assert.equal(supplyResult.status, SUCCESS_STATUS)

  } else if (tranche === 'senior') {

    // make admin address ward on memberlist & whitelist lender address for tranche
    await governanceTinlake.relyAddress(adminAccount.address, contractAddresses['SENIOR_MEMBERLIST'])
    const whitelistTx = await adminTinlake.updateSeniorMemberList(lenderAccount.address, 1606780800)
    const whitelistResult = await governanceTinlake.getTransactionReceipt(whitelistTx)
    assert.equal(whitelistResult.status, SUCCESS_STATUS)


    // lender approves tranche to take currency
    const approveResult = await lenderTinlake.approveSeniorForCurrency(amount)
    assert.equal(approveResult && approveResult.status, SUCCESS_STATUS)

    // mint currency for lender
    const mintTx = await governanceTinlake.mintCurrency(lenderAccount.address, amount)
    const mintResult = await governanceTinlake.getTransactionReceipt(mintTx)
    assert.equal(mintResult.status, SUCCESS_STATUS)

    // lender supplies tranche with funds
    const supplyTx = await lenderTinlake.submitSeniorSupplyOrder(amount)
    const supplyResult = await lenderTinlake.getTransactionReceipt(supplyTx)
    assert.equal(supplyResult.status, SUCCESS_STATUS)
  }
}
