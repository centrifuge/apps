const randomString = require('randomstring');
const account = require('ethjs-account');
import assert from 'assert';
import { createTinlake, TestProvider } from '../test/utils';
import testConfig from '../test/config';
import { ethers } from 'ethers';
import { ITinlake } from '../types/tinlake';
import { EthConfig } from '../Tinlake';
import BN from 'bn.js';

const testProvider = new TestProvider(testConfig);
const borrowerAccount = account.generate(randomString.generate(32));
const adminAccount = account.generate(randomString.generate(32));
let borrowerTinlake: ITinlake;
let adminTinlake: ITinlake;
let governanceTinlake: ITinlake;

const { SUCCESS_STATUS, FAIL_STATUS, FAUCET_AMOUNT, contractAddresses } = testConfig;

describe('proxy tests', async () => {

  before(async () => {
    borrowerTinlake = createTinlake(borrowerAccount, testConfig);
    adminTinlake = createTinlake(adminAccount, testConfig);
    governanceTinlake = createTinlake(testConfig.godAccount, testConfig);
    // fund accounts with ETH
    await testProvider.fundAccountWithETH(adminAccount.address, FAUCET_AMOUNT);
    await testProvider.fundAccountWithETH(borrowerAccount.address, FAUCET_AMOUNT);
  });

  describe.only('proxy registry', async () => {
    it('success: full loan cycle - open, borrow, lock, withdraw, repay, unlock, close', async () => {
      // create new proxy and mint collateral NFT to borrower
      const proxyAddr = await borrowerTinlake.proxyCreateNew(borrowerAccount.address);
      const tokenId = `${Math.floor(Math.random() * 10e15) + 1}`;
      await governanceTinlake.mintNFT(testConfig.nftRegistry, borrowerAccount.address, tokenId, '234', '345', '456');
      await borrowerTinlake.approveNFT(testConfig.nftRegistry, tokenId, proxyAddr);
      // issue loan from collateral NFT
      const issueResult = await borrowerTinlake.proxyTransferIssue(testConfig.nftRegistry, proxyAddr, tokenId);
      assert.equal(issueResult.status, SUCCESS_STATUS);
      assert.equal(await borrowerTinlake.getNFTOwner(testConfig.nftRegistry, tokenId), proxyAddr);

      // TODO: update with v3, ceiling does currently not exist, need to use NFT Feed
      // set loan parameters and fund tranche
      // const loanId = await borrowerTinlake.nftLookup(contractAddresses.COLLATERAL_NFT, nftId);
      // const amount = '1000';
      // await governanceTinlake.relyAddress(adminTinlake.ethConfig.from, contractAddresses.CEILING);
      // await adminTinlake.setCeiling(loanId, amount);
      // await fundTranche('1000000000');
      // const initialTrancheBalance = await borrowerTinlake.getCurrencyBalance(contractAddresses.JUNIOR);
      // // borrow
      // const borrowResult = await borrowerTinlake.proxyLockBorrowWithdraw(proxyAddr, loanId, amount, borrowerAccount.address);
      // const balance = await borrowerTinlake.getCurrencyBalance(borrowerAccount.address);
      // const secondTrancheBalance = await borrowerTinlake.getCurrencyBalance(contractAddresses.JUNIOR);
      // assert.equal(borrowResult.status, SUCCESS_STATUS);
      // assert.equal(balance.toString(), amount);
      // assert.equal(secondTrancheBalance.toString(), initialTrancheBalance.sub(new BN(amount)).toString());
      // // fuel borrower with extra to cover loan interest, approve borrower proxy to take currency
      // await governanceTinlake.mintCurrency(borrowerAccount.address, amount.toString());
      // await borrowerTinlake.approveCurrency(proxyAddr, amount.toString());
      // // repay
      // const repayResult = await borrowerTinlake.proxyRepayUnlockClose(proxyAddr, nftId, loanId, contractAddresses.COLLATERAL_NFT);
      // assert.equal(repayResult.status, SUCCESS_STATUS);
      // // borrower should be owner of collateral NFT again
      // // tranche balance should be back to pre-borrow amount
      // const owner = await governanceTinlake.getNFTOwner(nftId);
      // assert.equal(ethers.utils.getAddress(owner.toString()), ethers.utils.getAddress(borrowerAccount.address));
      // await borrowerTinlake.getCurrencyBalance(proxyAddr);
      // const finalTrancheBalance = await borrowerTinlake.getCurrencyBalance(contractAddresses.JUNIOR);
      // assert.equal(initialTrancheBalance.toString(), finalTrancheBalance.toString());
    });

    it('fail: does not succeed if the proxy is not approved to take the NFT', async () => {
      const proxyAddr = await borrowerTinlake.proxyCreateNew(borrowerAccount.address);
      const tokenId = `${Math.floor(Math.random() * 10e15) + 1}`;
      await governanceTinlake.mintNFT(testConfig.nftRegistry, borrowerAccount.address, tokenId, '234', '345', '456');
      const res = await borrowerTinlake.proxyTransferIssue(testConfig.nftRegistry, proxyAddr, tokenId);
      assert.equal(res.status, FAIL_STATUS);
    });

    // TODO: update with v3, ceiling does currently not exist, need to use NFT Feed
    it.skip('fail: does not succeed if the proxy is not approved to transfer currency from the borrower', async () => {
      // // create new proxy and mint collateral NFT to vorrower
      // const proxyAddr = await borrowerTinlake.proxyCreateNew(borrowerAccount.address);
      // const nftId: any = await governanceTinlake.mintTitleNFT(borrowerAccount.address);
      // await borrowerTinlake.approveNFT(nftId, proxyAddr);
      // // issue loan from collateral NFT
      // await borrowerTinlake.proxyTransferIssue(proxyAddr, nftId);
      // // set loan parameters and fund tranche
      // const loanId = await borrowerTinlake.nftLookup(contractAddresses.COLLATERAL_NFT, nftId);
      // const amount = 1000;
      // await governanceTinlake.relyAddress(adminTinlake.ethConfig.from, contractAddresses.CEILING);
      // await adminTinlake.setCeiling(loanId, amount.toString());
      // await fundTranche('1000000000');
      // await borrowerTinlake.getCurrencyBalance(contractAddresses.JUNIOR);
      // // borrow
      // await borrowerTinlake.proxyLockBorrowWithdraw(proxyAddr, loanId, amount.toString(), borrowerAccount.address);
      // await borrowerTinlake.getCurrencyBalance(borrowerAccount.address);
      // await borrowerTinlake.getCurrencyBalance(contractAddresses.JUNIOR);
      // // does not approve proxy to transfer currency
      // await governanceTinlake.mintCurrency(borrowerAccount.address, amount.toString());
      // // repay
      // const repayResult = await borrowerTinlake.proxyRepayUnlockClose(proxyAddr, nftId, loanId, contractAddresses.COLLATERAL_NFT);
      // assert.equal(repayResult.status, FAIL_STATUS);
    });
  });
});

// TODO: move to utils
async function fundTranche(amount: string) {
  const lenderAccount = account.generate(randomString.generate(32));
  const lenderTinlake = createTinlake(lenderAccount, testConfig);
  // fund lender accoutn with eth
  await testProvider.fundAccountWithETH(lenderAccount.address, FAUCET_AMOUNT);
  // make admin adress ward on tranche operator
  await governanceTinlake.relyAddress(adminAccount.address, contractAddresses['JUNIOR_OPERATOR']);
  // whitelist lender
  await adminTinlake.approveAllowanceJunior(lenderAccount.address, amount, amount);
  // lender approves tranche to take currency
  await lenderTinlake.approveCurrency(contractAddresses['JUNIOR'], amount);
  // mint currency for lender
  await governanceTinlake.mintCurrency(lenderAccount.address, amount);
  // lender supplies tranche with funds
  await lenderTinlake.supplyJunior(amount);
}
