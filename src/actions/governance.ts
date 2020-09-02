import { Constructor, TinlakeParams, PendingTransaction } from '../Tinlake'
import { executeAndRetry, waitAndReturnEvents } from '../services/ethereum'

function GovernanceActions<ActionsBase extends Constructor<TinlakeParams>>(Base: ActionsBase) {
  return class extends Base implements IGovernanceActions {
    relyAddress = async (usr: string, contractAddress: string) => {
      // const rootContract = this.contracts['ROOT_CONTRACT']
      // const txHash = await executeAndRetry(rootContract.relyContract, [contractAddress, usr, this.ethConfig])
      // console.log(`[Rely usr ${usr}] txHash: ${txHash} on contract ${contractAddress}`)
      // const result = await waitAndReturnEvents(this.eth, txHash, rootContract.abi, this.transactionTimeout)
      // console.log('ethjs result', result)

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
