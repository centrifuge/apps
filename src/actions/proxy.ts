import { Constructor, TinlakeParams } from '../Tinlake';
import { waitAndReturnEvents, executeAndRetry } from '../services/ethereum';
const abiCoder = require('web3-eth-abi');
import BN from 'bn.js';
import { ethers } from 'ethers';

export function ProxyActions<ActionsBase extends Constructor<TinlakeParams>>(Base: ActionsBase) {

  return class extends Base implements IProxyActions {

    getProxyAccessTokenOwner = async (tokenId: string): Promise<BN> => {
      const res : { 0: BN } = await executeAndRetry(this.contracts['PROXY_REGISTRY'].ownerOf, [tokenId]);
      return res[0];
    }

    buildProxy = async (owner: string) => {
      const txHash = await executeAndRetry(this.contracts['PROXY_REGISTRY'].build, [owner, this.ethConfig]);
      console.log(`[Proxy created] txHash: ${txHash}`);
      const response: any = await waitAndReturnEvents(this.eth, txHash, this.contracts['PROXY_REGISTRY'].abi, this.transactionTimeout);
      return response.events[0].data[2].toString();
    }

    getProxy = async (accessTokenId: string) => {
      const res = await executeAndRetry(this.contracts['PROXY_REGISTRY'].proxies,  [accessTokenId, this.ethConfig]);
      return res[0];
    }

    getProxyAccessToken = async (proxyAddr: string) => {
      const proxy: any = this.eth.contract(this.contractAbis['PROXY']).at(proxyAddr);
      const res = await executeAndRetry(proxy.accessToken, []);
      return res[0].toNumber();
    }

    getProxyOwnerByLoan = async (loanId: string) => {
      const res = await executeAndRetry(this.contracts['TITLE'].ownerOf, [loanId]);
      const loanOwner = res[0];
      const accessToken = await this.getProxyAccessToken(loanOwner);
      return this.getProxyAccessTokenOwner(accessToken);
    }

    proxyCount = async (): Promise<BN> => {
      const res: { 0: BN }  = await executeAndRetry(this.contracts['PROXY_REGISTRY'].count, []);
      return res[0];
    }

    checkProxyExists = async (address: string) : Promise<string | null> => {
      const count = (await this.proxyCount()).toNumber();
      for (let i = 1; i < count; i += 1) {
        const accessToken = i.toString();
        const ownerBN = await this.getProxyAccessTokenOwner(accessToken);
        if (ownerBN && ethers.utils.getAddress(ownerBN.toString()) === ethers.utils.getAddress(address)) {
          return await this.getProxy(accessToken);
        }
      }
      return null;
    }

    proxyCreateNew = async (address: string) => {
      const accessToken = await this.buildProxy(address);
      return this.getProxy(accessToken);
    }

    proxyTransferIssue = async (proxyAddr: string, nftRegistryAddr: string, tokenId: string)  => {
      const proxy: any = this.eth.contract(this.contractAbis['PROXY']).at(proxyAddr);

      const encoded = abiCoder.encodeFunctionCall({
        name: 'transferIssue',
        type :'function',
        inputs: [
          { type: 'address', name: 'shelf' },
          { type: 'address', name: 'registry' },
          { type: 'uint256', name: 'token' }]},   [this.contracts['SHELF'].address, nftRegistryAddr, tokenId],
      );

      const txHash = await executeAndRetry(proxy.execute, [this.contracts['ACTIONS'].address, encoded, this.ethConfig]);
      console.log(`[Proxy Transfer Issue Loan] txHash: ${txHash}`);
      return waitAndReturnEvents(this.eth, txHash, this.contractAbis['PROXY'], this.transactionTimeout);
    }

    proxyLockBorrowWithdraw = async (proxyAddr: string, loanId: string, amount: string, usr: string) => {
      const proxy: any = this.eth.contract(this.contractAbis['PROXY']).at(proxyAddr);
      const encoded = abiCoder.encodeFunctionCall({
        name: 'lockBorrowWithdraw',
        type :'function',
        inputs: [
                                                      { type: 'address', name: 'shelf' },
                                                      { type: 'uint256', name: 'loan' },
                                                      { type: 'uint256', name: 'amount' },
                                                      { type: 'address', name: 'usr' }]},
                                                  [this.contracts['SHELF'].address, loanId, amount, usr],
      );
      const txHash = await executeAndRetry(proxy.execute, [this.contracts['ACTIONS'].address, encoded, this.ethConfig]);
      console.log(`[Proxy Lock Borrow Withdraw] txHash: ${txHash}`);
      return waitAndReturnEvents(this.eth, txHash, this.contractAbis['PROXY'], this.transactionTimeout);
    }

    proxyRepayUnlockClose = async (proxyAddr: string, tokenId: string, loanId: string, registry: string) => {
      const proxy: any = this.eth.contract(this.contractAbis['PROXY']).at(proxyAddr);
      const encoded = abiCoder.encodeFunctionCall({
        name: 'repayUnlockClose',
        type :'function',
        inputs: [
                                                      { type: 'address', name: 'shelf' },
                                                      { type: 'address', name: 'pile' },
                                                      { type: 'address', name: 'registry' },
                                                      { type: 'uint256', name: 'token' },
                                                      { type: 'address', name: 'erc20' },
                                                      { type: 'uint256', name: 'loan' }]},
                                                  [this.contracts['SHELF'].address, this.contracts['PILE'].address, registry, tokenId, this.contracts['TINLAKE_CURRENCY'].address, loanId],
      );
      const txHash = await executeAndRetry(proxy.execute, [this.contracts['ACTIONS'].address, encoded, this.ethConfig]);
      console.log(`[Proxy Repay Unlock Close] txHash: ${txHash}`);
      return waitAndReturnEvents(this.eth, txHash, this.contractAbis['PROXY'], this.transactionTimeout);
    }
  };
}

export type IProxyActions = {
  buildProxy(owner: string): Promise<any>,
  checkProxyExists(address: string): Promise<string | null>,
  getProxy(accessTokenId: string): Promise<any>,
  proxyCount(): Promise<any>,
  getProxyAccessToken(proxyAddr: string): Promise<any>,
  getProxyAccessTokenOwner(tokenId: string): Promise<any>,
  getProxyOwnerByLoan(loanId: string): Promise<any>,
  proxyCreateNew(address: string): Promise<any>,
  proxyTransferIssue(proxyAddr:string, nftRegistryAddr: string, tokenId: string): Promise<any>,
  proxyLockBorrowWithdraw(proxyAddr:string, loanId: string, amount: string, usr: string): Promise<any>,
  proxyRepayUnlockClose(proxyAddr: string, tokenId: string, loanId: string, registry: string): Promise<any>,
};

export default ProxyActions;
