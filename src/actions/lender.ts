import { Constructor, TinlakeParams, PendingTransaction } from '../Tinlake'
import BN from 'bn.js'

export function LenderActions<ActionBase extends Constructor<TinlakeParams>>(Base: ActionBase) {
  return class extends Base implements ILenderActions {
    // senior tranche functions
    supplySenior = async (currencyAmount: string) => {
      return this.pending(this.contract('SENIOR_OPERATOR').supply(currencyAmount, this.overrides))
    }

    redeemSenior = async (tokenAmount: string) => {
      return this.pending(this.contract('SENIOR_OPERATOR').redeem(tokenAmount, { ...this.overrides, gasLimit: 300000 }))
    }

    getSeniorTokenAllowance = async (owner: string) => {
      return (await this.contract('SENIOR_TOKEN').allowance(owner, this.contractAddresses['SENIOR_TRANCHE'])).toBN()
    }

    approveSeniorToken = async (tokenAmount: string) => {
      return this.pending(
        this.contract('SENIOR_TOKEN').approve(this.contractAddresses['SENIOR_TRANCHE'], tokenAmount, this.overrides)
      )
    }

    // junior tranche functions
    supplyJunior = async (currencyAmount: string) => {
      return this.pending(this.contract('JUNIOR_OPERATOR').supply(currencyAmount, this.overrides))
    }

    redeemJunior = async (tokenAmount: string) => {
      return this.pending(this.contract('JUNIOR_OPERATOR').redeem(tokenAmount, { ...this.overrides, gasLimit: 300000 }))
    }

    getJuniorTokenAllowance = async (owner: string) => {
      return (await this.contract('JUNIOR_TOKEN').allowance(owner, this.contractAddresses['JUNIOR_TRANCHE'])).toBN()
    }

    approveJuniorToken = async (tokenAmount: string) => {
      return this.pending(
        this.contract('JUNIOR_TOKEN').approve(this.contractAddresses['JUNIOR_TRANCHE'], tokenAmount, this.overrides)
      )
    }

    // general lender functions
    balance = async () => {
      return this.pending(this.contract('DISTRIBUTOR').balance(this.overrides))
    }
  }
}

export type ILenderActions = {
  getSeniorTokenAllowance(owner: string): Promise<BN>
  getJuniorTokenAllowance(owner: string): Promise<BN>
  supplyJunior(currencyAmount: string): Promise<PendingTransaction>
  approveJuniorToken: (tokenAmount: string) => Promise<PendingTransaction>
  approveSeniorToken: (tokenAmount: string) => Promise<PendingTransaction>
  redeemJunior(tokenAmount: string): Promise<PendingTransaction>
  supplySenior(currencyAmount: string): Promise<PendingTransaction>
  redeemSenior(tokenAmount: string): Promise<PendingTransaction>
  balance(): Promise<PendingTransaction>
}

export default LenderActions
