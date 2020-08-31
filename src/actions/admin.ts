import { ContractName, Constructor, TinlakeParams, PendingTransaction } from '../Tinlake'
import { ZERO_ADDRESS } from '../services/ethereum'
import BN from 'bn.js'
const web3 = require('web3-utils')

export function AdminActions<ActionsBase extends Constructor<TinlakeParams>>(Base: ActionsBase) {
  return class extends Base implements IAdminActions {
    canQueryPermissions = () => {
      return (
        !!this.contract('PILE')?.wards &&
        !!this.contract('SENIOR')?.wards &&
        !!this.contract('PRICE_POOL')?.wards &&
        !!this.contract('ASSESSOR')?.wards &&
        !!this.contract('JUNIOR_OPERATOR')?.wards &&
        !!this.contract('SENIOR_OPERATOR')?.wards &&
        !!this.contract('COLLECTOR')?.wards
      )
    }

    isWard = async (user: string, contractName: ContractName) => {
      if (!this.contract(contractName)?.wards) return new BN(0)
      return (await this.contract(contractName).wards(user)).toBN()
    }

    canSetInterestRate = async (user: string) => {
      if (!this.contract('PILE')?.wards) return false
      return (await this.contract('PILE').wards(user)).toBN().toNumber() === 1
    }

    canSetSeniorTrancheInterest = async (user: string) => {
      if (!(this.contractAddresses['SENIOR'] !== ZERO_ADDRESS)) return false
      if (!this.contract('SENIOR')?.wards) return false
      return (await this.contract('SENIOR').wards(user)).toBN().toNumber() === 1
    }

    canSetRiskScore = async (user: string) => {
      if (!this.contract('PRICE_POOL')?.wards) return false
      return (await this.contract('PRICE_POOL').wards(user)).toBN().toNumber() === 1
    }

    // lender permissions (note: allowance operator for default deployment)
    canSetMinimumJuniorRatio = async (user: string) => {
      if (!this.contract('ASSESSOR')?.wards) return false
      return (await this.contract('ASSESSOR').wards(user)).toBN().toNumber() === 1
    }

    canSetInvestorAllowanceJunior = async (user: string) => {
      if (!this.contract('JUNIOR_OPERATOR')?.wards) return false
      return (await this.contract('JUNIOR_OPERATOR').wards(user)).toBN().toNumber() === 1
    }

    canSetInvestorAllowanceSenior = async (user: string) => {
      if (!this.contract('SENIOR_OPERATOR')?.wards) return false
      if (!(this.contractAddresses['SENIOR_OPERATOR'] !== ZERO_ADDRESS)) return false
      return (await this.contract('SENIOR_OPERATOR').wards(user)).toBN().toNumber() === 1
    }

    canSetLoanPrice = async (user: string) => {
      if (!this.contract('COLLECTOR')?.wards) return false
      return (await this.contract('COLLECTOR').wards(user)).toBN().toNumber() === 1
    }

    // ------------ admin functions borrower-site -------------
    existsRateGroup = async (ratePerSecond: string) => {
      const rateGroup = getRateGroup(ratePerSecond)
      const actualRate = (await this.contract('PILE').rates(rateGroup)).toBN()
      return !actualRate.isZero()
    }

    initRate = async (ratePerSecond: string) => {
      const rateGroup = getRateGroup(ratePerSecond)
      // Source: https://github.com/ethereum/web3.js/issues/2256#issuecomment-462730550
      return this.pending(this.contract('PILE').file(web3.fromAscii('rate').padEnd(66, '0'), rateGroup, ratePerSecond))
    }

    changeRate = async (loan: string, ratePerSecond: string) => {
      const rateGroup = getRateGroup(ratePerSecond)
      return this.pending(this.contract('PILE').changeRate(loan, rateGroup))
    }

    setRate = async (loan: string, ratePerSecond: string) => {
      const rateGroup = getRateGroup(ratePerSecond)
      return this.pending(this.contract('PILE').setRatet(loan, rateGroup))
    }

    // ------------ admin functions lender-site -------------
    setMinimumJuniorRatio = async (ratio: string) => {
      // Source: https://github.com/ethereum/web3.js/issues/2256#issuecomment-462730550
      return this.pending(this.contract('ASSESSOR').file(web3.fromAscii('minJuniorRatio').padEnd(66, '0'), ratio))
    }

    approveAllowanceJunior = async (user: string, maxCurrency: string, maxToken: string) => {
      return this.pending(this.contract('JUNIOR_OPERATOR').approve(user, maxCurrency, maxToken))
    }

    approveAllowanceSenior = async (user: string, maxCurrency: string, maxToken: string) => {
      if (this.getOperatorType('senior') === 'PROPORTIONAL_OPERATOR') {
        return this.pending(this.contract('SENIOR_OPERATOR').approve(user, maxCurrency))
      } 
        return this.pending(this.contract('SENIOR_OPERATOR').approve(user, maxCurrency, maxToken))
      
      
    }
  }
}

const ONE: string = '1000000000000000000000000000'
function getRateGroup(ratePerSecond: string) {
  return ratePerSecond === ONE ? 0 : ratePerSecond
}

export type IAdminActions = {
  isWard(user: string, contractName: ContractName): Promise<BN>
  canSetInterestRate(user: string): Promise<boolean>
  canSetSeniorTrancheInterest(user: string): Promise<boolean>
  canSetMinimumJuniorRatio(user: string): Promise<boolean>
  canSetRiskScore(user: string): Promise<boolean>
  canSetInvestorAllowanceJunior(user: string): Promise<boolean>
  canSetInvestorAllowanceSenior(user: string): Promise<boolean>
  canSetLoanPrice(user: string): Promise<boolean>
  initRate(rate: string): Promise<PendingTransaction>
  setRate(loan: string, rate: string): Promise<PendingTransaction>
  setMinimumJuniorRatio(amount: string): Promise<PendingTransaction>
  approveAllowanceJunior(user: string, maxCurrency: string, maxToken: string): Promise<PendingTransaction>
  approveAllowanceSenior(user: string, maxCurrency: string, maxToken: string): Promise<PendingTransaction>
}

export default AdminActions
