import { Constructor, TinlakeParams, PendingTransaction } from '../Tinlake'
import { ethers } from 'ethers'

export function BorrowerActions<ActionsBase extends Constructor<TinlakeParams>>(Base: ActionsBase) {
  return class extends Base implements IBorrowerActions {
    issue = async (registry: string, tokenId: string) => {
      return this.pending(this.contract('SHELF').issue(registry, tokenId, this.overrides))
    }

    nftLookup = async (registry: string, tokenId: string) => {
      const nft = ethers.utils.solidityKeccak256(['address', 'uint'], [registry, tokenId])
      const loanId = await this.contract('SHELF').nftlookup(nft)
      return loanId
    }

    lock = async (loan: string) => {
      return this.pending(this.contract('SHELF').lock(loan, this.overrides))
    }

    unlock = async (loan: string) => {
      return this.pending(this.contract('SHELF').unlock(loan, this.overrides))
    }

    close = async (loan: string) => {
      return this.pending(this.contract('SHELF').close(loan, this.overrides))
    }

    borrow = async (loan: string, currencyAmount: string) => {
      return this.pending(this.contract('SHELF').borrow(loan, currencyAmount, this.overrides))
    }

    withdraw = async (loan: string, currencyAmount: string, usr: string) => {
      return this.pending(this.contract('SHELF').withdraw(loan, currencyAmount, usr, this.overrides))
    }

    repay = async (loan: string, currencyAmount: string) => {
      return this.pending(this.contract('SHELF').repay(loan, currencyAmount, this.overrides))
    }
  }
}

export type IBorrowerActions = {
  issue(registry: string, tokenId: string): Promise<PendingTransaction>
  nftLookup(registry: string, tokenId: string): Promise<string>
  lock(loan: string): Promise<PendingTransaction>
  unlock(loan: string): Promise<PendingTransaction>
  close(loan: string): Promise<PendingTransaction>
  borrow(loan: string, currencyAmount: string): Promise<PendingTransaction>
  withdraw(loan: string, currencyAmount: string, usr: string): Promise<PendingTransaction>
  repay(loan: string, currencyAmount: string): Promise<PendingTransaction>
}

export default BorrowerActions
