import { Constructor, PendingTransaction, TinlakeParams } from '../Tinlake'

export function ClaimCFGActions<ActionsBase extends Constructor<TinlakeParams>>(Base: ActionsBase) {
  return class extends Base implements IClaimCFGActions {
    getClaimCFGAccountID = async (address: string) => {
      return await this.contract('CLAIM_CFG').accounts(address)
    }

    updateClaimCFGAccountID = async (centAddress: string) => {
      return this.pending(this.contract('CLAIM_CFG').update(centAddress, this.overrides))
    }
  }
}

export type IClaimCFGActions = {
  getClaimCFGAccountID(address: string): Promise<string>
  updateClaimCFGAccountID(centAddress: string): Promise<PendingTransaction>
}

export default ClaimCFGActions
