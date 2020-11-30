import Tinlake from '..'
import { ITinlake } from '../types/tinlake'
import { ProviderConfig } from './config'
import { ethers } from 'ethers'

export class TestProvider {
  public provider: ethers.providers.Provider
  public wallet: ethers.Wallet
  public transactionTimeout: number

  constructor(testConfig: ProviderConfig) {
    const { rpcUrl, godAccount, transactionTimeout } = testConfig
    this.provider = new ethers.providers.JsonRpcProvider(rpcUrl)
    this.wallet = new ethers.Wallet(godAccount.privateKey, this.provider)
    this.transactionTimeout = transactionTimeout
  }

  async fundAccountWithETH(usr: string, amount: string) {
    const transaction = {
      to: usr,
      value: ethers.BigNumber.from(amount),
    }

    const res = await this.wallet.sendTransaction(transaction)
    await this.provider.waitForTransaction(res.hash!)
  }
}

export function createTinlake(wallet: ethers.Wallet, testConfig: ProviderConfig): ITinlake {
  const { rpcUrl, transactionTimeout, contractAddresses } = testConfig
  const provider = new ethers.providers.JsonRpcProvider(rpcUrl)

  const tinlake = new Tinlake({
    contractAddresses,
    transactionTimeout,
    provider,
    signer: wallet.connect(provider),
    overrides: testConfig.overrides,
  })

  return tinlake
}
