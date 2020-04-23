import assert from 'assert';
import { ethers } from 'ethers';
import testConfig from './test/config';
import { ITinlake } from './types/tinlake';
import { createTinlake } from './test/utils';

describe('Tinlake setup tests', async () => {

  it('success: retrieve all addresses for a give contract root', async () => {
    const tinlake: Partial<ITinlake> = await createTinlake(testConfig.godAccount, testConfig);
    const { allAddresses } = testConfig;

    // check whether the addresses derived based on the root contract are correct
    Object.keys(tinlake.contractAddresses).forEach((contractName) => {
      assert(ethers.utils.getAddress(allAddresses[contractName]) === ethers.utils.getAddress(tinlake.contractAddresses[contractName]));
    });
  });
});
