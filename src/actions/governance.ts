import { Constructor, TinlakeParams, PendingTransaction } from '../Tinlake'

function GovernanceActions<ActionsBase extends Constructor<TinlakeParams>>(Base: ActionsBase) {
  return class extends Base implements IGovernanceActions {
    relyAddress = async (usr: string, contractAddress: string) => {
      return this.pending(this.contract('ROOT_CONTRACT').relyContract(contractAddress, usr))
    }
  }
}

export type IGovernanceActions = {
  relyAddress(usr: string, contractAddress: string): Promise<PendingTransaction>
}

export default GovernanceActions
