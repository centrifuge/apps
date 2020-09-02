import { Constructor, TinlakeParams, PendingTransaction } from '../Tinlake'
import { ethers } from 'ethers'

export function BorrowerActions<ActionsBase extends Constructor<TinlakeParams>>(Base: ActionsBase) {
  return class extends Base implements IBorrowerActions {
    issue = async (registry: string, tokenId: string) => {
      return this.pending(this.contract('SHELF').issue(registry, tokenId))
    }

    nftLookup = async (registry: string, tokenId: string) => {
      const nft = ethers.utils.solidityKeccak256(['address', 'uint'], [registry, tokenId])
      const loanId = await this.contract('SHELF').nftlookup(nft)
      return loanId
    }

    lock = async (loan: string) => {
      return this.pending(this.contract('SHELF').lock(loan))
    }

    unlock = async (loan: string) => {
      return this.pending(this.contract('SHELF').unlock(loan))
    }

    close = async (loan: string) => {
      return this.pending(this.contract('SHELF').close(loan))
    }

    borrow = async (loan: string, currencyAmount: string) => {
      return this.pending(this.contract('SHELF').borrow(loan, currencyAmount))
    }

    withdraw = async (loan: string, currencyAmount: string, usr: string) => {
      return this.pending(this.contract('SHELF').withdraw(loan, currencyAmount, usr))
    }

    repay = async (loan: string, currencyAmount: string) => {
      return this.pending(this.contract('SHELF').repay(loan, currencyAmount))
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
