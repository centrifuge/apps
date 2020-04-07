import { Constructor, TinlakeParams } from '../Tinlake';
import { executeAndRetry, waitAndReturnEvents } from '../services/ethereum';

function GovernanceActions<ActionsBase extends Constructor<TinlakeParams>>(Base: ActionsBase) {
  return class extends Base implements IGovernanceActions {

    relyAddress = async (usr: string, contractAddress: string) => {
      const rootContract = this.contracts['ROOT_CONTRACT'];
      const txHash = await executeAndRetry(rootContract.relyContract, [contractAddress, usr, this.ethConfig]);
      console.log(`[Rely usr ${usr}] txHash: ${txHash} on contract ${contractAddress}`);
      return waitAndReturnEvents(this.eth, txHash, rootContract.abi, this.transactionTimeout);
    }
  };
}

export type IGovernanceActions = {
  relyAddress(usr: string, contractAddress: string): Promise<any>,
};

export default GovernanceActions;
