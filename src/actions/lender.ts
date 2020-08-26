import { Constructor, TinlakeParams, PendingTransaction } from '../Tinlake'
import { executeAndRetry, waitAndReturnEvents } from '../services/ethereum'
import BN from 'bn.js'

export function LenderActions<ActionBase extends Constructor<TinlakeParams>>(Base: ActionBase) {
  return class extends Base implements ILenderActions {
    // senior tranche functions
    supplySenior = async (currencyAmount: string) => {
      const seniorOperator = this.contract('SENIOR_OPERATOR')
      return this.pending(seniorOperator.supply(currencyAmount))
    }

    redeemSenior = async (tokenAmount: string) => {
      const txHash = await executeAndRetry(this.contracts['SENIOR_OPERATOR'].redeem, [tokenAmount, this.ethConfig])
      console.log(`[Redeem] txHash: ${txHash}`)
      return waitAndReturnEvents(this.eth, txHash, this.contracts['SENIOR_OPERATOR'].abi, this.transactionTimeout)
    }

    getSeniorTokenAllowance = async (owner: string) => {
      const res: { 0: BN } = await executeAndRetry(this.contracts['SENIOR_TOKEN'].allowance, [
        owner,
        this.contractAddresses['SENIOR'],
      ])
      return res[0] || new BN(0)
    }

    approveSeniorToken = async (tokenAmount: string) => {
      const txHash = await executeAndRetry(this.contracts['SENIOR_TOKEN'].approve, [
        this.contractAddresses['SENIOR'],
        tokenAmount,
        this.ethConfig,
      ])
      console.log(`[Currency.approve] txHash: ${txHash}`)
      return waitAndReturnEvents(this.eth, txHash, this.contracts['SENIOR_TOKEN'].abi, this.transactionTimeout)
    }

    // junior tranche functions
    supplyJunior = async (currencyAmount: string) => {
      const juniorOperator = this.contract('JUNIOR_OPERATOR')
      return this.pending(juniorOperator.supply(currencyAmount))
    }

    redeemJunior = async (tokenAmount: string) => {
      const txHash = await executeAndRetry(this.contracts['JUNIOR_OPERATOR'].redeem, [tokenAmount, this.ethConfig])
      console.log(`[Redeem] txHash: ${txHash}`)
      return waitAndReturnEvents(this.eth, txHash, this.contracts['JUNIOR_OPERATOR'].abi, this.transactionTimeout)
    }

    getJuniorTokenAllowance = async (owner: string) => {
      const res: { 0: BN } = await executeAndRetry(this.contracts['JUNIOR_TOKEN'].allowance, [
        owner,
        this.contractAddresses['JUNIOR'],
      ])
      return res[0] || new BN(0)
    }

    approveJuniorToken = async (tokenAmount: string) => {
      const txHash = await executeAndRetry(this.contracts['JUNIOR_TOKEN'].approve, [
        this.contractAddresses['JUNIOR'],
        tokenAmount,
        this.ethConfig,
      ])
      console.log(`[Currency.approve] txHash: ${txHash}`)
      return waitAndReturnEvents(this.eth, txHash, this.contracts['JUNIOR_TOKEN'].abi, this.transactionTimeout)
    }

    // general lender functions
    balance = async () => {
      const txHash = await executeAndRetry(this.contracts['DISTRIBUTOR'].balance, [this.ethConfig])
      console.log(`[Balance] txHash: ${txHash}`)
      return waitAndReturnEvents(this.eth, txHash, this.contracts['DISTRIBUTOR'].abi, this.transactionTimeout)
    }
  }
}

export type ILenderActions = {
  getSeniorTokenAllowance(owner: string): Promise<BN>
  getJuniorTokenAllowance(owner: string): Promise<BN>
  supplyJunior(currencyAmount: string): Promise<PendingTransaction>
  approveJuniorToken: (tokenAmount: string) => Promise<unknown>
  approveSeniorToken: (tokenAmount: string) => Promise<unknown>
  redeemJunior(tokenAmount: string): Promise<any>
  supplySenior(currencyAmount: string): Promise<PendingTransaction>
  redeemSenior(tokenAmount: string): Promise<any>
  balance(): Promise<any>
}

export default LenderActions
