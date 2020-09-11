import { Constructor, TinlakeParams, PendingTransaction } from '../Tinlake'
import BN from 'bn.js'

export function LenderActions<ActionBase extends Constructor<TinlakeParams>>(Base: ActionBase) {
  return class extends Base implements ILenderActions {
    // senior tranch functions
    // REV: becomes submitSeniorSupplyOrder()
    supplySenior = async (currencyAmount: string) => {
      return this.pending(this.contract('SENIOR_OPERATOR').supply(currencyAmount, this.overrides))
    }

    // REV: becomes submitSeniorRedeemOrder()
    redeemSenior = async (tokenAmount: string) => {
      return this.pending(this.contract('SENIOR_OPERATOR').redeem(tokenAmount, this.overrides))
    }

    getSeniorTokenAllowance = async (owner: string) => {
      return (
        await this.contract('SENIOR_TOKEN').allowance(owner, this.contractAddresses['SENIOR'], this.overrides)
      ).toBN()
    }

    approveSeniorToken = async (tokenAmount: string) => {
      return this.pending(
        this.contract('SENIOR_TOKEN').approve(this.contractAddresses['SENIOR'], tokenAmount, this.overrides)
      )
    }

    // junior tranche functions
    // REV: becomes submitJuniorSupplyOrder()
    supplyJunior = async (currencyAmount: string) => {
      return this.pending(this.contract('JUNIOR_OPERATOR').supply(currencyAmount, this.overrides))
    }

    // REV: becomes submitJuniorRedeemOrder()
    redeemJunior = async (tokenAmount: string) => {
      return this.pending(this.contract('JUNIOR_OPERATOR').redeem(tokenAmount, this.overrides))
    }

    getJuniorTokenAllowance = async (owner: string) => {
      return (
        await this.contract('JUNIOR_TOKEN').allowance(owner, this.contractAddresses['JUNIOR'], this.overrides)
      ).toBN()
    }

    approveJuniorToken = async (tokenAmount: string) => {
      return this.pending(
        this.contract('JUNIOR_TOKEN').approve(this.contractAddresses['JUNIOR'], tokenAmount, this.overrides)
      )
    }

    // general lender functions
    // REV: remove
    balance = async () => {
      return this.pending(this.contract('DISTRIBUTOR').balance(this.overrides))
    }

    // REV: add disperse()
    // REV: we probably need a method to get the current epoch state (to show in the UI if the investor can call disperse())
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
