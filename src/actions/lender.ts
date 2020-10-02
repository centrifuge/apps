import { Constructor, TinlakeParams, PendingTransaction } from '../Tinlake'
import BN from 'bn.js'
import { signDaiPermit, signERC2612Permit } from 'eth-permit'

export function LenderActions<ActionBase extends Constructor<TinlakeParams>>(Base: ActionBase) {
  return class extends Base implements ILenderActions {
    // senior tranche functions
    submitSeniorSupplyOrder = async (supplyAmount: string) => {
      return this.pending(this.contract('SENIOR_OPERATOR').supplyOrder(supplyAmount, this.overrides))
    }

    submitSeniorSupplyOrderWithPermit = async(amount: string, senderAddress: string) => {
      if (!this.contractAddresses['SENIOR_TOKEN'] || !this.contractAddresses['SENIOR_TRANCHE'] || !this.contractAddresses['TINLAKE_CURRENCY']) {return}
      if (this.contractConfig.currency_type === 'DAI') {
        const result = await signDaiPermit(this.provider, this.contractAddresses['TINLAKE_CURRENCY'], senderAddress, this.contractAddresses['SENIOR_TRANCHE']);
        return this.pending(this.contract('SENIOR_OPERATOR').supplyOrderWithDaiPermit(amount, result.nonce, result.expiry, result.v, result.r, result.s, this.overrides))
      }
      const result = await signERC2612Permit(this.provider, this.contractAddresses['SENIOR_TOKEN'], senderAddress, this.contractAddresses['SENIOR_TRANCHE'], amount);
      return this.pending(this.contract('SENIOR_OPERATOR').supplyOrderWithPermit(amount, amount, result.deadline, result.v, result.r, result.s, this.overrides))
    }

    submitSeniorRedeemOrderWithPermit = async(amount: string, senderAddress: string) => {
      if (!this.contractAddresses['SENIOR_TOKEN'] || !this.contractAddresses['SENIOR_TRANCHE']) {return}
      const result = await signERC2612Permit(this.provider, this.contractAddresses['SENIOR_TOKEN'], senderAddress, this.contractAddresses['SENIOR_TRANCHE'], amount);
      return this.pending(this.contract('SENIOR_OPERATOR').redeemOrderWithPermit(amount, amount, result.deadline, result.v, result.r, result.s, this.overrides))
    }

    submitSeniorRedeemOrder = async (redeemAmount: string) => {
      return this.pending(this.contract('SENIOR_OPERATOR').redeemOrder(redeemAmount, this.overrides))
    }

    disburseSenior = async () => {
      return this.pending(this.contract('SENIOR_OPERATOR')['disburse()'](this.overrides))
    }

    getSeniorTokenAllowance = async (owner: string) => {
      return (await this.contract('SENIOR_TOKEN').allowance(owner, this.contractAddresses['SENIOR_TRANCHE'])).toBN()
    }

    checkSeniorTokenMemberlist = async (user: string) => {
      return await this.contract('SENIOR_MEMBERLIST').hasMember(user)
    }

    approveSeniorToken = async (tokenAmount: string) => {
      return this.pending(
        this.contract('SENIOR_TOKEN').approve(this.contractAddresses['SENIOR_TRANCHE'], tokenAmount, this.overrides)
      )
    }

    calcSeniorDisburse = async (user: string) => {
      return disburseToBN(await this.contract('SENIOR_TRANCHE')['calcDisburse(address)'](user))
    }

    // junior tranche functions
    submitJuniorSupplyOrder = async (supplyAmount: string) => {
      return this.pending(this.contract('JUNIOR_OPERATOR').supplyOrder(supplyAmount, this.overrides))
    }

    submitJuniorSupplyOrderWithPermit = async(amount: string, senderAddress: string) => {
      if (!this.contractAddresses['JUNIOR_TOKEN'] || !this.contractAddresses['JUNIOR_TRANCHE'] || !this.contractAddresses['TINLAKE_CURRENCY']) {return}
      if (this.contractConfig.currency_type === 'DAI') {
        const result = await signDaiPermit(this.provider, this.contractAddresses['TINLAKE_CURRENCY'], senderAddress, this.contractAddresses['JUNIOR_TRANCHE']);
        return this.pending(this.contract('JUNIOR_OPERATOR').supplyOrderWithDaiPermit(amount, result.nonce, result.expiry, result.v, result.r, result.s, this.overrides))
      }
      const result = await signERC2612Permit(this.provider, this.contractAddresses['JUNIOR_TOKEN'], senderAddress, this.contractAddresses['JUNIOR_TRANCHE'], amount);
      return this.pending(this.contract('JUNIOR_OPERATOR').supplyOrderWithPermit(amount, amount, result.deadline, result.v, result.r, result.s, this.overrides))
    }

    submitJuniorRedeemOrderWithPermit = async(amount: string, senderAddress: string) => {
      if (!this.contractAddresses['JUNIOR_TOKEN'] || !this.contractAddresses['JUNIOR_TRANCHE']) {return}
      const result = await signERC2612Permit(this.provider, this.contractAddresses['JUNIOR_TOKEN'], senderAddress, this.contractAddresses['JUNIOR_TRANCHE'], amount);
      return this.pending(this.contract('JUNIOR_OPERATOR').redeemOrderWithPermit(amount, amount, result.deadline, result.v, result.r, result.s, this.overrides))
    }

    submitJuniorRedeemOrder = async (redeemAmount: string) => {
      return this.pending(this.contract('JUNIOR_OPERATOR').redeemOrder(redeemAmount, this.overrides))
    }

    disburseJunior = async () => {
      return this.pending(this.contract('JUNIOR_OPERATOR')['disburse()'](this.overrides))
    }

    getJuniorTokenAllowance = async (owner: string) => {
      return (await this.contract('JUNIOR_TOKEN').allowance(owner, this.contractAddresses['JUNIOR_TRANCHE'])).toBN()
    }

    checkJuniorTokenMemberlist = async (user: string) => {
      return await this.contract('JUNIOR_TOKEN').hasMember(user)
    }

    approveJuniorToken = async (tokenAmount: string) => {
      return this.pending(
        this.contract('JUNIOR_TOKEN').approve(this.contractAddresses['JUNIOR_TRANCHE'], tokenAmount, this.overrides)
      )
    }

    calcJuniorDisburse = async (user: string) => {
      return disburseToBN(await this.contract('JUNIOR_TRANCHE')['calcDisburse(address)'](user))
    }
  }
}

const disburseToBN = (disburse: any): CalcDisburseResult => {
  return {
    payoutCurrencyAmount: disburse.payoutCurrencyAmount.toBN(),
    payoutTokenAmount: disburse.payoutTokenAmount.toBN(),
    remainingSupplyCurrency: disburse.remainingSupplyCurrency.toBN(),
    remainingRedeemToken: disburse.remainingRedeemToken.toBN(),
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
  submitSeniorSupplyOrder(supplyAmount: string): Promise<PendingTransaction>
  submitSeniorSupplyOrderWithPermit(amount: string, senderAddress: string): Promise<PendingTransaction | undefined>
  submitSeniorRedeemOrder(redeemAmount: string): Promise<PendingTransaction>
  submitSeniorRedeemOrderWithPermit(amount: string, senderAddress: string): Promise<PendingTransaction | undefined>
  submitJuniorSupplyOrder(supplyAmount: string): Promise<PendingTransaction>
  submitJuniorSupplyOrderWithPermit(amount: string, senderAddress: string): Promise<PendingTransaction | undefined>
  submitJuniorRedeemOrder(redeemAmount: string): Promise<PendingTransaction>
  submitJuniorRedeemOrderWithPermit(amount: string, senderAddress: string): Promise<PendingTransaction | undefined>
  disburseSenior(): Promise<PendingTransaction>
  disburseJunior(): Promise<PendingTransaction>
  calcJuniorDisburse(user: string): Promise<CalcDisburseResult>
  calcSeniorDisburse(user: string): Promise<CalcDisburseResult>
  checkJuniorTokenMemberlist(user: string): Promise<boolean>
  checkSeniorTokenMemberlist(user: string): Promise<boolean>
}

export default LenderActions
