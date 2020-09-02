import { Constructor, TinlakeParams, PendingTransaction } from '../Tinlake'

function GovernanceActions<ActionsBase extends Constructor<TinlakeParams>>(Base: ActionsBase) {
  return class extends Base implements IGovernanceActions {
    relyAddress = async (usr: string, contractAddress: string) => {
      console.log('usr', usr)
      console.log('contractAddress', contractAddress)
      const contract = this.contract('ROOT_CONTRACT')
      const tx = contract.relyContract(contractAddress, usr)
      return this.pending(tx)
    }
  }
}

export type IGovernanceActions = {
  relyAddress(usr: string, contractAddress: string): Promise<PendingTransaction>
}

export default GovernanceActions
