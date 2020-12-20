import { Constructor, PendingTransaction, TinlakeParams } from '../Tinlake'

export function ClaimRADActions<ActionsBase extends Constructor<TinlakeParams>>(Base: ActionsBase) {
  return class extends Base implements IClaimRADActions {
    getClaimRADAddress = async (address: string) => {
      return await this.contract('TINLAKE_CLAIM_RAD').accounts(address)
    }

    updateClaimRADAddress = async (centAddress: string) => {
      return this.pending(this.contract('TINLAKE_CLAIM_RAD').update(centAddress, this.overrides))
    }
  }
}

export type IClaimRADActions = {
  getClaimRADAddress(address: string): Promise<string>
  updateClaimRADAddress(centAddress: string): Promise<PendingTransaction>
}

export default ClaimRADActions
