import { Constructor, PendingTransaction, TinlakeParams } from '../Tinlake'

function GovernanceActions<ActionsBase extends Constructor<TinlakeParams>>(Base: ActionsBase) {
  return class extends Base implements IGovernanceActions {
    relyAddress = async (usr: string, contractAddress: string) => {
      const contract = this.contract('ROOT_CONTRACT')
      const tx = contract.relyContract(contractAddress, usr, this.overrides)
      return this.pending(tx)
    }
  }
}

export type IGovernanceActions = {
  relyAddress(usr: string, contractAddress: string): Promise<PendingTransaction>
}

export default GovernanceActions
