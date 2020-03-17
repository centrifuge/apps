import { Constructor, Tinlake  } from '../types';
import { waitAndReturnEvents, executeAndRetry } from '../ethereum';
import BN from 'bn.js';

function BorrowerActions<ActionsBase extends Constructor<Tinlake>>(Base: ActionsBase) {
  return class extends Base implements IBorrowerActions {

    issue = async (registry: string, tokenId: string) => {
      const txHash = await executeAndRetry(this.contracts['SHELF'].issue, [registry, tokenId, this.ethConfig]);
      console.log(`[Mint NFT] txHash: ${txHash}`);
      return waitAndReturnEvents(this.eth, txHash, this.contracts['SHELF'].abi, this.transactionTimeout);
    }

    lock = async (loan: string) => {
      const txHash = await executeAndRetry(this.contracts['SHELF'].lock, [loan, this.ethConfig]);
      console.log(`[Collateral NFT lock] txHash: ${txHash}`);
      return waitAndReturnEvents(this.eth, txHash, this.contracts['SHELF'].abi, this.transactionTimeout);
    }

    unlock = async (loan: string) => {
      const txHash = await executeAndRetry(this.contracts['SHELF'].unlock, [loan, this.ethConfig]);
      console.log(`[Collateral NFT unlock] txHash: ${txHash}`);
      return waitAndReturnEvents(this.eth, txHash, this.contracts['SHELF'].abi, this.transactionTimeout);
    }

    close = async (loan: string) => {
      const txHash = await executeAndRetry(this.contracts['SHELF'].close, [loan, this.ethConfig]);
      console.log(`[Loan close] txHash: ${txHash}`);
      return waitAndReturnEvents(this.eth, txHash, this.contracts['SHELF'].abi, this.transactionTimeout);
    }

    borrow = async (loan: string, currencyAmount: string) => {
      const txHash = await executeAndRetry(this.contracts['SHELF'].borrow, [loan, currencyAmount, this.ethConfig]);
      console.log(`[Borrow] txHash: ${txHash}`);
      return waitAndReturnEvents(this.eth, txHash, this.contracts['SHELF'].abi, this.transactionTimeout);
    }

    withdraw = async (loan: string, currencyAmount: string, usr: string) => {
      const txHash = await executeAndRetry(this.contracts['SHELF'].withdraw, [loan, currencyAmount, usr, this.ethConfig]);
      console.log(`[Withdraw] txHash: ${txHash}`);
      return waitAndReturnEvents(this.eth, txHash, this.contracts['SHELF'].abi, this.transactionTimeout);
    }

    repay = async (loan: string, currencyAmount: string) => {
      const txHash = await executeAndRetry(this.contracts['SHELF'].repay, [loan, currencyAmount, this.ethConfig]);
      console.log(`[Repay] txHash: ${txHash}`);
      return waitAndReturnEvents(this.eth, txHash, this.contracts['SHELF'].abi, this.transactionTimeout);
    }
  };
}

export type IBorrowerActions = {
  issue(registry: string, tokenId: string): Promise<any>,
  lock(loan: string): Promise<any>,
  unlock(loan: string): Promise<any>,
  close(loan: string): Promise<any>,
  borrow(loan: string, currencyAmount: string): Promise<any>,
  withdraw(loan: string, currencyAmount: string, usr: string) : Promise<any>,
  repay(loan: string, currencyAmount: string): Promise<any>,
}

export default BorrowerActions;
