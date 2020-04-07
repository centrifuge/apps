import assert from 'assert';
const account = require('ethjs-account');
const randomString = require('randomstring');
import testConfig from '../test/config';
import { ITinlake } from '../types/tinlake';
import { createTinlake, TestProvider } from '../test/utils';
import { Account } from '../test/types';

const adminAccount = account.generate(randomString.generate(32));
let borrowerAccount: Account;

// user with super powers can fund and rely accounts
const governanceTinlake: Partial<ITinlake> = createTinlake(testConfig.godAccount, testConfig);
const adminTinlake: Partial<ITinlake> = createTinlake(adminAccount, testConfig);
let borrowerTinlake: Partial<ITinlake>;

const testProvider = new TestProvider(testConfig);

const { SUCCESS_STATUS, FAUCET_AMOUNT, contractAddresses } = testConfig;

describe('borrower tests', async () => {

  before(async () =>  {
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
    await borrowerTinlake.approveNFT(tokenId, contractAddresses['SHELF']);

    // lock nft
    await borrowerTinlake.lock(loanId);
    assert.equal(await borrowerTinlake.getNFTOwner(tokenId), contractAddresses['SHELF']);
  });

  it('success: unlock nft', async () => {
    // mint nft & issue loan
    const { tokenId, loanId } = await mintIssue(borrowerAccount.address, borrowerTinlake);
    await borrowerTinlake.approveNFT(tokenId, contractAddresses['SHELF']);

    // lock nft
    await borrowerTinlake.lock(loanId);

    // unlock nft
    await borrowerTinlake.unlock(loanId);
  });

  it('success: borrow', async () => {
    const amount = '1000';
    await mintIssueBorrow(borrowerAccount.address, borrowerTinlake, amount);
  });

  it('success: repay', async () => {
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

    assert.equal(newDebt.toNumber(), 0);
    assert.equal(repayResult.status, SUCCESS_STATUS);
  });
});

async function mintIssue(usr: string, tinlake: Partial<ITinlake>) {
  // super user mints nft for borrower
  const tokenId : any = await governanceTinlake.mintTitleNFT(usr);
  assert(tokenId);
  // assert usr = nftOwner
  const nftOwner = `${await tinlake.getNFTOwner(tokenId)}`;
  assert.equal(nftOwner.toLowerCase(), usr.toLowerCase());

  const issueResult : any = await tinlake.issue(contractAddresses['COLLATERAL_NFT'], tokenId);
  const loanId = `${(await tinlake.loanCount()).toNumber() - 1}`;
  // assert loan successfully issued
  assert.equal(issueResult.status, SUCCESS_STATUS);
  // assert usr = loanOwner
  const titleOwner = `${await tinlake.getOwnerOfLoan(loanId)}`;
  assert.equal(titleOwner.toLowerCase(), usr.toLowerCase());

  return { tokenId: `${tokenId}`, loanId : `${loanId}` };
}

async function mintIssueBorrow(usr: string, tinlake: Partial<ITinlake>, amount: string) {
  const { tokenId, loanId } = await mintIssue(usr, tinlake);
  // approve shelf to take nft
  await borrowerTinlake.approveNFT(tokenId, contractAddresses['SHELF']);
  // lock nft
  await borrowerTinlake.lock(loanId);
  // admin sets ceiling
  await governanceTinlake.relyAddress(adminAccount.address, contractAddresses['CEILING']);
  await adminTinlake.setCeiling(loanId, amount);

  const initialBorrowerCurrencyBalance = await borrowerTinlake.getCurrencyBalance(borrowerAccount.address);
  // supply tranche with money
  const borrowResult = await borrowerTinlake.borrow(loanId, amount);
  const withdrawResult = await borrowerTinlake.withdraw(loanId, amount, borrowerAccount.address);

  const newBorrowerCurrencyBalance = await borrowerTinlake.getCurrencyBalance(borrowerAccount.address);

  assert.equal(initialBorrowerCurrencyBalance.toNumber() + amount, newBorrowerCurrencyBalance.toNumber());
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
