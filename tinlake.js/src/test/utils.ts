import assert from 'assert'
import { ethers } from 'ethers'
import Tinlake from '..'
import { ITinlake, PendingTransaction } from '../types/tinlake'
import { ProviderConfig } from './config'
import testConfig from './config'
const { SUCCESS_STATUS } = testConfig

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

  createRandomAccount(): ethers.Wallet {
    return ethers.Wallet.createRandom().connect(this.provider)
  }

  async fundAccountWithETH(usr: string, amount: string) {
    // console.log(`funding account ${usr} with ${amount} ETH`)
    await transferEth(this.wallet, usr, ethers.BigNumber.from(amount))
    // console.log(`funded account ${usr} with ${amount} ETH`)
  }

  async refundETHFromAccount(account: ethers.Wallet) {
    const balance = await account.provider.getBalance(account.address)
    // console.log(`refunding from account ${account.address} with ${balance.toString()} ETH`)
    const refundAmt = balance.sub('105000000000000')
    await transferEth(account, this.wallet.address, refundAmt)
    // console.log(`refunded from account ${account.address} ${refundAmt.toString()} ETH (balance - gas)`)
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

export async function transferEth(from: ethers.Wallet, to: string, value: ethers.BigNumber) {
  const transaction = {
    to,
    value,
  }

  const res = await from.sendTransaction(transaction)
  await from.provider.waitForTransaction(res.hash!)
}

export async function assertTxSuccess(tinlake: ITinlake, transaction: PendingTransaction) {
  const transactionResult = await tinlake.getTransactionReceipt(transaction)
  assert.strictEqual(transactionResult.status, SUCCESS_STATUS)
}
