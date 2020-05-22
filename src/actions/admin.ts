import { ContractNames, Constructor, TinlakeParams } from '../Tinlake';
import { waitAndReturnEvents, executeAndRetry, ZERO_ADDRESS } from '../services/ethereum';
import BN from 'bn.js';
const web3 = require('web3-utils');

export function AdminActions<ActionsBase extends Constructor<TinlakeParams>>(Base: ActionsBase) {
  return class extends Base implements IAdminActions {

    isWard = async (user: string, contractName: ContractNames) => {
      if (!this.contracts[contractName]?.wards) { return new BN(0); }
      const res : { 0: BN } = await executeAndRetry(this.contracts[contractName].wards, [user]);
      return res[0];
    }

    canSetInterestRate = async (user: string) => {
      if (!this.contracts['PILE']?.wards) { return false }
      const res : { 0: BN } = await executeAndRetry(this.contracts['PILE'].wards, [user]);
      return res[0].toNumber() === 1;
    }

    canSetSeniorTrancheInterest = async (user: string) => {
      if (this.contractAddresses['SENIOR'] !== ZERO_ADDRESS) {
        if (!this.contracts['SENIOR']?.wards) { return false }
        const res : { 0: BN } = await executeAndRetry(this.contracts['SENIOR'].wards, [user]);
        return res[0].toNumber() === 1;
      } return false;
    }

    canSetRiskScore = async (user: string) => {
      if (!this.contracts['PRICE_POOL']?.wards) { return false }
      const res : { 0: BN } = await executeAndRetry(this.contracts['PRICE_POOL'].wards, [user]);
      return res[0].toNumber() === 1;
    }

    // lender permissions (note: allowance operator for default deployment)
    canSetMinimumJuniorRatio = async (user: string) => {
      if (!this.contracts['ASSESSOR']?.wards) { return false }
      const res : { 0: BN } = await executeAndRetry(this.contracts['ASSESSOR'].wards, [user]);
      return res[0].toNumber() === 1;
    }

    canSetInvestorAllowanceJunior = async (user: string) => {
      if (!this.contracts['JUNIOR_OPERATOR']?.wards) { return false }
      const res : { 0: BN } = await executeAndRetry(this.contracts['JUNIOR_OPERATOR'].wards, [user]);
      return res[0].toNumber() === 1;
    }

    canSetInvestorAllowanceSenior = async (user: string) => {
      if (!this.contracts['SENIOR_OPERATOR']?.wards) { return false }
      if (this.contractAddresses['SENIOR_OPERATOR'] !== ZERO_ADDRESS) {
        const res : { 0: BN } = await executeAndRetry(this.contracts['SENIOR_OPERATOR'].wards, [user]);
        return res[0].toNumber() === 1;
      }
      return false;
    }

    canSetLoanPrice = async (user: string) => {
      if (!this.contracts['COLLECTOR']?.wards) { return false }
      const res : { 0: BN } = await executeAndRetry(this.contracts['COLLECTOR'].wards, [user]);
      return res[0].toNumber() === 1;
    }

    // ------------ admin functions borrower-site -------------
    existsRateGroup = async (ratePerSecond: string) => {
      const rateGroup = getRateGroup(ratePerSecond);
      const res: { ratePerSecond: BN } = await executeAndRetry(this.contracts['PILE'].rates, [rateGroup]);
      return !res.ratePerSecond.isZero();
    }

    initRate = async (ratePerSecond: string) => {
      const rateGroup = getRateGroup(ratePerSecond);
      const txHash = await executeAndRetry(this.contracts['PILE'].file, [web3.fromAscii('rate'), rateGroup, ratePerSecond, this.ethConfig]);
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
    setMinimumJuniorRatio = async (ratio: string) => {
      const txHash = await executeAndRetry(this.contracts['ASSESSOR'].file, [web3.fromAscii('minJuniorRatio'), ratio, this.ethConfig]);
      console.log(`[Assessor file] txHash: ${txHash}`);
      return waitAndReturnEvents(this.eth, txHash, this.contracts['ASSESSOR'].abi, this.transactionTimeout);
    }

    approveAllowanceJunior = async (user: string, maxCurrency: string, maxToken: string) => {
      const txHash = await executeAndRetry(this.contracts['JUNIOR_OPERATOR'].approve, [user, maxCurrency, maxToken, this.ethConfig]);
      console.log(`[Approve allowance Junior] txHash: ${txHash}`);
      return waitAndReturnEvents(this.eth, txHash, this.contracts['JUNIOR_OPERATOR'].abi, this.transactionTimeout);
    }

    approveAllowanceSenior = async (user: string, maxCurrency: string, maxToken: string) => {
      const operatorType = this.getOperatorType('senior');
      let txHash;
      switch (operatorType) {
        case 'PROPORTIONAL_OPERATOR':
          txHash = await executeAndRetry(this.contracts['SENIOR_OPERATOR'].approve, [user, maxCurrency, this.ethConfig]);
          break;
        // ALLOWANCE_OPERATOR
        default:
          txHash = await executeAndRetry(this.contracts['SENIOR_OPERATOR'].approve, [user, maxCurrency, maxToken, this.ethConfig]);
      }
      console.log(`[Approve allowance Senior] txHash: ${txHash}`);
      return waitAndReturnEvents(this.eth, txHash, this.contracts['SENIOR_OPERATOR'].abi, this.transactionTimeout);
    }
  };
}

const ONE : string = '1000000000000000000000000000';
function getRateGroup(ratePerSecond: string) {
  return (ratePerSecond === ONE) ? 0 : ratePerSecond;
}

export type IAdminActions = {
  isWard(user: string, contractName: ContractNames): Promise<BN>,
  canSetInterestRate(user: string): Promise<boolean>,
  canSetSeniorTrancheInterest(user: string): Promise<boolean>,
  canSetMinimumJuniorRatio(user: string): Promise<boolean>,
  canSetRiskScore(user: string): Promise<boolean>,
  canSetInvestorAllowanceJunior(user: string): Promise<boolean>,
  canSetInvestorAllowanceSenior(user: string): Promise<boolean>,
  canSetLoanPrice(user: string): Promise<boolean>,
  initRate(rate: string): Promise<any>,
  setRate(loan: string, rate: string): Promise<any>,
  setMinimumJuniorRatio(amount: string): Promise<any>,
  approveAllowanceJunior(user: string, maxCurrency: string, maxToken: string): Promise<any>,
  approveAllowanceSenior(user: string, maxCurrency: string, maxToken: string): Promise<any>,
};

export default AdminActions;
