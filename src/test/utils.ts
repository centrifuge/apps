import Tinlake from '..'
import { ITinlake } from '../types/tinlake'
import { ProviderConfig } from './config'
import { ethers, Wallet } from 'ethers'

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
      value: ethers.utils.bigNumberify(amount),
    }

    const res = await this.wallet.sendTransaction(transaction)
    await this.provider.waitForTransaction(res.hash!)
  }
}

export function createTinlake(wallet: Wallet, testConfig: ProviderConfig): ITinlake {
  const { rpcUrl, transactionTimeout, contractAddresses } = testConfig

  const tinlake = new Tinlake({
    contractAddresses,
    transactionTimeout,
    overrides: testConfig.overrides,
    ethersConfig: createEthersConfig(rpcUrl, wallet),
  })

  return tinlake
}

function createEthersConfig(rpcUrl: string, wallet: Wallet) {
  const provider = new ethers.providers.JsonRpcProvider(rpcUrl)
  const signer = new ethers.Wallet(wallet.privateKey).connect(provider)
  return { provider, signer }
}
