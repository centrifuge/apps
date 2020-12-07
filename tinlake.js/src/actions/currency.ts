import BN from 'bn.js'
import { Constructor, PendingTransaction, TinlakeParams } from '../Tinlake'

export function CurrencyActions<ActionsBase extends Constructor<TinlakeParams>>(Base: ActionsBase) {
  return class extends Base implements ICurrencyActions {
    // move out for tests only
    mintCurrency = async (usr: string, amount: string) => {
      return this.pending(this.contract('TINLAKE_CURRENCY').mint(usr, amount, this.overrides))
    }

    getCurrencyAllowance = async (owner: string, spender: string) => {
      const currencyContract = this.contract('TINLAKE_CURRENCY')
      return await this.toBN(currencyContract.allowance(owner, spender))
    }

    getJuniorForCurrencyAllowance = async (owner: string) => {
      if (!this.contractAddresses['JUNIOR_TRANCHE']) return
      return this.getCurrencyAllowance(owner, this.contractAddresses['JUNIOR_TRANCHE'])
    }

    getSeniorForCurrencyAllowance = async (owner: string) => {
      if (!this.contractAddresses['SENIOR_TRANCHE']) return
      return this.getCurrencyAllowance(owner, this.contractAddresses['SENIOR_TRANCHE'])
    }

    getCurrencyBalance = async (user: string) => {
      return await this.toBN(this.contract('TINLAKE_CURRENCY').balanceOf(user))
    }

    getJuniorTokenBalance = async (user: string) => {
      return await this.toBN(this.contract('JUNIOR_TOKEN').balanceOf(user))
    }
    getSeniorTokenBalance = async (user: string) => {
      return await this.toBN(this.contract('SENIOR_TOKEN').balanceOf(user))
    }

    approveCurrency = async (usr: string, currencyAmount: string) => {
      const currencyContract = this.contract('TINLAKE_CURRENCY')
      return this.pending(currencyContract.approve(usr, currencyAmount, this.overrides))
    }

    approveSeniorForCurrency = async (currencyAmount: string) => {
      return this.approveCurrency(this.contract('SENIOR_TRANCHE').address, currencyAmount)
    }

    approveJuniorForCurrency = async (currencyAmount: string) => {
      return this.approveCurrency(this.contract('JUNIOR_TRANCHE').address, currencyAmount)
    }

    approveJuniorForToken = async (tokenAmount: string) => {
      const tokenContract = this.contract('JUNIOR_TOKEN')
      return this.pending(tokenContract.approve(this.contractAddresses['JUNIOR_TRANCHE'], tokenAmount, this.overrides))
    }

    approveSeniorForToken = async (tokenAmount: string) => {
      const tokenContract = this.contract('SENIOR_TOKEN')
      return this.pending(tokenContract.approve(this.contractAddresses['SENIOR_TRANCHE'], tokenAmount, this.overrides))
    }
  }
}

export type ICurrencyActions = {
  mintCurrency(usr: string, amount: string): Promise<PendingTransaction>
  getCurrencyBalance(usr: string): Promise<BN>
  getCurrencyAllowance: (owner: string, spender: string) => Promise<BN>
  getJuniorForCurrencyAllowance: (owner: string) => Promise<BN | undefined>
  getSeniorForCurrencyAllowance: (owner: string) => Promise<BN | undefined>
  approveCurrency(usr: string, amount: string): Promise<PendingTransaction>
  approveSeniorForCurrency: (currencyAmount: string) => Promise<PendingTransaction>
  approveJuniorForCurrency: (currencyAmount: string) => Promise<PendingTransaction>
  approveSeniorForToken: (tokenAmount: string) => Promise<PendingTransaction>
  approveJuniorForToken: (tokenAmount: string) => Promise<PendingTransaction>
  getJuniorTokenBalance(usr: string): Promise<BN>
  getSeniorTokenBalance(usr: string): Promise<BN>
}

export default CurrencyActions
