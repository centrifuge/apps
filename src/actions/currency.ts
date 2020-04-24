import { Constructor, TinlakeParams } from '../Tinlake';
import { executeAndRetry, waitAndReturnEvents } from '../services/ethereum';
import BN from 'bn.js';

export function CurrencyActions<ActionsBase extends Constructor<TinlakeParams>>(Base: ActionsBase) {
  return class extends Base implements ICurrencyActions {

    // move out for tests only
    mintCurrency = async (usr: string, amount: string) => {
      const txHash = await executeAndRetry(this.contracts['TINLAKE_CURRENCY'].mint, [usr, amount, this.ethConfig]);
      console.log(`[Mint currency] txHash: ${txHash}`);
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
  mintCurrency(usr: string, amount: string): void,
  getCurrencyBalance(usr: string): Promise<BN>,
  approveCurrency(usr: string, amount: string): Promise<any>,
};

export default CurrencyActions;
