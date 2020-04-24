import { Constructor, TinlakeParams } from '../Tinlake';
import { executeAndRetry, waitAndReturnEvents } from '../services/ethereum';

export function LenderActions<ActionBase extends Constructor<TinlakeParams>>(Base: ActionBase) {
  return class extends Base implements ILenderActions {

    // senior tranch functions
    supplySenior = async (currencyAmount: string) => {
      const txHash = await executeAndRetry(this.contracts['SENIOR_OPERATOR'].supply, [currencyAmount, this.ethConfig]);
      console.log(`[Supply] txHash: ${txHash}`);
      return waitAndReturnEvents(this.eth, txHash, this.contracts['SENIOR_OPERATOR'].abi, this.transactionTimeout);
    }

    redeemSenior = async (tokenAmount: string) => {
      const txHash = await executeAndRetry(this.contracts['SENIOR_OPERATOR'].redeem, [tokenAmount, this.ethConfig]);
      console.log(`[Redeem] txHash: ${txHash}`);
      return waitAndReturnEvents(this.eth, txHash, this.contracts['SENIOR_OPERATOR'].abi, this.transactionTimeout);
    }

    approveSeniorToken = async (tokenAmount: string) => {
      const txHash = await executeAndRetry(this.contracts['SENIOR_TOKEN'].approve, [this.contractAddresses['SENIOR'], tokenAmount, this.ethConfig]);
      console.log(`[Currency.approve] txHash: ${txHash}`);
      return waitAndReturnEvents(this.eth, txHash, this.contracts['SENIOR_TOKEN'].abi, this.transactionTimeout);
    }

    // junior tranche functions
    supplyJunior = async (currencyAmount: string) => {
      const txHash = await executeAndRetry(this.contracts['JUNIOR_OPERATOR'].supply, [currencyAmount, this.ethConfig]);
      console.log(`[Supply] txHash: ${txHash}`);
      return waitAndReturnEvents(this.eth, txHash, this.contracts['JUNIOR_OPERATOR'].abi, this.transactionTimeout);
    }

    redeemJunior = async (tokenAmount: string) => {
      const txHash = await executeAndRetry(this.contracts['JUNIOR_OPERATOR'].redeem, [tokenAmount, this.ethConfig]);
      console.log(`[Redeem] txHash: ${txHash}`);
      return waitAndReturnEvents(this.eth, txHash, this.contracts['JUNIOR_OPERATOR'].abi, this.transactionTimeout);
    }

    approveJuniorToken = async (tokenAmount: string) => {
      const txHash = await executeAndRetry(this.contracts['JUNIOR_TOKEN'].approve, [this.contractAddresses['JUNIOR'], tokenAmount, this.ethConfig]);
      console.log(`[Currency.approve] txHash: ${txHash}`);
      return waitAndReturnEvents(this.eth, txHash, this.contracts['JUNIOR_TOKEN'].abi, this.transactionTimeout);
    }

    // general lender functions
    balance = async () => {
      const txHash = await executeAndRetry(this.contracts['DISTRIBUTOR'].balance, [this.ethConfig]);
      console.log(`[Balance] txHash: ${txHash}`);
      return waitAndReturnEvents(this.eth, txHash, this.contracts['DISTRIBUTOR'].abi, this.transactionTimeout);
    }
  };
}

export type ILenderActions = {
  supplyJunior(currencyAmount: string): Promise<any>,
  redeemJunior(tokenAmount: string): Promise<any>,
  supplySenior(currencyAmount: string): Promise<any>,
  redeemSenior(tokenAmount: string): Promise<any>,
  balance(): Promise<any>,
};

export default LenderActions;
