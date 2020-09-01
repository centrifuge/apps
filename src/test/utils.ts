import { Account } from './types'
import Tinlake from '..'
import { EthConfig } from '../Tinlake'
import { ITinlake } from '../types/tinlake'
import { ProviderConfig } from './config'
import { ethers, Signer } from 'ethers'
const SignerProvider = require('ethjs-provider-signer')
const { sign } = require('ethjs-signer')

export class TestProvider {
  public provider: ethers.providers.Provider
  public wallet: ethers.Wallet
  public ethConfig: EthConfig
  public transactionTimeout: number

  constructor(testConfig: ProviderConfig) {
    const { rpcUrl, godAccount, transactionTimeout } = testConfig
    this.provider = new ethers.providers.JsonRpcProvider(rpcUrl)
    this.wallet = new ethers.Wallet(godAccount.privateKey, this.provider)
    this.ethConfig = { from: godAccount.address }
    this.transactionTimeout = transactionTimeout
  }

  async fundAccountWithETH(usr: string, amount: string) {
    const transaction = {
      to: usr,
      value: ethers.utils.bigNumberify(amount),
    }

    const res = await this.wallet.sendTransaction(transaction)
    console.log('res', res)
    const receipt = await this.provider.waitForTransaction(res.hash!)
    console.log('receipt', receipt)
    return receipt
  }
}

export function createTinlake(usr: Account, testConfig: ProviderConfig): ITinlake {
  const { rpcUrl, transactionTimeout, gas, gasPrice, contractAddresses } = testConfig

  const tinlake = new Tinlake({
    contractAddresses,
    transactionTimeout,
    provider: createSignerProvider(rpcUrl, usr),
    ethConfig: { gas, gasPrice, from: usr.address },
    ethersConfig: createEthersConfig(rpcUrl, usr),
  })

  return tinlake
}

function createSignerProvider(rpcUrl: string, usr: Account) {
  return new SignerProvider(rpcUrl, {
    signTransaction: (rawTx: any, cb: (arg0: null, arg1: any) => void) => cb(null, sign(rawTx, usr.privateKey)),
    accounts: (cb: (arg0: null, arg1: string[]) => void) => cb(null, [usr.address]),
  })
}

function createEthersConfig(rpcUrl: string, usr: Account) {
  const provider = new ethers.providers.JsonRpcProvider(rpcUrl)
  const signer = new ethers.Wallet(usr.privateKey).connect(provider)
  return { provider, signer }
}
