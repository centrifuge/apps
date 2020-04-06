import { Constructor, Tinlake  } from '../types';
import { executeAndRetry, waitAndReturnEvents } from '../ethereum';
import BN from 'bn.js';

export function CurrencyActions<ActionsBase extends Constructor<Tinlake>>(Base: ActionsBase) {
  return class extends Base implements ICurrencyActions {

    mintCurrency = async (usr: string, amount: string) => {
      const txHash = await executeAndRetry(this.contracts['TINLAKE_CURRENCY'].mint, [usr, amount, this.ethConfig]);
      console.log(`[Mint currency] txHash: ${txHash}`);
    }

    getCurrencyBalance = async (user: string) => {
      const res : { 0: BN } = await executeAndRetry(this.contracts['TINLAKE_CURRENCY'].balanceOf, [user]);
      return res[0]; 
    }

    getJuniorBalance = async () => {
      const res : { 0: BN } = await executeAndRetry(this.contracts['TINLAKE_CURRENCY'].balanceOf, [this.contractAddresses['JUNIOR']]);
      return res[0] || new BN(0); 
    }

    getSeniorBalance = async () => {
      const res : { 0: BN } = await executeAndRetry(this.contracts['TINLAKE_CURRENCY'].balanceOf, [this.contractAddresses['SENIOR']]);
      return res[0] || new BN(0); 
    }

    getTrancheBalance = async () => {
      const seniorExists = this.contractAddresses["SENIOR_OPERATOR"] !== "0x0000000000000000000000000000000000000000";
      const juniorFunds = await this.getJuniorBalance();
      const seniorFunds = seniorExists && await this.getSeniorBalance() || new BN (0);
      const trancheFunds = juniorFunds.add(seniorFunds);
      return trancheFunds;
    }

    approveCurrency = async (usr: string, currencyAmount: string) => {
      const txHash = await executeAndRetry(this.contracts['TINLAKE_CURRENCY'].approve, [usr, currencyAmount, this.ethConfig])
      console.log(`[Currency.approve] txHash: ${txHash}`);
      return waitAndReturnEvents(this.eth, txHash, this.contracts['TINLAKE_CURRENCY'].abi, this.transactionTimeout);
    }
  }
}

export type ICurrencyActions = {
  mintCurrency(usr: string, amount: string): void,
  getCurrencyBalance(usr: string): Promise<BN>,
  approveCurrency(usr: string, amount: string): Promise<any>,
  getJuniorBalance(): Promise<BN>,
  getSeniorBalance(): Promise<BN>,
  getTrancheBalance() :Promise<BN>
}

export default CurrencyActions;
