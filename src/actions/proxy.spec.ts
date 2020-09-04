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
  })

  describe('proxy registry', async () => {
    it('success: full loan cycle - open, borrow, lock, withdraw, repay, unlock, close', async () => {
      // create new proxy and mint collateral NFT to borrower
      const proxyAddr = await borrowerTinlake.proxyCreateNew(borrowerAccount.address)
      const tokenId = `${Math.floor(Math.random() * 10e15) + 1}`

      const mintTx = await governanceTinlake.mintNFT(testConfig.nftRegistry, borrowerAccount.address, tokenId, '234', '345', '456')
      await governanceTinlake.getTransactionReceipt(mintTx)

      const approveTx = await borrowerTinlake.approveNFT(testConfig.nftRegistry, tokenId, proxyAddr)
      await borrowerTinlake.getTransactionReceipt(approveTx)

      // issue loan from collateral NFT
      const issueTx = await borrowerTinlake.proxyTransferIssue(proxyAddr, testConfig.nftRegistry, tokenId)
      const issueResult = await borrowerTinlake.getTransactionReceipt(issueTx)

      assert.equal(issueResult.status, SUCCESS_STATUS)
      assert.equal(await borrowerTinlake.getNFTOwner(testConfig.nftRegistry, tokenId), proxyAddr)

      // set loan parameters and fund tranche
      const loanId = await borrowerTinlake.nftLookup(testConfig.nftRegistry, tokenId);
      const amount = '1000';
      const relyTx = await governanceTinlake.relyAddress(adminAccount.address, contractAddresses['NFT_FEED']);
      await governanceTinlake.getTransactionReceipt(relyTx)
      
      const nftfeedId = await adminTinlake.getNftFeedId(testConfig.nftRegistry, Number(tokenId))
      const updateNftTx = await adminTinlake.updateNftFeed(nftfeedId, Number(amount))
      await adminTinlake.getTransactionReceipt(updateNftTx)
      
      await fundTranche('10000');
      const initialTrancheBalance = await borrowerTinlake.getCurrencyBalance(contractAddresses['JUNIOR']);

      // borrow
      console.log(initialTrancheBalance.toNumber())
      const borrowResult = await borrowerTinlake.proxyLockBorrowWithdraw(proxyAddr, loanId, amount, borrowerAccount.address);
      const balance = await borrowerTinlake.getCurrencyBalance(borrowerAccount.address);
      const secondTrancheBalance = await borrowerTinlake.getCurrencyBalance(contractAddresses['JUNIOR']);
      assert.equal(borrowResult.status, SUCCESS_STATUS);
      assert.equal(balance.toString(), amount);
      assert.equal(secondTrancheBalance.toString(), initialTrancheBalance.sub(new BN(amount)).toString());

      // fuel borrower with extra to cover loan interest, approve borrower proxy to take currency
      await governanceTinlake.mintCurrency(borrowerAccount.address, amount.toString());
      await borrowerTinlake.approveCurrency(proxyAddr, amount.toString());

      // repay
      const repayResult = await borrowerTinlake.proxyRepayUnlockClose(proxyAddr, tokenId, loanId, testConfig.nftRegistry);
      assert.equal(repayResult.status, SUCCESS_STATUS);

      // borrower should be owner of collateral NFT again
      // tranche balance should be back to pre-borrow amount
      const owner = await governanceTinlake.getNFTOwner(testConfig.nftRegistry, tokenId);
      assert.equal(ethers.utils.getAddress(owner.toString()), ethers.utils.getAddress(borrowerAccount.address));
      await borrowerTinlake.getCurrencyBalance(proxyAddr);
      const finalTrancheBalance = await borrowerTinlake.getCurrencyBalance(contractAddresses['JUNIOR']);
      assert.equal(initialTrancheBalance.toString(), finalTrancheBalance.toString());
    })

    it('fail: does not succeed if the proxy is not approved to take the NFT', async () => {
      const proxyAddr = await borrowerTinlake.proxyCreateNew(borrowerAccount.address)
      const tokenId = `${Math.floor(Math.random() * 10e15) + 1}`

      const mintTx = await governanceTinlake.mintNFT(testConfig.nftRegistry, borrowerAccount.address, tokenId, '234', '345', '456')
      await governanceTinlake.getTransactionReceipt(mintTx)

      // TODO: the next line fails with this error: "Error caught in tinlake.pending(): Error: The execution failed due to an exception."
      const issueTx = await borrowerTinlake.proxyTransferIssue(proxyAddr, testConfig.nftRegistry, tokenId)
      console.log('issueTx', issueTx)
      const issueResult = await borrowerTinlake.getTransactionReceipt(issueTx)
      
      assert.equal(issueResult.status, FAIL_STATUS)
    })

    it('fail: does not succeed if the proxy is not approved to transfer currency from the borrower', async () => {
      // create new proxy and mint collateral NFT to borrower
      const proxyAddr = await borrowerTinlake.proxyCreateNew(borrowerAccount.address);
      const nftId: any = await governanceTinlake.mintTitleNFT(testConfig.nftRegistry, borrowerAccount.address);
      await borrowerTinlake.approveNFT(testConfig.nftRegistry, nftId, proxyAddr);
      // issue loan from collateral NFT
      await borrowerTinlake.proxyTransferIssue(proxyAddr, testConfig.nftRegistry, nftId);
      // set loan parameters and fund tranche
      const loanId = await borrowerTinlake.nftLookup(testConfig.nftRegistry, nftId);
      const amount = 1000;
      await governanceTinlake.relyAddress(adminAccount.address, contractAddresses['NFT_FEED']);
      const nftfeedId = await adminTinlake.getNftFeedId(testConfig.nftRegistry, Number(nftId))
      await adminTinlake.updateNftFeed(nftfeedId, Number(amount))
      await fundTranche('1000000000');
      await borrowerTinlake.getCurrencyBalance(contractAddresses['JUNIOR']);
      // borrow
      await borrowerTinlake.proxyLockBorrowWithdraw(proxyAddr, loanId, amount.toString(), borrowerAccount.address);
      await borrowerTinlake.getCurrencyBalance(borrowerAccount.address);
      await borrowerTinlake.getCurrencyBalance(contractAddresses['JUNIOR']);
      // does not approve proxy to transfer currency
      await governanceTinlake.mintCurrency(borrowerAccount.address, amount.toString());
      // repay
      const repayResult = await borrowerTinlake.proxyRepayUnlockClose(proxyAddr, nftId, loanId, testConfig.nftRegistry);
      assert.equal(repayResult.status, FAIL_STATUS);
    })
  })
})

// TODO: move to utils
async function fundTranche(amount: string) {
  const lenderAccount = ethers.Wallet.createRandom()
  const lenderTinlake = createTinlake(lenderAccount, testConfig)
  // fund lender account with eth
  await testProvider.fundAccountWithETH(lenderAccount.address, FAUCET_AMOUNT)
  // make admin address ward on tranche operator
  await governanceTinlake.relyAddress(adminAccount.address, contractAddresses['JUNIOR_OPERATOR'])
  // whitelist lender
  await adminTinlake.approveAllowanceJunior(lenderAccount.address, amount, amount)
  // lender approves tranche to take currency
  await lenderTinlake.approveCurrency(contractAddresses['JUNIOR'], amount)
  // mint currency for lender
  await governanceTinlake.mintCurrency(lenderAccount.address, amount)
  // lender supplies tranche with funds
  await lenderTinlake.supplyJunior(amount)
}
