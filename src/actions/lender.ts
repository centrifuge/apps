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
      const seniorOperator = this.contract('SENIOR_OPERATOR')
      return this.pending(seniorOperator.redeem(tokenAmount))
    }

    getSeniorTokenAllowance = async (owner: string) => {
      const res: { 0: BN } = await executeAndRetry(this.contracts['SENIOR_TOKEN'].allowance, [
        owner,
        this.contractAddresses['SENIOR'],
      ])
      return res[0] || new BN(0)
    }

    approveSeniorToken = async (tokenAmount: string) => {
      const senior = this.contract('SENIOR_TOKEN')
      return this.pending(senior.approve(this.contractAddresses['SENIOR'], tokenAmount))
    }

    // junior tranche functions
    supplyJunior = async (currencyAmount: string) => {
      const juniorOperator = this.contract('JUNIOR_OPERATOR')
      return this.pending(juniorOperator.supply(currencyAmount))
    }

    redeemJunior = async (tokenAmount: string) => {
      const juniorOperator = this.contract('JUNIOR_OPERATOR')
      return this.pending(juniorOperator.redeem(tokenAmount))
    }

    getJuniorTokenAllowance = async (owner: string) => {
      const res: { 0: BN } = await executeAndRetry(this.contracts['JUNIOR_TOKEN'].allowance, [
        owner,
        this.contractAddresses['JUNIOR'],
      ])
      return res[0] || new BN(0)
    }

    approveJuniorToken = async (tokenAmount: string) => {
      const junior = this.contract('JUNIOR_TOKEN')
      return this.pending(junior.approve(this.contractAddresses['JUNIOR'], tokenAmount))
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
  approveJuniorToken: (tokenAmount: string) => Promise<PendingTransaction>
  approveSeniorToken: (tokenAmount: string) => Promise<PendingTransaction>
  redeemJunior(tokenAmount: string): Promise<PendingTransaction>
  supplySenior(currencyAmount: string): Promise<PendingTransaction>
  redeemSenior(tokenAmount: string): Promise<PendingTransaction>
  balance(): Promise<any>
}

export default LenderActions
