import { Constructor, TinlakeParams, PendingTransaction } from '../Tinlake'
import BN from 'bn.js'

export function LenderActions<ActionBase extends Constructor<TinlakeParams>>(Base: ActionBase) {
  return class extends Base implements ILenderActions {
    // senior tranche functions
    submitSeniorSupplyOrder = async (user: string, supplyAmount: string) => {
      return this.pending(this.contract('SENIOR_OPERATOR').supplyOrder(supplyAmount, this.overrides))
    }

    submitSeniorRedeemOrder = async (user: string, redeemAmount: string) => {
      return this.pending(this.contract('SENIOR_OPERATOR').redeemOrder(redeemAmount, this.overrides))
    }

    disburseSenior = async (user: string) => {
      return this.pending(this.contract('SENIOR_OPERATOR')['disburse(address)'](user, this.overrides))
    }

    getSeniorTokenAllowance = async (owner: string) => {
      return (
        await this.contract('SENIOR_TOKEN').allowance(owner, this.contractAddresses['SENIOR_TRANCHE'], this.overrides)
      ).toBN()
    }

    approveSeniorToken = async (tokenAmount: string) => {
      return this.pending(
        this.contract('SENIOR_TOKEN').approve(this.contractAddresses['SENIOR_TRANCHE'], tokenAmount, this.overrides)
      )
    }

    calcSeniorDisburse = async (user: string) => {
      return await this.contract('SENIOR_TRANCHE')['calcDisburse(address)'](user)
    }

    // junior tranche functions
    submitJuniorSupplyOrder = async (user: string, supplyAmount: string) => {
      return this.pending(this.contract('JUNIOR_OPERATOR').supplyOrder(supplyAmount, this.overrides))
    }

    submitJuniorRedeemOrder = async (user: string, redeemAmount: string) => {
      return this.pending(this.contract('JUNIOR_OPERATOR').redeemOrder(redeemAmount, this.overrides))
    }

    disburseJunior = async (user: string) => {
      return this.pending(this.contract('JUNIOR_OPERATOR')['disburse(address)'](user, this.overrides))
    }

    getJuniorTokenAllowance = async (owner: string) => {
      return (
        await this.contract('JUNIOR_TOKEN').allowance(owner, this.contractAddresses['JUNIOR_TRANCHE'], this.overrides)
      ).toBN()
    }

    approveJuniorToken = async (tokenAmount: string) => {
      return this.pending(
        this.contract('JUNIOR_TOKEN').approve(this.contractAddresses['JUNIOR_TRANCHE'], tokenAmount, this.overrides)
      )
    }

    calcJuniorDisburse = async (user: string) => {
      return await this.contract('JUNIOR_TRANCHE')['calcDisburse(address)'](user)
    }
  }
}

export type CalcDisburseResult = {
  payoutCurrencyAmount: BN
  payoutTokenAmount: BN
  remainingSupplyCurrency: BN
  remainingRedeemToken: BN
}

export type ILenderActions = {
  getSeniorTokenAllowance(owner: string): Promise<BN>
  getJuniorTokenAllowance(owner: string): Promise<BN>
  approveJuniorToken: (tokenAmount: string) => Promise<PendingTransaction>
  approveSeniorToken: (tokenAmount: string) => Promise<PendingTransaction>
  submitSeniorSupplyOrder(user: string, supplyAmount: string): Promise<PendingTransaction>
  submitSeniorRedeemOrder(user: string, redeemAmount: string): Promise<PendingTransaction>
  submitJuniorSupplyOrder(user: string, supplyAmount: string): Promise<PendingTransaction>
  submitJuniorRedeemOrder(user: string, redeemAmount: string): Promise<PendingTransaction>
  disburseSenior(user: string): Promise<PendingTransaction>
  disburseJunior(user: string): Promise<PendingTransaction>
  calcJuniorDisburse(user: string): Promise<CalcDisburseResult>
  calcSeniorDisburse(user: string): Promise<CalcDisburseResult>
}

export default LenderActions
