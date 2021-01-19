import { Constructor, PendingTransaction, TinlakeParams } from '../Tinlake'

export function ClaimRADActions<ActionsBase extends Constructor<TinlakeParams>>(Base: ActionsBase) {
  return class extends Base implements IClaimRADActions {
    getClaimRADAccountID = async (address: string) => {
      return await this.contract('CLAIM_RAD').accounts(address)
    }

    updateClaimRADAccountID = async (centAddress: string) => {
      return this.pending(this.contract('CLAIM_RAD').update(centAddress, this.overrides))
    }
  }
}

export type IClaimRADActions = {
  getClaimRADAccountID(address: string): Promise<string>
  updateClaimRADAccountID(centAddress: string): Promise<PendingTransaction>
}

export default ClaimRADActions
