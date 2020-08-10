import assert from 'assert';
const account = require('ethjs-account');
const randomString = require('randomstring');
import testConfig from '../test/config';
import { ITinlake } from '../types/tinlake';
import { createTinlake, TestProvider } from '../test/utils';
import { Account } from '../test/types';
import BN from 'bn.js';

const adminAccount = account.generate(randomString.generate(32));
let borrowerAccount: Account;

// user with super powers can fund and rely accounts
let governanceTinlake: ITinlake;
let adminTinlake: ITinlake;
let borrowerTinlake: ITinlake;

const testProvider = new TestProvider(testConfig);

const { SUCCESS_STATUS, FAUCET_AMOUNT, contractAddresses } = testConfig;

describe('borrower tests', async () => {

  before(async () =>  {
    governanceTinlake = createTinlake(testConfig.godAccount, testConfig);
    adminTinlake = createTinlake(adminAccount, testConfig);
    // fund borrowerAccount with ETH
    await testProvider.fundAccountWithETH(adminAccount.address, FAUCET_AMOUNT);
    const amount = '5000';
    // supply tranche with money
    await fundTranche(amount);
  });

  beforeEach(async() => {
    borrowerAccount = account.generate(randomString.generate(32));
    borrowerTinlake = createTinlake(borrowerAccount, testConfig);
    await testProvider.fundAccountWithETH(borrowerAccount.address, FAUCET_AMOUNT);
  });

  it('success: issue loan from a minted collateral NFT', async () => {
    await mintIssue(borrowerAccount.address, borrowerTinlake);
  });

  it('success: close loan', async () => {
    const { loanId } = await mintIssue(borrowerAccount.address, borrowerTinlake);
    const closeResult = await borrowerTinlake.close(loanId);
    assert.equal(closeResult.status, SUCCESS_STATUS);
  });

  it('success: lock nft', async () => {
    // mint nft & issue loan
    const { tokenId, loanId } = await mintIssue(borrowerAccount.address, borrowerTinlake);
    await borrowerTinlake.approveNFT(testConfig.nftRegistry, tokenId, contractAddresses['SHELF']);

    // lock nft
    await borrowerTinlake.lock(loanId);
    assert.equal(await borrowerTinlake.getNFTOwner(testConfig.nftRegistry, tokenId), contractAddresses['SHELF'].toLowerCase());
  });

  it('success: unlock nft', async () => {
    // mint nft & issue loan
    const { tokenId, loanId } = await mintIssue(borrowerAccount.address, borrowerTinlake);
    await borrowerTinlake.approveNFT(testConfig.nftRegistry, tokenId, contractAddresses['SHELF']);

    // lock nft
    await borrowerTinlake.lock(loanId);

    // unlock nft
    await borrowerTinlake.unlock(loanId);
  });

  // TODO: does not work because NFT feed does not have value this NFT
  it.skip('success: borrow', async () => {
    const amount = '1000';
    await mintIssueBorrow(borrowerAccount.address, borrowerTinlake, amount);
  });

  // TODO: does not work because NFT feed does not have value this NFT
  it.skip('success: repay', async () => {
    const amount = '1000';
    const { loanId } = await mintIssueBorrow(borrowerAccount.address, borrowerTinlake, amount);
    // wait to secs so that interest can accrue
    await new Promise(r => setTimeout(r, 3000));
    // mint extra currency so that borrower can repay loan with interest
    await governanceTinlake.mintCurrency(borrowerAccount.address, FAUCET_AMOUNT);
    // repay loan
    const initialDebt = await borrowerTinlake.getDebt(loanId);
    // approve shelf to take currency
    await borrowerTinlake.approveCurrency(contractAddresses['SHELF'], initialDebt.toString());
    const repayResult = await borrowerTinlake.repay(loanId, initialDebt.toString());
    const newDebt = await borrowerTinlake.getDebt(loanId);

    assert.equal(newDebt.toString(), '0');
    assert.equal(repayResult.status, SUCCESS_STATUS);
  });
});

async function mintIssue(usr: string, tinlake: ITinlake) {
  // super user mints nft for borrower
  const tokenId = `${Math.floor(Math.random() * 10e15) + 1}`;
  await governanceTinlake.mintNFT(testConfig.nftRegistry, usr, tokenId, '234', '345', '456');

  // assert usr = nftOwner
  const nftOwner = await tinlake.getNFTOwner(testConfig.nftRegistry, tokenId);
  assert.equal(`${nftOwner}`.toLowerCase(), usr.toLowerCase());

  const issueResult : any = await tinlake.issue(testConfig.nftRegistry, tokenId);
  const loanId = `${(await tinlake.loanCount()).toNumber() - 1}`;
  // assert loan successfully issued
  assert.equal(issueResult.status, SUCCESS_STATUS);
  // assert usr = loanOwner
  const titleOwner = `${await tinlake.getOwnerOfLoan(loanId)}`;
  assert.equal(titleOwner.toLowerCase(), usr.toLowerCase());

  return { tokenId: `${tokenId}`, loanId : `${loanId}` };
}

async function mintIssueBorrow(usr: string, tinlake: ITinlake, amount: string) {
  const { tokenId, loanId } = await mintIssue(usr, tinlake);
  // approve shelf to take nft
  await borrowerTinlake.approveNFT(testConfig.nftRegistry, tokenId, contractAddresses['SHELF']);
  // lock nft
  await borrowerTinlake.lock(loanId);

  const initialBorrowerCurrencyBalance = await borrowerTinlake.getCurrencyBalance(borrowerAccount.address);
  // supply tranche with money
  console.log({ initialBorrowerCurrencyBalance });
  const borrowResult = await borrowerTinlake.borrow(loanId, amount);
  console.log({ borrowResult });
  const withdrawResult = await borrowerTinlake.withdraw(loanId, amount, borrowerAccount.address);
  console.log({ withdrawResult });

  const newBorrowerCurrencyBalance = await borrowerTinlake.getCurrencyBalance(borrowerAccount.address);
  console.log({ newBorrowerCurrencyBalance });

  assert.equal(initialBorrowerCurrencyBalance.add(new BN(amount)).toString(), newBorrowerCurrencyBalance.toString());
  assert.equal(borrowResult.status, SUCCESS_STATUS);
  assert.equal(withdrawResult.status, SUCCESS_STATUS);

  return { tokenId, loanId };
}

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
