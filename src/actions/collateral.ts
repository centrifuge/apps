import { Constructor, Tinlake  } from '../types';
import { waitAndReturnEvents, executeAndRetry } from '../ethereum';
import BN from 'bn.js';

export function CollateralActions<ActionsBase extends Constructor<Tinlake>>(Base: ActionsBase) {
  return class extends Base implements ICollateralActions {

    mintTitleNFT = async (user: string) => {
      const txHash = await executeAndRetry(this.contracts['COLLATERAL_NFT'].issue, [user, this.ethConfig]);
      console.log(`[Mint NFT] txHash: ${txHash}`);
      const res: any = await waitAndReturnEvents(this.eth, txHash, this.contracts['COLLATERAL_NFT'].abi, this.transactionTimeout);
      return res.events[0].data[2].toString()
    }

    mintNFT = async (owner: string, tokenId: string, ref: string, amount: string, asset:string) => {
      const txHash = await executeAndRetry(this.contracts['COLLATERAL_NFT'].mint, [owner, tokenId, ref, amount, asset, this.ethConfig]);
      console.log(`[NFT.mint] txHash: ${txHash}`);
      return waitAndReturnEvents(this.eth, txHash, this.contracts['COLLATERAL_NFT'].abi, this.transactionTimeout);
    };

    approveNFT = async (tokenId: string, to: string) => {
      const txHash = await executeAndRetry(this.contracts['COLLATERAL_NFT'].approve, [to, tokenId, this.ethConfig]);
      console.log(`[NFT Approve] txHash: ${txHash}`);
      return waitAndReturnEvents(this.eth, txHash, this.contracts['COLLATERAL_NFT'].abi, this.transactionTimeout);
    }

    getNFTCount = async (): Promise<BN> => {
      const res : { 0: BN } = await executeAndRetry(this.contracts['COLLATERAL_NFT'].count, []);
      return res[0];
    }

    getNFTData = async (tokenId: string): Promise<any> => {
      const res = await executeAndRetry(this.contracts['COLLATERAL_NFT_DATA'].data, [tokenId]);
      return res;
    }

    getNFTOwner = async (tokenId: string): Promise<BN> => {
      const res : { 0: BN } = await executeAndRetry(this.contracts['COLLATERAL_NFT'].ownerOf, [tokenId]);
      return res[0];
    }

    transferNFT = async (from: string, to: string, tokenId: string) => {
      const txHash = await executeAndRetry(this.contracts['COLLATERAL_NFT'].transferFrom, [from, to, tokenId, this.ethConfig]);
      console.log(`[NFT Approve] txHash: ${txHash}`);
      return waitAndReturnEvents(this.eth, txHash, this.contracts['COLLATERAL_NFT'].abi, this.transactionTimeout);
    }
  };
}

export type ICollateralActions = {
  mintTitleNFT(usr: string): Promise<any>,
  mintNFT(owner: string, tokenId: string, ref: string, amount: string, asset:string): Promise<any>,
  approveNFT(tokenId: string, to: string) : Promise<any>,
  getNFTCount(): Promise<BN>,
  getNFTData(tokenId: string): Promise<any>,
  getNFTOwner(tokenId: string): Promise<BN>,
  transferNFT (from: string, to: string, tokenId: string): Promise<any>
};

export default CollateralActions;
