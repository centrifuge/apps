import { Constructor, TinlakeParams, PendingTransaction } from '../Tinlake'
import BN from 'bn.js'
import { signDaiPermit, signERC2612Permit } from 'eth-permit'

const DaiTokenAddress = '0x6b175474e89094c44da98b954eedeac495271d0f'

export function LenderActions<ActionBase extends Constructor<TinlakeParams>>(Base: ActionBase) {
  return class extends Base implements ILenderActions {

    // senior tranche functions
    submitSeniorSupplyOrder = async (supplyAmount: string) => {
      return this.pending(this.contract('SENIOR_OPERATOR').supplyOrder(supplyAmount, this.overrides))
    }

    submitSeniorSupplyOrderWithPermit = async (amount: string, senderAddress: string) => {
      if (!this.legacyWeb3Provider) {
        throw new Error('You need to set legacyWeb3Provider')
      }

      if (this.contractAddresses['TINLAKE_CURRENCY'] === DaiTokenAddress) {
        const result = await signDaiPermit(
          this.legacyWeb3Provider,
          this.contract('TINLAKE_CURRENCY').address,
          senderAddress,
          this.contract('SENIOR_TRANCHE').address
        )
        return this.pending(
          this.contract('SENIOR_OPERATOR').supplyOrderWithDaiPermit(
            amount,
            result.nonce,
            result.expiry,
            result.v,
            result.r,
            result.s,
            this.overrides
          )
        )
      }

      const result = await signERC2612Permit(
        this.legacyWeb3Provider,
        this.contract('TINLAKE_CURRENCY').address,
        senderAddress,
        this.contract('SENIOR_TRANCHE').address,
        amount
      )

      return this.pending(
        this.contract('SENIOR_OPERATOR').supplyOrderWithPermit(
          amount,
          amount,
          result.deadline,
          result.v,
          result.r,
          result.s,
          this.overrides
        )
      )
    }

    submitSeniorRedeemOrderWithPermit = async (amount: string, senderAddress: string) => {
      if (!this.legacyWeb3Provider) {
        throw new Error('You need to set legacyWeb3Provider')
      }

      const result = await signERC2612Permit(
        this.legacyWeb3Provider,
        this.contract('SENIOR_TOKEN').address,
        senderAddress,
        this.contract('SENIOR_TRANCHE').address,
        amount
      )

      return this.pending(
        this.contract('SENIOR_OPERATOR').redeemOrderWithPermit(
          amount,
          amount,
          result.deadline,
          result.v,
          result.r,
          result.s,
          this.overrides
        )
      )
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

    submitJuniorSupplyOrderWithPermit = async (amount: string, senderAddress: string) => {
      if (!this.legacyWeb3Provider) {
        throw new Error('You need to set legacyWeb3Provider')
      }

      if (this.contractAddresses['TINLAKE_CURRENCY'] === DaiTokenAddress) {
        const result = await signDaiPermit(
          this.legacyWeb3Provider,
          this.contract('TINLAKE_CURRENCY').address,
          senderAddress,
          this.contract('JUNIOR_TRANCHE').address
        )

        return this.pending(
          this.contract('JUNIOR_OPERATOR').supplyOrderWithDaiPermit(
            amount,
            result.nonce,
            result.expiry,
            result.v,
            result.r,
            result.s,
            this.overrides
          )
        )
      }

      const result = await signERC2612Permit(
        this.legacyWeb3Provider,
        this.contract('TINLAKE_CURRENCY').address,
        senderAddress,
        this.contract('JUNIOR_TRANCHE').address,
        amount
      )

      return this.pending(
        this.contract('JUNIOR_OPERATOR').supplyOrderWithPermit(
          amount,
          amount,
          result.deadline,
          result.v,
          result.r,
          result.s,
          this.overrides
        )
      )
    }

    submitJuniorRedeemOrderWithPermit = async (amount: string, senderAddress: string) => {
      if (!this.legacyWeb3Provider) {
        throw new Error('You need to set legacyWeb3Provider')
      }

      const result = await signERC2612Permit(
        this.legacyWeb3Provider,
        this.contract('JUNIOR_TOKEN').address,
        senderAddress,
        this.contract('JUNIOR_TRANCHE').address,
        amount
      )
      return this.pending(
        this.contract('JUNIOR_OPERATOR').redeemOrderWithPermit(
          amount,
          amount,
          result.deadline,
          result.v,
          result.r,
          result.s,
          this.overrides
        )
      )
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
  submitSeniorSupplyOrderWithPermit(amount: string, senderAddress: string): Promise<PendingTransaction>
  submitSeniorRedeemOrder(redeemAmount: string): Promise<PendingTransaction>
  submitSeniorRedeemOrderWithPermit(amount: string, senderAddress: string): Promise<PendingTransaction>
  submitJuniorSupplyOrder(supplyAmount: string): Promise<PendingTransaction>
  submitJuniorSupplyOrderWithPermit(amount: string, senderAddress: string): Promise<PendingTransaction>
  submitJuniorRedeemOrder(redeemAmount: string): Promise<PendingTransaction>
  submitJuniorRedeemOrderWithPermit(amount: string, senderAddress: string): Promise<PendingTransaction>
  disburseSenior(): Promise<PendingTransaction>
  disburseJunior(): Promise<PendingTransaction>
  calcJuniorDisburse(user: string): Promise<CalcDisburseResult>
  calcSeniorDisburse(user: string): Promise<CalcDisburseResult>
  checkJuniorTokenMemberlist(user: string): Promise<boolean>
  checkSeniorTokenMemberlist(user: string): Promise<boolean>
}

export default LenderActions
