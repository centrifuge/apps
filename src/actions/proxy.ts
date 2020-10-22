import { Constructor, TinlakeParams, PendingTransaction } from '../Tinlake'
import BN from 'bn.js'
import { ethers } from 'ethers'

export function ProxyActions<ActionsBase extends Constructor<TinlakeParams>>(Base: ActionsBase) {
  return class extends Base implements IProxyActions {
    getProxyAccessTokenOwner = async (tokenId: string): Promise<BN> => {
      return this.contract('PROXY_REGISTRY').ownerOf(tokenId)
    }

    buildProxy = async (owner: string) => {
      const tx = await this.contract('PROXY_REGISTRY')['build(address)'](owner, this.overrides)
      const receipt = await this.getTransactionReceipt(tx)

      if (!(receipt.logs && receipt.logs[1])) {
        throw new Error('Created() event missing in proxyRegistry.build(address) receipt')
      }

      // Two events are emitted: Transfer() (from the ERC721 contract mint method) and Created() (from the ProxyRegistry contract)
      // We parse the 4th arg of the Created() event, to grab the access token
      const parsedLog = this.contract('PROXY_REGISTRY').interface.parseLog(receipt.logs[1])
      const accessToken = parsedLog.values['3'].toNumber()

      return accessToken
    }

    getProxy = async (accessTokenId: string) => {
      return await this.contract('PROXY_REGISTRY').proxies(accessTokenId)
    }

    getProxyAccessToken = async (proxyAddress: string) => {
      const proxy = this.contract('PROXY', proxyAddress)
      const accessToken = (await proxy.accessToken()).toBN()
      return accessToken.toNumber()
    }

    getProxyOwnerByLoan = async (loanId: string) => {
      const loanOwner = this.contract('TITLE').ownerOf(loanId)
      const accessToken = await this.getProxyAccessToken(loanOwner)
      return this.getProxyAccessTokenOwner(accessToken)
    }

    getProxyOwnerByAddress = async (proxyAddress: string) => {
      const accessToken = await this.getProxyAccessToken(proxyAddress)
      return this.getProxyAccessTokenOwner(accessToken)
    }

    proxyCount = async (): Promise<BN> => {
      return (await this.contract('PROXY_REGISTRY').count()).toBN()
    }

    checkProxyExists = async (address: string): Promise<string | null> => {
      const count = (await this.proxyCount()).toNumber()
      for (let i = 1; i < count; i += 1) {
        const accessToken = i.toString()
        const ownerBN = await this.getProxyAccessTokenOwner(accessToken)
        if (ownerBN && ethers.utils.getAddress(ownerBN.toString()) === ethers.utils.getAddress(address)) {
          return await this.getProxy(accessToken)
        }
      }
      return null
    }

    proxyCreateNew = async (address: string) => {
      const accessToken = await this.buildProxy(address)
      return await this.getProxy(accessToken)
    }

    proxyIssue = async (proxyAddress: string, nftRegistryAddress: string, tokenId: string) => {
      const proxy = this.contract('PROXY', proxyAddress)
      const encoded = this.contract('ACTIONS').interface.functions.issue.encode([
        this.contract('SHELF').address,
        nftRegistryAddress,
        tokenId,
      ])

      return this.pending(
        proxy.execute(this.contract('ACTIONS').address, encoded, { ...this.overrides, gasLimit: 300000 })
      )
    }

    proxyTransferIssue = async (proxyAddress: string, nftRegistryAddress: string, tokenId: string) => {
      const proxy = this.contract('PROXY', proxyAddress)
      const encoded = this.contract('ACTIONS').interface.functions.transferIssue.encode([
        this.contract('SHELF').address,
        nftRegistryAddress,
        tokenId,
      ])

      return this.pending(
        proxy.execute(this.contract('ACTIONS').address, encoded, { ...this.overrides, gasLimit: 300000 })
      )
    }

    proxyLockBorrowWithdraw = async (proxyAddress: string, loanId: string, amount: string, usr: string) => {
      const proxy = this.contract('PROXY', proxyAddress)
      const encoded = this.contract('ACTIONS').interface.functions.lockBorrowWithdraw.encode([
        this.contract('SHELF').address,
        loanId,
        amount,
        usr,
      ])

      return this.pending(
        proxy.execute(this.contract('ACTIONS').address, encoded, { ...this.overrides, gasLimit: 700000 })
      )
    }

    proxyLock = async (proxyAddress: string, loanId: string) => {
      const proxy = this.contract('PROXY', proxyAddress)
      const encoded = this.contract('ACTIONS').interface.functions.lock.encode([this.contract('SHELF').address, loanId])

      return this.pending(proxy.execute(this.contract('ACTIONS').address, encoded, this.overrides))
    }

    proxyBorrowWithdraw = async (proxyAddress: string, loanId: string, amount: string, usr: string) => {
      const proxy = this.contract('PROXY', proxyAddress)
      const encoded = this.contract('ACTIONS').interface.functions.borrowWithdraw.encode([
        this.contract('SHELF').address,
        loanId,
        amount,
        usr,
      ])

      return this.pending(proxy.execute(this.contract('ACTIONS').address, encoded, this.overrides))
    }

    proxyRepay = async (proxyAddress: string, loanId: string, amount: string) => {
      const proxy = this.contract('PROXY', proxyAddress)
      const encoded = this.contract('ACTIONS').interface.functions.repay.encode([
        this.contract('SHELF').address,
        this.contract('TINLAKE_CURRENCY').address,
        loanId,
        amount,
      ])

      return this.pending(proxy.execute(this.contract('ACTIONS').address, encoded, this.overrides))
    }

    proxyRepayUnlockClose = async (proxyAddress: string, tokenId: string, loanId: string, registry: string) => {
      const proxy = this.contract('PROXY', proxyAddress)
      const encoded = this.contract('ACTIONS').interface.functions.repayUnlockClose.encode([
        this.contract('SHELF').address,
        this.contract('PILE').address,
        registry,
        tokenId,
        this.contract('TINLAKE_CURRENCY').address,
        loanId,
      ])

      return this.pending(proxy.execute(this.contract('ACTIONS').address, encoded, this.overrides))
    }
  }
}

export type IProxyActions = {
  buildProxy(owner: string): Promise<number>
  checkProxyExists(address: string): Promise<string | null>
  getProxy(accessTokenId: string): Promise<string>
  proxyCount(): Promise<BN>
  getProxyAccessToken(proxyAddr: string): Promise<number>
  getProxyAccessTokenOwner(tokenId: string): Promise<BN>
  getProxyOwnerByLoan(loanId: string): Promise<BN>
  getProxyOwnerByAddress(proxyAddr: string): Promise<BN>
  proxyCreateNew(address: string): Promise<string>
  proxyIssue(proxyAddr: string, nftRegistryAddr: string, tokenId: string): Promise<PendingTransaction>
  proxyTransferIssue(proxyAddr: string, nftRegistryAddr: string, tokenId: string): Promise<PendingTransaction>
  proxyLockBorrowWithdraw(proxyAddr: string, loanId: string, amount: string, usr: string): Promise<PendingTransaction>
  proxyRepay(proxyAddress: string, loanId: string, amount: string): Promise<PendingTransaction>
  proxyRepayUnlockClose(
    proxyAddr: string,
    tokenId: string,
    loanId: string,
    registry: string
  ): Promise<PendingTransaction>
  proxyLock(proxyAddr: string, loanId: string): Promise<PendingTransaction>
  proxyBorrowWithdraw(proxyAddr: string, loanId: string, amount: string, usr: string): Promise<PendingTransaction>
}

export default ProxyActions
