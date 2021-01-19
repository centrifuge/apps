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

  async fundAccountWithETH(account: ethers.Wallet, amount: string) {
    console.log(`funding account ${account.address} with ${amount} ETH`)
    await transferEth(this.wallet, account.address, ethers.BigNumber.from(amount))
    console.log(`funded account ${account.address} with ${amount} ETH`)
  }

  async refundETHFromAccount(account: ethers.Wallet) {
    const balance = await account.provider.getBalance(account.address)
    console.log(`refunding from account ${account.address} with ${balance.toString()} ETH`)
    const gasPrice = await account.provider.getGasPrice()
    const gasLimit = 21000 // simple transfer default, if recipient runs no logic
    const refundAmt = balance.sub(gasPrice.mul(gasLimit))
    await transferEth(account, this.wallet.address, refundAmt, { gasPrice, gasLimit })
    console.log(`refunded from account ${account.address} ${refundAmt.toString()} ETH (balance - gas)`)
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

export async function transferEth(
  from: ethers.Wallet,
  to: string,
  value: ethers.BigNumber,
  options?: ethers.utils.Deferrable<ethers.providers.TransactionRequest>
) {
  const res = await from.sendTransaction({
    to,
    value,
    ...options,
  })
  await from.provider.waitForTransaction(res.hash!)
}

export async function assertTxSuccess(tinlake: ITinlake, transaction: PendingTransaction) {
  const transactionResult = await tinlake.getTransactionReceipt(transaction)
  assert.strictEqual(transactionResult.status, SUCCESS_STATUS)
}
