import { ContractName, Constructor, TinlakeParams, PendingTransaction } from '../Tinlake'
import { waitAndReturnEvents, executeAndRetry, ZERO_ADDRESS } from '../services/ethereum'
import BN from 'bn.js'
const web3 = require('web3-utils')

export function AdminActions<ActionsBase extends Constructor<TinlakeParams>>(Base: ActionsBase) {
  return class extends Base implements IAdminActions {
    canQueryPermissions = () => {
      return (
        !!this.contracts['PILE']?.wards &&
        !!this.contracts['SENIOR']?.wards &&
        !!this.contracts['PRICE_POOL']?.wards &&
        !!this.contracts['ASSESSOR']?.wards &&
        !!this.contracts['JUNIOR_OPERATOR']?.wards &&
        !!this.contracts['SENIOR_OPERATOR']?.wards &&
        !!this.contracts['COLLECTOR']?.wards
      )
    }

    isWard = async (user: string, contractName: ContractName) => {
      if (!this.contracts[contractName]?.wards) {
        return new BN(0)
      }
      const res: { 0: BN } = await executeAndRetry(this.contracts[contractName].wards, [user])
      return res[0]
    }

    canSetInterestRate = async (user: string) => {
      if (!this.contracts['PILE']?.wards) {
        return false
      }
      const res: { 0: BN } = await executeAndRetry(this.contracts['PILE'].wards, [user])
      return res[0].toNumber() === 1
    }

    canSetSeniorTrancheInterest = async (user: string) => {
      if (this.contractAddresses['SENIOR'] !== ZERO_ADDRESS) {
        if (!this.contracts['SENIOR']?.wards) {
          return false
        }
        const res: { 0: BN } = await executeAndRetry(this.contracts['SENIOR'].wards, [user])
        return res[0].toNumber() === 1
      }
      return false
    }

    canSetRiskScore = async (user: string) => {
      if (!this.contracts['PRICE_POOL']?.wards) {
        return false
      }
      const res: { 0: BN } = await executeAndRetry(this.contracts['PRICE_POOL'].wards, [user])
      return res[0].toNumber() === 1
    }

    // lender permissions (note: allowance operator for default deployment)
    canSetMinimumJuniorRatio = async (user: string) => {
      if (!this.contracts['ASSESSOR']?.wards) {
        return false
      }
      const res: { 0: BN } = await executeAndRetry(this.contracts['ASSESSOR'].wards, [user])
      return res[0].toNumber() === 1
    }

    canSetInvestorAllowanceJunior = async (user: string) => {
      if (!this.contracts['JUNIOR_OPERATOR']?.wards) {
        return false
      }
      const res: { 0: BN } = await executeAndRetry(this.contracts['JUNIOR_OPERATOR'].wards, [user])
      return res[0].toNumber() === 1
    }

    canSetInvestorAllowanceSenior = async (user: string) => {
      if (!this.contracts['SENIOR_OPERATOR']?.wards) {
        return false
      }
      if (this.contractAddresses['SENIOR_OPERATOR'] !== ZERO_ADDRESS) {
        const res: { 0: BN } = await executeAndRetry(this.contracts['SENIOR_OPERATOR'].wards, [user])
        return res[0].toNumber() === 1
      }
      return false
    }

    canSetLoanPrice = async (user: string) => {
      if (!this.contracts['COLLECTOR']?.wards) {
        return false
      }
      const res: { 0: BN } = await executeAndRetry(this.contracts['COLLECTOR'].wards, [user])
      return res[0].toNumber() === 1
    }

    // ------------ admin functions borrower-site -------------
    existsRateGroup = async (ratePerSecond: string) => {
      const rateGroup = getRateGroup(ratePerSecond)
      const actualRate = (await this.contract('PILE').rates(rateGroup)).toBN()
      return !actualRate.isZero()
    }

    initRate = async (ratePerSecond: string) => {
      const rateGroup = getRateGroup(ratePerSecond)
      const txHash = await executeAndRetry(this.contracts['PILE'].file, [
        web3.fromAscii('rate'),
        rateGroup,
        ratePerSecond,
        this.ethConfig,
      ])
      console.log(`[Initialising rate] txHash: ${txHash}`)
      return waitAndReturnEvents(this.eth, txHash, this.contracts['PILE'].abi, this.transactionTimeout)
    }

    changeRate = async (loan: string, ratePerSecond: string) => {
      const rateGroup = getRateGroup(ratePerSecond)
      const txHash = await executeAndRetry(this.contracts['PILE'].changeRate, [loan, rateGroup, this.ethConfig])
      console.log(`[Initialising rate] txHash: ${txHash}`)
      return waitAndReturnEvents(this.eth, txHash, this.contracts['PILE'].abi, this.transactionTimeout)
    }

    setRate = async (loan: string, ratePerSecond: string) => {
      const rateGroup = getRateGroup(ratePerSecond)
      const txHash = await executeAndRetry(this.contracts['PILE'].setRate, [loan, rateGroup, this.ethConfig])
      console.log(`[Setting rate] txHash: ${txHash}`)
      return waitAndReturnEvents(this.eth, txHash, this.contracts['PILE'].abi, this.transactionTimeout)
    }

    // ------------ admin functions lender-site -------------
    setMinimumJuniorRatio = async (ratio: string) => {
      const assessor = this.contract('ASSESSOR')
      // Source: https://github.com/ethereum/web3.js/issues/2256#issuecomment-462730550
      return this.pending(assessor.file(web3.fromAscii('minJuniorRatio').padEnd(66, '0'), ratio))
    }

    approveAllowanceJunior = async (user: string, maxCurrency: string, maxToken: string) => {
      const juniorOperator = this.contract('JUNIOR_OPERATOR')
      return this.pending(juniorOperator.approve(user, maxCurrency, maxToken))
    }

    approveAllowanceSenior = async (user: string, maxCurrency: string, maxToken: string) => {
      const seniorOperator = this.contract('SENIOR_OPERATOR')

      if (this.getOperatorType('senior') === 'PROPERTIONAL_OPERATOR') {
        return this.pending(seniorOperator.approve(user, maxCurrency))
      } else {
        return this.pending(seniorOperator.approve(user, maxCurrency, maxToken))
      }
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
  initRate(rate: string): Promise<any>
  setRate(loan: string, rate: string): Promise<any>
  setMinimumJuniorRatio(amount: string): Promise<PendingTransaction>
  approveAllowanceJunior(user: string, maxCurrency: string, maxToken: string): Promise<any>
  approveAllowanceSenior(user: string, maxCurrency: string, maxToken: string): Promise<any>
}

export default AdminActions
