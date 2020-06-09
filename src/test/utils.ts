import { Account } from './types';
import Tinlake, { EthConfig } from '../Tinlake';
import { ITinlake } from '../types/tinlake';
import { ethI, executeAndRetry  } from '../services/ethereum';
import { ProviderConfig } from './config';
const Eth = require('ethjs');
const SignerProvider = require('ethjs-provider-signer');
const { sign } = require('ethjs-signer');


export class TestProvider {
  public eth : ethI;
  public sponsorAccount: Account;
  public ethConfig: EthConfig;
  public transactionTimeout: number;
  public gasLimit: number;

  constructor(testConfig: ProviderConfig) {
    const { rpcUrl, godAccount, gasLimit, transactionTimeout } = testConfig;
    this.eth = new Eth(createSignerProvider(rpcUrl, godAccount));
    this.ethConfig = { from: godAccount.address, gasLimit: `0x${gasLimit.toString(16)}` };
    this.transactionTimeout = transactionTimeout;
    this.sponsorAccount = godAccount;
  }

  async fundAccountWithETH(usr: string, amount: string) {
    const nonce = await this.eth.getTransactionCount(this.ethConfig.from);
    const transaction = {
      nonce,
      from: this.ethConfig.from,
      to: usr,
      value: amount,
      gas: this.ethConfig.gasLimit,
    };
    const signedTransaction = sign(transaction, this.sponsorAccount.privateKey);
    await executeAndRetry(this.eth.sendRawTransaction, [signedTransaction]);
  }
}

export function createTinlake(usr: Account, testConfig: ProviderConfig) : Partial<ITinlake> {
  const {
        rpcUrl,
        transactionTimeout,
        gasLimit,
        contractAddresses,
    } = testConfig;

  const tinlake = new Tinlake({
    contractAddresses,
    transactionTimeout,
    provider: createSignerProvider(rpcUrl, usr),
    ethConfig: { from: usr.address, gasLimit: `0x${gasLimit.toString(16)}` },
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
