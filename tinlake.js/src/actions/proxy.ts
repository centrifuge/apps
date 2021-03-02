import BN from 'bn.js'
import { ethers } from 'ethers'
import { Constructor, PendingTransaction, TinlakeParams } from '../Tinlake'

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
      const accessToken = parsedLog.args['3'].toNumber()

      return accessToken
    }

    getProxy = async (accessTokenId: string) => {
      return await this.contract('PROXY_REGISTRY').proxies(accessTokenId)
    }

    getProxyAccessToken = async (proxyAddress: string) => {
      const proxy = this.contract('PROXY', proxyAddress)
      const accessToken = await this.toBN(proxy.accessToken())
      return accessToken.toNumber()
    }

    getProxyOwnerByLoan = async (loanId: string) => {
      const loanOwner = this.contract('TITLE').ownerOf(loanId)
      const accessToken = await this.getProxyAccessToken(loanOwner)
      return this.getProxyAccessTokenOwner(accessToken.toString())
    }

    getProxyOwnerByAddress = async (proxyAddress: string) => {
      const accessToken = await this.getProxyAccessToken(proxyAddress)
      return this.getProxyAccessTokenOwner(accessToken.toString())
    }

    proxyCount = async (): Promise<BN> => {
      return await this.toBN(this.contract('PROXY_REGISTRY').count())
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
      const encoded = this.contract('ACTIONS').interface.encodeFunctionData('issue', [
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
      const encoded = this.contract('ACTIONS').interface.encodeFunctionData('transferIssue', [
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
      const encoded = this.contract('ACTIONS').interface.encodeFunctionData('lockBorrowWithdraw', [
        this.contract('SHELF').address,
        loanId,
        amount,
        usr,
      ])

      return this.pending(
        proxy.execute(this.contract('ACTIONS').address, encoded, { ...this.overrides, gasLimit: 1000000 })
      )
    }

    proxyLock = async (proxyAddress: string, loanId: string) => {
      const proxy = this.contract('PROXY', proxyAddress)
      const encoded = this.contract('ACTIONS').interface.encodeFunctionData('lock', [
        this.contract('SHELF').address,
        loanId,
      ])

      return this.pending(proxy.execute(this.contract('ACTIONS').address, encoded, this.overrides))
    }

    proxyBorrowWithdraw = async (proxyAddress: string, loanId: string, amount: string, usr: string) => {
      const proxy = this.contract('PROXY', proxyAddress)
      const encoded = this.contract('ACTIONS').interface.encodeFunctionData('borrowWithdraw', [
        this.contract('SHELF').address,
        loanId,
        amount,
        usr,
      ])

      return this.pending(proxy.execute(this.contract('ACTIONS').address, encoded, this.overrides))
    }

    proxyRepay = async (proxyAddress: string, loanId: string, amount: string) => {
      const proxy = this.contract('PROXY', proxyAddress)
      const encoded = this.contract('ACTIONS').interface.encodeFunctionData('repay', [
        this.contract('SHELF').address,
        this.contract('TINLAKE_CURRENCY').address,
        loanId,
        amount,
      ])

      return this.pending(
        proxy.execute(this.contract('ACTIONS').address, encoded, { ...this.overrides, gasLimit: 550000 })
      )
    }

    proxyClose = async (proxyAddress: string, loanId: string) => {
      const proxy = this.contract('PROXY', proxyAddress)
      const encoded = this.contract('ACTIONS').interface.encodeFunctionData('close', [
        this.contract('SHELF').address,
        loanId,
      ])

      return this.pending(
        proxy.execute(this.contract('ACTIONS').address, encoded, { ...this.overrides, gasLimit: 550000 })
      )
    }

    proxyRepayUnlockClose = async (proxyAddress: string, tokenId: string, loanId: string, registry: string) => {
      const proxy = this.contract('PROXY', proxyAddress)
      const encoded = this.contract('ACTIONS').interface.encodeFunctionData('repayUnlockClose', [
        this.contract('SHELF').address,
        this.contract('PILE').address,
        registry,
        tokenId,
        this.contract('TINLAKE_CURRENCY').address,
        loanId,
      ])

      return this.pending(
        proxy.execute(this.contract('ACTIONS').address, encoded, { ...this.overrides, gasLimit: 550000 })
      )
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
  proxyClose(proxyAddress: string, loanId: string): Promise<PendingTransaction>
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
