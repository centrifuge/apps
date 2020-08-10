import { Constructor, TinlakeParams } from '../Tinlake';
import { executeAndRetry, waitAndReturnEvents } from '../services/ethereum';
import BN from 'bn.js';

export function CurrencyActions<ActionsBase extends Constructor<TinlakeParams>>(Base: ActionsBase) {
  return class extends Base implements ICurrencyActions {

    // move out for tests only
    mintCurrency = async (usr: string, amount: string) => {
      const txHash = await executeAndRetry(this.contracts['TINLAKE_CURRENCY'].mint, [usr, amount, this.ethConfig]);
      console.log(`[Mint currency] txHash: ${txHash}`);
      return waitAndReturnEvents(this.eth, txHash, this.contracts['TINLAKE_CURRENCY'].abi, this.transactionTimeout);
    }

    getCurrencyAllowance = async (owner: string, spender: string) => {
      const res : { 0: BN } = await executeAndRetry(this.contracts['TINLAKE_CURRENCY'].allowance, [owner, spender]);
      return res[0] || new BN(0);
    }

    getJuniorForCurrencyAllowance = async (owner: string) => {
      if (!this.contractAddresses['JUNIOR']) return;
      return this.getCurrencyAllowance(owner, this.contractAddresses['JUNIOR']);
    }

    getSeniorForCurrencyAllowance = async (owner: string) => {
      if (!this.contractAddresses['SENIOR']) return;
      return this.getCurrencyAllowance(owner, this.contractAddresses['SENIOR']);
    }

    getCurrencyBalance = async (user: string) => {
      const res : { 0: BN } = await executeAndRetry(this.contracts['TINLAKE_CURRENCY'].balanceOf, [user]);
      return res[0] || new BN(0);
    }

    approveCurrency = async (usr: string, currencyAmount: string) => {
      const txHash = await executeAndRetry(this.contracts['TINLAKE_CURRENCY'].approve, [usr, currencyAmount, this.ethConfig]);
      console.log(`[Currency.approve] txHash: ${txHash}`);
      return waitAndReturnEvents(this.eth, txHash, this.contracts['TINLAKE_CURRENCY'].abi, this.transactionTimeout);
    }

    approveSeniorForCurrency = async (currencyAmount: string) => {
      if (!this.contractAddresses['SENIOR']) return;
      return this.approveCurrency(this.contractAddresses['SENIOR'], currencyAmount);
    }

    approveJuniorForCurrency = async (currencyAmount: string) => {
      if (!this.contractAddresses['JUNIOR']) return;
      return this.approveCurrency(this.contractAddresses['JUNIOR'], currencyAmount);
    }
  };
}

export type  ICurrencyActions = {
  mintCurrency(usr: string, amount: string): Promise<unknown>,
  getCurrencyBalance(usr: string): Promise<BN>,
  approveCurrency(usr: string, amount: string): Promise<unknown>,
  getCurrencyAllowance: (owner: string, spender: string) => Promise<BN>;
  getJuniorForCurrencyAllowance: (owner: string) => Promise<BN | undefined>;
  getSeniorForCurrencyAllowance: (owner: string) => Promise<BN | undefined>;
  approveSeniorForCurrency: (currencyAmount: string) => Promise<unknown>;
  approveJuniorForCurrency: (currencyAmount: string) => Promise<unknown>;
};

export default CurrencyActions;
