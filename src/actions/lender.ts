import { Constructor, Investor, Tinlake, Contracts, EthConfig } from '../types';
import { executeAndRetry, waitAndReturnEvents } from '../ethereum';
import BN from 'bn.js';

export function LenderActions<ActionBase extends Constructor<Tinlake>>(Base: ActionBase) {
  return class extends Base implements ILenderActions {
    contracts: Contracts;
    ethConfig: EthConfig;

    getInvestor = async (user: string) : Promise<Investor> => {
      const includeSenior = this.existsSenior();
      const tokenBalanceJunior = await this.getJuniorTokenBalance(user);
      const tokenBalanceSenior = includeSenior && await this.getSeniorTokenBalance(user) || null;
      const maxSupplyJunior = await this.getMaxSupplyAmountJunior(user);
      const maxSupplySenior = includeSenior && await this.getMaxSupplyAmountJunior(user) || null;
      const maxRedeemJunior = await this.getMaxRedeemAmountJunior(user);
      const maxRedeemSenior = includeSenior && await this.getMaxRedeemAmountJunior(user) || null;

      return {
        address: user,
        tokenBalanceJunior,
        maxSupplyJunior,
        maxRedeemJunior,
        ...(tokenBalanceSenior && { tokenBalanceSenior }),
        ...(maxSupplySenior  && { maxSupplySenior }),
        ...(maxRedeemSenior  && { maxRedeemSenior }),
      };
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

    getJuniorTokenBalance = async (user: string) => {
      const res : { 0: BN } = await executeAndRetry(this.contracts['JUNIOR_TOKEN'].balanceOf, [user]);
      return res[0];
    }

    approveJuniorToken = async (usr: string, tokenAmount: string) => {
      const txHash = await executeAndRetry(this.contracts['JUNIOR_TOKEN'].approve, [usr, tokenAmount, this.ethConfig]);
      console.log(`[Currency.approve] txHash: ${txHash}`);
      return waitAndReturnEvents(this.eth, txHash, this.contracts['JUNIOR_TOKEN'].abi, this.transactionTimeout);
    }

    getMaxSupplyAmountJunior = async (user: string) => {
      const res : { 0: BN } =  await executeAndRetry(this.contracts['JUNIOR_OPERATOR'].maxCurrency, [user]);
      return res[0];
    }

    getMaxRedeemAmountJunior = async (user: string) => {
      const res  =  await executeAndRetry(this.contracts['JUNIOR_OPERATOR'].maxToken, [user]);
      return res[0];
    }

    getTokenPriceJunior = async () => {
      const res =  await executeAndRetry(this.contracts['ASSESSOR'].calcTokenPrice, [this.contractAddresses['JUNIOR']]);
      return res[0];
    }

    // senior tranche functions
    existsSenior = () => {
      return this.contractAddresses['SENIOR_OPERATOR'] !== '0x0000000000000000000000000000000000000000';
    }

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

    getSeniorTokenBalance = async (user: string) => {
      const res : { 0: BN } = await executeAndRetry(this.contracts['SENIOR_TOKEN'].balanceOf, [user]);
      return res[0];
    }

    approveSeniorToken = async (usr: string, tokenAmount: string) => {
      const txHash = await executeAndRetry(this.contracts['SENIOR_TOKEN'].approve, [usr, tokenAmount, this.ethConfig]);
      console.log(`[Currency.approve] txHash: ${txHash}`);
      return waitAndReturnEvents(this.eth, txHash, this.contracts['SENIOR_TOKEN'].abi, this.transactionTimeout);
    }

    getMaxSupplyAmountSenior = async (user: string) => {
      const res : { 0: BN } =  await executeAndRetry(this.contracts['SENIOR_OPERATOR'].maxCurrency, [user]);
      return res[0];
    }

    getMaxRedeemAmountSenior = async (user: string) => {
      const res  =  await executeAndRetry(this.contracts['SENIOR_OPERATOR'].maxToken, [user]);
      return res[0];
    }

    getTokenPriceSenior = async () => {
      const res =  await executeAndRetry(this.contracts['ASSESSOR'].calcTokenPrice, [this.contractAddresses['SENIOR']]);
      return res[0];
    }
    
    // general lender functions

    balance = async () => {
      const txHash = await executeAndRetry(this.contracts['DISTRIBUTOR'].balance, [this.ethConfig]);
      console.log(`[Balance] txHash: ${txHash}`);
      return waitAndReturnEvents(this.eth, txHash, this.contracts['DISTRIBUTOR'].abi, this.transactionTimeout);
    }

    // fix: change to view functions in contracts
    // juniorReserve = async () => {
    //   const res: { 0: BN } =  await executeAndRetry(this.contracts["JUNIOR"].balance, [this.ethConfig]);
    //   return res[0] || new BN(0);
    // }

    // seniorReserve = async () => {
    //   const res: { 0: BN } =  await executeAndRetry(this.contracts["SENIOR"].balance, []);
    //   return res[0] || new BN(0);
    // }

    // availableTrancheFunds = async () => {
    //   const juniorFunds = await this.juniorReserve();
    //   const seniorFunds = this.existsSenior() && await this.seniorReserve() || new BN (0);
    //   const trancheFunds = juniorFunds.add(seniorFunds);
    //   return trancheFunds;
    // }
  };
}

export type ILenderActions = {
  existsSenior(): boolean,
  supplyJunior(currencyAmount: string): Promise<any>,
  redeemJunior(tokenAmount: string): Promise<any>,
  supplySenior(currencyAmount: string): Promise<any>,
  redeemSenior(tokenAmount: string): Promise<any>,
  getJuniorTokenBalance(user: string): Promise<BN>,
  getSeniorTokenBalance(user: string): Promise<BN>,
  getMaxSupplyAmountJunior(user: string): Promise<BN>,
  getMaxRedeemAmountJunior(user: string): Promise<BN>,
  getMaxSupplyAmountSenior(user: string): Promise<BN>,
  getMaxRedeemAmountSenior(user: string): Promise<BN>,
  getTokenPriceJunior(): Promise<BN>,
  getTokenPriceSenior(): Promise<BN>,
  getInvestor(user:string): Promise<Investor>,
  balance(): Promise<any>,
  // juniorReserve(): Promise<BN>,
  // seniorReserve(): Promise<BN>,
  // availableTrancheFunds(): Promise<BN>
};

export default LenderActions;
