import { Constructor, TinlakeParams, PendingTransaction } from '../Tinlake'
import BN from 'bn.js'
import { signDaiPermit, signERC2612Permit } from 'eth-permit'
import { DaiPermitMessage, ERC2612PermitMessage, PermitMessage } from '../types/tinlake'

const DaiTokenAddress = '0x6b175474e89094c44da98b954eedeac495271d0f'
const maxUint256 = '115792089237316195423570985008687907853269984665640564039457584007913129639935'

export function LenderActions<ActionBase extends Constructor<TinlakeParams>>(Base: ActionBase) {
  return class extends Base implements ILenderActions {
    // senior tranche functions
    submitSeniorSupplyOrder = async (supplyAmount: string) => {
      return this.pending(this.contract('SENIOR_OPERATOR').supplyOrder(supplyAmount, this.overrides))
    }

    submitSeniorSupplyOrderWithAllowance = async (amount: string, senderAddress: string) => {
      const allowance = (await (this as any).getSeniorForCurrencyAllowance(senderAddress)) || new BN(0)

      if (allowance.lt(new BN(amount))) {
        const approvalTx = await (this as any).approveSeniorForCurrency(maxUint256)
        await this.getTransactionReceipt(approvalTx)
      }

      return this.submitSeniorSupplyOrder(amount)
    }

    signSupplyPermit = async (
      amount: string,
      senderAddress: string,
      tranche: 'senior' | 'junior'
    ): Promise<PermitMessage> => {
      if (!this.legacyWeb3Provider) {
        throw new Error('You need to set legacyWeb3Provider')
      }

      const trancheAddress =
        tranche === 'senior' ? this.contract('SENIOR_TRANCHE').address : this.contract('JUNIOR_TRANCHE').address

      if (this.contractAddresses['TINLAKE_CURRENCY'] === DaiTokenAddress) {
        return await signDaiPermit(
          this.legacyWeb3Provider,
          this.contract('TINLAKE_CURRENCY').address,
          senderAddress,
          trancheAddress
        )
      }

      return await signERC2612Permit(
        this.legacyWeb3Provider,
        this.contract('TINLAKE_CURRENCY').address,
        senderAddress,
        trancheAddress,
        amount
      )
    }

    signRedeemPermit = async (
      amount: string,
      senderAddress: string,
      tranche: 'senior' | 'junior'
    ): Promise<ERC2612PermitMessage> => {
      if (!this.legacyWeb3Provider) {
        throw new Error('You need to set legacyWeb3Provider')
      }

      const trancheAddress =
        tranche === 'senior' ? this.contract('SENIOR_TRANCHE').address : this.contract('JUNIOR_TRANCHE').address

      return await signERC2612Permit(
        this.legacyWeb3Provider,
        this.contract(tranche === 'senior' ? 'SENIOR_TOKEN' : 'JUNIOR_TOKEN').address,
        senderAddress,
        trancheAddress,
        amount
      )
    }

    submitSeniorSupplyOrderWithPermit = async (amount: string, permit: PermitMessage) => {
      if (this.contractAddresses['TINLAKE_CURRENCY'] === DaiTokenAddress) {
        const daiPermit = permit as DaiPermitMessage

        return this.pending(
          this.contract('SENIOR_OPERATOR').supplyOrderWithDaiPermit(
            amount,
            daiPermit.nonce,
            daiPermit.expiry,
            daiPermit.v,
            daiPermit.r,
            daiPermit.s,
            { ...this.overrides, gasLimit: 400000 }
          )
        )
      }

      const erc2612Permit = permit as ERC2612PermitMessage

      return this.pending(
        this.contract('SENIOR_OPERATOR').supplyOrderWithPermit(
          amount,
          amount,
          erc2612Permit.deadline,
          erc2612Permit.v,
          erc2612Permit.r,
          erc2612Permit.s,
          { ...this.overrides, gasLimit: 400000 }
        )
      )
    }

    submitSeniorRedeemOrderWithAllowance = async (amount: string, senderAddress: string) => {
      const allowance = (await this.getSeniorTokenAllowance(senderAddress)) || new BN(0)

      if (allowance.lt(new BN(amount))) {
        const approvalTx = await this.approveSeniorToken(maxUint256)
        await this.getTransactionReceipt(approvalTx)
      }

      return this.submitSeniorRedeemOrder(amount)
    }

    submitSeniorRedeemOrderWithPermit = async (amount: string, permit: ERC2612PermitMessage) => {
      return this.pending(
        this.contract('SENIOR_OPERATOR').redeemOrderWithPermit(
          amount,
          amount,
          permit.deadline,
          permit.v,
          permit.r,
          permit.s,
          { ...this.overrides, gasLimit: 400000 }
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

    submitJuniorSupplyOrderWithAllowance = async (amount: string, senderAddress: string) => {
      const allowance = (await (this as any).getJuniorForCurrencyAllowance(senderAddress)) || new BN(0)

      if (allowance.lt(new BN(amount))) {
        const approvalTx = await (this as any).approveJuniorForCurrency(maxUint256)
        await this.getTransactionReceipt(approvalTx)
      }

      return this.submitJuniorSupplyOrder(amount)
    }

    submitJuniorSupplyOrderWithPermit = async (amount: string, permit: PermitMessage) => {
      if (this.contractAddresses['TINLAKE_CURRENCY'] === DaiTokenAddress) {
        const daiPermit = permit as DaiPermitMessage

        return this.pending(
          this.contract('JUNIOR_OPERATOR').supplyOrderWithDaiPermit(
            amount,
            daiPermit.nonce,
            daiPermit.expiry,
            daiPermit.v,
            daiPermit.r,
            daiPermit.s,
            { ...this.overrides, gasLimit: 400000 }
          )
        )
      }

      const erc2612Permit = permit as ERC2612PermitMessage

      return this.pending(
        this.contract('JUNIOR_OPERATOR').supplyOrderWithPermit(
          amount,
          amount,
          erc2612Permit.deadline,
          erc2612Permit.v,
          erc2612Permit.r,
          erc2612Permit.s,
          { ...this.overrides, gasLimit: 400000 }
        )
      )
    }

    submitJuniorRedeemOrderWithAllowance = async (amount: string, senderAddress: string) => {
      const allowance = (await this.getJuniorTokenAllowance(senderAddress)) || new BN(0)

      if (allowance.lt(new BN(amount))) {
        const approvalTx = await this.approveJuniorToken(maxUint256)
        await this.getTransactionReceipt(approvalTx)
      }

      return this.submitJuniorRedeemOrder(amount)
    }

    submitJuniorRedeemOrderWithPermit = async (amount: string, permit: ERC2612PermitMessage) => {
      return this.pending(
        this.contract('JUNIOR_OPERATOR').redeemOrderWithPermit(
          amount,
          amount,
          permit.deadline,
          permit.v,
          permit.r,
          permit.s,
          { ...this.overrides, gasLimit: 400000 }
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
  signSupplyPermit: (
    amount: string,
    senderAddress: string,
    tranche: 'senior' | 'junior'
  ) => Promise<PermitMessage>
  signRedeemPermit: (
    amount: string,
    senderAddress: string,
    tranche: 'senior' | 'junior'
  ) => Promise<ERC2612PermitMessage>
  submitSeniorSupplyOrder(supplyAmount: string): Promise<PendingTransaction>
  submitSeniorSupplyOrderWithPermit(amount: string, permit: PermitMessage): Promise<PendingTransaction>
  submitSeniorRedeemOrder(redeemAmount: string): Promise<PendingTransaction>
  submitSeniorRedeemOrderWithPermit(amount: string, permit: ERC2612PermitMessage): Promise<PendingTransaction>
  submitJuniorSupplyOrder(supplyAmount: string): Promise<PendingTransaction>
  submitJuniorSupplyOrderWithPermit(amount: string, permit: PermitMessage): Promise<PendingTransaction>
  submitJuniorRedeemOrder(redeemAmount: string): Promise<PendingTransaction>
  submitJuniorRedeemOrderWithPermit(amount: string, permit: ERC2612PermitMessage): Promise<PendingTransaction>
  disburseSenior(): Promise<PendingTransaction>
  disburseJunior(): Promise<PendingTransaction>
  calcJuniorDisburse(user: string): Promise<CalcDisburseResult>
  calcSeniorDisburse(user: string): Promise<CalcDisburseResult>
  checkJuniorTokenMemberlist(user: string): Promise<boolean>
  checkSeniorTokenMemberlist(user: string): Promise<boolean>
  submitSeniorSupplyOrderWithAllowance(amount: string, senderAddress: string): Promise<PendingTransaction>
  submitSeniorRedeemOrderWithAllowance(amount: string, senderAddress: string): Promise<PendingTransaction>
  submitJuniorSupplyOrderWithAllowance(amount: string, senderAddress: string): Promise<PendingTransaction>
  submitJuniorRedeemOrderWithAllowance(amount: string, senderAddress: string): Promise<PendingTransaction>
}

export default LenderActions
