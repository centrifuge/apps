const randomString = require('randomstring');
const account = require('ethjs-account');
import assert from 'assert';
import { ITinlake } from '../types/tinlake';
import { createTinlake } from '../test/utils';
import testConfig from '../test/config';
import { ContractNames } from '../Tinlake';

// god account = governance address for the tinlake test deployment
const userAccount = account.generate(randomString.generate(32));
let governanceTinlake : Partial<ITinlake> ;

const { SUCCESS_STATUS, FAIL_STATUS, FAUCET_AMOUNT } = testConfig;

describe('governance tests', async () => {
  before(async () => {
    governanceTinlake = await createTinlake(testConfig.godAccount, testConfig);
  });

  describe('grant permissions', async () => {

    it('success: rely account on the ceiling contract', async () => {
            // rely user account on the ceiling contract
      await relyAddress(userAccount.address, 'CEILING');
    });

    it('success: rely account on the junior operator contract', async () => {
            // rely user account on the operator contract
      await relyAddress(userAccount.address, 'JUNIOR_OPERATOR');
    });

    it('success: rely account on the pile contract', async () => {
             // rely user account on the pile contract
      await relyAddress(userAccount.address, 'PILE');
    });

    it('fail: account has no governance permissions', async () => {
      const randomAccount = account.generate(randomString.generate(32));
      const randomTinlake = await createTinlake(randomAccount, testConfig);
      const res = await randomTinlake.relyAddress(userAccount.address, testConfig.contractAddresses['PILE']);
      assert.equal(res.status, FAIL_STATUS);
    });
  });
});

async function relyAddress(usr: string, contractName: ContractNames) {
  const res = await governanceTinlake.relyAddress(usr, testConfig.contractAddresses[contractName]);
  const isWard = await governanceTinlake.isWard(usr, contractName);
  assert.equal(isWard, 1);
  assert.equal(res.status, SUCCESS_STATUS);
}
