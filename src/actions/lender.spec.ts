import assert from 'assert';
const account = require('ethjs-account');
const randomString = require('randomstring');

import testConfig from '../../test/config';
import { ITinlake } from '../Tinlake';
import { createTinlake, TestProvider } from '../../test/utils';

let lenderAccount;
let lenderTinlake;

const adminAccount = account.generate(randomString.generate(32));
const adminTinlake = createTinlake(adminAccount, testConfig);
const governanceTinlake = createTinlake(testConfig.godAccount, testConfig);
const testProvider = new TestProvider(testConfig);

const { SUCCESS_STATUS, FAUCET_AMOUNT, FAIL_STATUS, contractAddresses } = testConfig

describe('lender functions', async () => {

  before(async () => {
    // fund lender & admin accounts with currency
    await testProvider.fundAccountWithETH(adminAccount.address, FAUCET_AMOUNT);
    // rely admin on junior operator
    await governanceTinlake.relyAddress(adminAccount.address, contractAddresses["JUNIOR_OPERATOR"]);
  });

  beforeEach(async () => {
    lenderAccount = account.generate(randomString.generate(32));
    lenderTinlake = createTinlake(lenderAccount, testConfig);
    await testProvider.fundAccountWithETH(lenderAccount.address, FAUCET_AMOUNT);
  });


  it('success: supply junior', async () => {
    const currencyAmount = 100000;
    const tokenAmount = 100;
    // whitelist investor
    await adminTinlake.approveAllowanceJunior(lenderAccount.address, currencyAmount, tokenAmount)
    await supply(lenderAccount.address, `${currencyAmount}`, lenderTinlake);
    const newJuniorTokenBalance = await lenderTinlake.getJuniorTokenBalance(lenderAccount.address);
  });

  it('fail: supply junior - no allowance', async () => {
    const currencyAmount = 1000;
    // approve junior tranche to take currency
    await lenderTinlake.approveCurrency(contractAddresses['JUNIOR'], currencyAmount);
    // fund investor with tinlake currency
    await governanceTinlake.mintCurrency(lenderAccount.address, currencyAmount);

    // do not set allowance for lender
    const supplyResult = await lenderTinlake.supplyJunior(currencyAmount);

    // assert result successful
    assert.equal(supplyResult.status, FAIL_STATUS);
  });

  it('success: redeem junior', async () => {
    const currencyAmount = 10000;
    const tokenAmount = 100;
    // whitelist investor
    await adminTinlake.approveAllowanceJunior(lenderAccount.address, currencyAmount, tokenAmount)
    // supply currency - receive tokens
    await supply(lenderAccount.address, `${currencyAmount}`, lenderTinlake);
    // approve junior tranche to take tokens
    await lenderTinlake.approveJuniorToken(contractAddresses['JUNIOR'], tokenAmount);

    const initialLenderCurrencyBalance = await lenderTinlake.getCurrencyBalance(lenderAccount.address);
    const initialTrancheCurrencyBalance = await lenderTinlake.getCurrencyBalance(contractAddresses['JUNIOR']);
    const initialJuniorTokenBalance = await lenderTinlake.getJuniorTokenBalance(lenderAccount.address);

    const redeemResult = await lenderTinlake.redeemJunior(tokenAmount);


    const newTrancheCurrencyBalance = await lenderTinlake.getCurrencyBalance(contractAddresses['JUNIOR']);
    const newLenderCurrencyBalance = await lenderTinlake.getCurrencyBalance(lenderAccount.address);
    const newJuniorTokenBalance = await lenderTinlake.getJuniorTokenBalance(lenderAccount.address);
    assert.equal(redeemResult.status, SUCCESS_STATUS);
    assert.equal(initialTrancheCurrencyBalance.toNumber(), newTrancheCurrencyBalance.toNumber() + tokenAmount);
    assert.equal(initialLenderCurrencyBalance.toNumber() + tokenAmount, newLenderCurrencyBalance);
    assert.equal(tokenAmount, initialJuniorTokenBalance.toNumber() - newJuniorTokenBalance.toNumber());
  });

  it('fail: redeem junior - no allowance', async () => {
    const currencyAmount = 1000;
    const tokenAmount = 100;

    // whitelist investor with no allowance to redeem
    await adminTinlake.approveAllowanceJunior(lenderAccount.address, currencyAmount, 0)
    // supply currency - receive tokens
    await supply(lenderAccount.address, `${currencyAmount}`, lenderTinlake);
    // approve junior tranche to take tokens
    await lenderTinlake.approveJuniorToken(contractAddresses['JUNIOR'], tokenAmount);
    const redeemResult = await lenderTinlake.redeemJunior(tokenAmount);
    assert.equal(redeemResult.status, FAIL_STATUS);
  });
});

async function supply(investor: string, currencyAmount: string, tinlake: ITinlake) {
  // approve junior tranche to take currency
  await tinlake.approveCurrency(contractAddresses['JUNIOR'], currencyAmount);
  // fund investor with tinlake currency
  await governanceTinlake.mintCurrency(investor, currencyAmount);
  const initialLenderCurrencyBalance = await tinlake.getCurrencyBalance(investor);
  const initialTrancheCurrencyBalance = await tinlake.getCurrencyBalance(contractAddresses['JUNIOR']);
  const initialJuniorTokenBalance = await tinlake.getJuniorTokenBalance(investor);

  const supplyResult = await tinlake.supplyJunior(currencyAmount);
  const newTrancheCurrencyBalance = await tinlake.getCurrencyBalance(contractAddresses['JUNIOR']);
  const newLenderCurrencyBalance = await tinlake.getCurrencyBalance(investor);
  const newJuniorTokenBalance = await tinlake.getJuniorTokenBalance(investor);

  // assert result successful
  assert.equal(supplyResult.status, SUCCESS_STATUS);
  // assert tranche balance increased by currency amount
  assert.equal((newTrancheCurrencyBalance.toNumber() - initialTrancheCurrencyBalance.toNumber()), parseInt(currencyAmount));
  // assert investor currency balanace decreased
  assert.equal((initialLenderCurrencyBalance.toNumber() - newLenderCurrencyBalance.toNumber()), parseInt(currencyAmount));
  // assert investor received tokens
  assert.equal(initialJuniorTokenBalance.toNumber() + parseInt(currencyAmount), newJuniorTokenBalance.toNumber());
}