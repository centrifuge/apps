import { Account } from './types';
import Tinlake, { ITinlake } from '../src/Tinlake';
import { ethI, EthConfig, ContractAbis, ContractAddresses, ContractNames } from '../src/types';
import { executeAndRetry, waitAndReturnEvents } from '../src/ethereum';
const Eth = require('ethjs');
const SignerProvider = require('ethjs-provider-signer');
const { sign } = require('ethjs-signer');

export class TestProvider {
  public eth : ethI;
  public sponsorAccount: Account;
  public ethConfig: EthConfig;
  public transactionTimeout: number;
  public gasLimit: number;

  constructor(testConfig: any) {
    const { rpcUrl, godAccount, gasLimit, transactionTimeout } = testConfig;
    this.eth = new Eth(createSignerProvider(rpcUrl, godAccount));
    this.ethConfig = { from: godAccount.address, gasLimit: `0x${gasLimit.toString(16)}` };
    this.transactionTimeout = transactionTimeout;
    this.sponsorAccount = godAccount;
  }

  async fundAccountWithETH(usr: string, amount: string) {
    const nonce = await this.eth.getTransactionCount(this.ethConfig.from);
    const transaction = {
      from: this.ethConfig.from,
      to: usr,
      value: amount,
      gas: this.ethConfig.gasLimit,
      nonce,
    };
    const signedTransaction = sign(transaction, this.sponsorAccount.privateKey);
    await executeAndRetry(this.eth.sendRawTransaction, [signedTransaction]);
  }
}

export function createTinlake(usr: Account, testConfig: any) {
  const {
        rpcUrl,
        transactionTimeout,
        gasLimit,
        contractAddresses,
        nftDataContractCall,
    } = testConfig;

  const tinlake = new Tinlake(
        createSignerProvider(rpcUrl, usr),
        contractAddresses,
        nftDataContractCall.outputs,
        transactionTimeout,
        {
      ethConfig: { from: usr.address, gasLimit: `0x${gasLimit.toString(16)}` },
    },
    );

  return tinlake;
}

function createSignerProvider(rpcUrl: string, usr: Account) {
  return new SignerProvider(rpcUrl, {
    signTransaction: (rawTx: any, cb: (arg0: null, arg1: any) => void) =>
          cb(null, sign(rawTx, usr.privateKey)),
    accounts: (cb: (arg0: null, arg1: string[]) => void) => cb(null, [usr.address]),
  });
}
