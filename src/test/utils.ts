import { Account } from './types';
import Tinlake from '..';
import { EthConfig } from '../Tinlake';
import { ITinlake } from '../types/tinlake';
import { ProviderConfig } from './config';
import { ethers, Signer } from 'ethers';
const SignerProvider = require('ethjs-provider-signer');
const { sign } = require('ethjs-signer');

export class TestProvider {
  public wallet: ethers.Wallet;
  public ethConfig: EthConfig;
  public transactionTimeout: number;

  constructor(testConfig: ProviderConfig) {
    const { rpcUrl, godAccount, transactionTimeout } = testConfig;
    const provider = new ethers.providers.JsonRpcProvider(rpcUrl);
    this.wallet = new ethers.Wallet(godAccount.privateKey, provider);
    this.ethConfig = { from: godAccount.address };
    this.transactionTimeout = transactionTimeout;
  }

  async fundAccountWithETH(usr: string, amount: string) {
    const transaction = {
      to: usr,
      value: ethers.utils.bigNumberify(amount),
    };

    const res = await this.wallet.sendTransaction(transaction);
    await res.wait(1);
  }
}

export function createTinlake(usr: Account, testConfig: ProviderConfig) : ITinlake {
  const {
      rpcUrl,
      transactionTimeout,
      gas,
      gasPrice,
      contractAddresses,
  } = testConfig;

  const tinlake = new Tinlake({
    contractAddresses,
    transactionTimeout,
    provider: createSignerProvider(rpcUrl, usr),
    ethConfig: { gas, gasPrice, from: usr.address },
  });

  return tinlake;
}

function createSignerProvider(rpcUrl: string, usr: Account) {
  return new SignerProvider(rpcUrl, {
    signTransaction: (rawTx: any, cb: (arg0: null, arg1: any) => void) =>
          cb(null, sign(rawTx, usr.privateKey)),
    accounts: (cb: (arg0: null, arg1: string[]) => void) => cb(null, [usr.address]),
  });
}
