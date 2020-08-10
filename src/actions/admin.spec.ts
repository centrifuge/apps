const randomString = require('randomstring');
const account = require('ethjs-account');
import { ITinlake } from '../types/tinlake';
import assert from 'assert';
import { createTinlake, TestProvider } from '../test/utils';
import testConfig from '../test/config';
import { interestRateToFee } from '../utils/interestRateToFee';

const testProvider = new TestProvider(testConfig);
const adminAccount = account.generate(randomString.generate(32));
const borrowerAccount = account.generate(randomString.generate(32));
const lenderAccount = account.generate(randomString.generate(32));
const { SUCCESS_STATUS, FAUCET_AMOUNT, contractAddresses } = testConfig;
let adminTinlake : ITinlake;
let governanceTinlake : ITinlake;

// ------------ admin tests borrower-site -------------
describe('admin tests', async () => {

  before(async () => {
    // fund admin account with eth
    adminTinlake = createTinlake(adminAccount, testConfig);
    governanceTinlake = createTinlake(testConfig.godAccount, testConfig);
    await testProvider.fundAccountWithETH(adminAccount.address, FAUCET_AMOUNT);
    await testProvider.fundAccountWithETH(borrowerAccount.address, FAUCET_AMOUNT);
  });

  // ------------ admin tests lender-site -------------
  describe('operator', async () => {
    it('success: set allowance for junior investor', async () => {
      // rely admin on junior operator
      await governanceTinlake.relyAddress(adminAccount.address, contractAddresses['JUNIOR_OPERATOR']);
      const maxCurrency = '1000';
      const maxToken = '100';

      // set allowance for lender address
      const allowanceResult: any = await adminTinlake.approveAllowanceJunior(lenderAccount.address, maxCurrency, maxToken);

      const maxSupplyAmount = await adminTinlake.getMaxSupplyAmountJunior(lenderAccount.address);
      const maxRedeemAmount = await adminTinlake.getMaxRedeemAmountJunior(lenderAccount.address);
      assert.equal(allowanceResult.status, SUCCESS_STATUS);
      assert.equal(maxRedeemAmount, maxToken);
      assert.equal(maxSupplyAmount, maxCurrency);
    });
  });
});
