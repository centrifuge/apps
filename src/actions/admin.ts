import { Constructor, Tinlake, ContractNames } from '../types';
import { waitAndReturnEvents, executeAndRetry } from '../ethereum';
import BN from 'bn.js';

function AdminActions<ActionsBase extends Constructor<Tinlake>>(Base: ActionsBase) {
  return class extends Base implements IAdminActions {

    isWard = async (user: string, contractName: ContractNames) => {
      const res : { 0: BN } = await executeAndRetry(this.contracts[contractName].wards, [user]);
      return res[0];
    }

    // loan admin permissions
    canSetCeiling = async (user: string) => {
      const res : { 0: BN } = await executeAndRetry(this.contracts['CEILING'].wards, [user]);
      return res[0].toNumber() === 1;
    }

    canSetInterestRate = async (user: string) => {
      const res : { 0: BN } = await executeAndRetry(this.contracts['PILE'].wards, [user]);
      return res[0].toNumber() === 1;
    }

    // tranche admin permissions
    canSetJuniorTrancheInterest = async (user: string) => {
      const res : { 0: BN } = await executeAndRetry(this.contracts['JUNIOR'].wards, [user]);
      return res[0].toNumber() === 1;
    }

    canSetSeniorTrancheInterest = async (user: string) => {
      const res : { 0: BN } = await executeAndRetry(this.contracts['SENIOR'].wards, [user]);
      return res[0].toNumber() === 1;
    }

    canSetEquityRatio = async (user: string) => {
      const res : { 0: BN } = await executeAndRetry(this.contracts['ASSESSOR'].wards, [user]);
      return res[0].toNumber() === 1;
    }

    canSetRiskScore = async (user: string) => {
      const res : { 0: BN } = await executeAndRetry(this.contracts['PRICE_POOL'].wards, [user]);
      return res[0].toNumber() === 1;
    }

    // lender permissions (note: allowance operator for default deployment)
    canSetInvestorAllowanceJunior = async (user: string) => {
      const res : { 0: BN } = await executeAndRetry(this.contracts['JUNIOR_OPERATOR'].wards, [user]);
      return res[0].toNumber() === 1;
    }

    // collector permissions
    canSetThreshold = async (user: string) => {
      const res : { 0: BN } = await executeAndRetry(this.contracts['THRESHOLD'].wards, [user]);
      return res[0].toNumber() === 1;
    }

    canSetLoanPrice = async (user: string) => {
      const res : { 0: BN } = await executeAndRetry(this.contracts['COLLECTOR'].wards, [user]);
      return res[0].toNumber() === 1;
    }

    // ------------ admin functions borrower-site -------------
    setCeiling = async (loanId: string, amount: string) => {
      const txHash = await executeAndRetry(this.contracts['CEILING'].file, [loanId, amount, this.ethConfig]);
      console.log(`[Ceiling file] txHash: ${txHash}`);
      return waitAndReturnEvents(this.eth, txHash, this.contracts['CEILING'].abi, this.transactionTimeout);
    }

    existsRateGroup = async (ratePerSecond: string) => {
      const rateGroup = getRateGroup(ratePerSecond);
      const res: { ratePerSecond: BN } = await executeAndRetry(this.contracts['PILE'].rates, [rateGroup]);
      return !res.ratePerSecond.isZero();
    }

    initRate = async (ratePerSecond: string) => {
      const rateGroup = getRateGroup(ratePerSecond);
      const txHash = await executeAndRetry(this.contracts['PILE'].file, [rateGroup, ratePerSecond, this.ethConfig]);
      console.log(`[Initialising rate] txHash: ${txHash}`);
      return waitAndReturnEvents(this.eth, txHash, this.contracts['PILE'].abi, this.transactionTimeout);
    }

    changeRate = async (loan: string, ratePerSecond: string) => {
      const rateGroup = getRateGroup(ratePerSecond);
      const txHash = await executeAndRetry(this.contracts['PILE'].changeRate, [loan, rateGroup, this.ethConfig]);
      console.log(`[Initialising rate] txHash: ${txHash}`);
      return waitAndReturnEvents(this.eth, txHash, this.contracts['PILE'].abi, this.transactionTimeout);
    }

    setRate = async (loan: string, ratePerSecond: string) => {
      const rateGroup = getRateGroup(ratePerSecond);
      const txHash = await executeAndRetry(this.contracts['PILE'].setRate, [loan, rateGroup, this.ethConfig]);
      console.log(`[Setting rate] txHash: ${txHash}`);
      return waitAndReturnEvents(this.eth, txHash, this.contracts['PILE'].abi, this.transactionTimeout);
    }

    // ------------ admin functions lender-site -------------
    approveAllowanceJunior = async (user: string, maxCurrency: string, maxToken: string) => {
      const txHash = await executeAndRetry(this.contracts['JUNIOR_OPERATOR'].approve, [user, maxCurrency, maxToken, this.ethConfig]);
      console.log(`[Approve allowance] txHash: ${txHash}`);
      return waitAndReturnEvents(this.eth, txHash, this.contracts['JUNIOR_OPERATOR'].abi, this.transactionTimeout);
    }
  };
}

const ONE : string = '1000000000000000000000000000';
function getRateGroup(ratePerSecond: string) {
  return (ratePerSecond === ONE) ? 0 : ratePerSecond;
}
 
export type IAdminActions = {
  isWard(user: string, contractName: ContractNames): Promise<BN>,
  canSetCeiling(user: string): Promise<boolean>,
  canSetInterestRate(user: string): Promise<boolean>,
  canSetJuniorTrancheInterest(user: string): Promise<boolean>,
  canSetSeniorTrancheInterest(user: string): Promise<boolean>,
  canSetEquityRatio(user: string): Promise<boolean>,
  canSetRiskScore(user: string): Promise<boolean>,
  canSetInvestorAllowanceJunior(user: string): Promise<boolean>,
  canSetThreshold(user: string): Promise<boolean>,
  canSetLoanPrice(user: string): Promise<boolean>,
  setCeiling(loanId: string, amount: string): Promise<any>,
  initRate(rate: string, speed: string): Promise<any>,
  setRate(loan: string, rate: string): Promise<any>,
  approveAllowanceJunior(user: string, maxCurrency: string, maxToken: string): Promise<any>,
};

export default AdminActions;
