import { Constructor, TinlakeParams } from '../Tinlake';
import { waitAndReturnEvents, executeAndRetry } from '../services/ethereum';
import BN from 'bn.js';

export function CollateralActions<ActionsBase extends Constructor<TinlakeParams>>(Base: ActionsBase) {
  return class extends Base implements ICollateralActions {

    mintTitleNFT = async (nftAddr: string, user: string) => {
      const nft: any = this.eth.contract(this.contractAbis['COLLATERAL_NFT']).at(nftAddr);
      const txHash = await executeAndRetry(nft.issue, [user, this.ethConfig]);
      console.log(`[Mint NFT] txHash: ${txHash}`);
      const res: any = await waitAndReturnEvents(this.eth, txHash, this.contracts['COLLATERAL_NFT'].abi, this.transactionTimeout);
      return res.events[0].data[2].toString();
    }

    mintNFT = async (nftAddr: string, owner: string, tokenId: string, ref: string, amount: string, asset:string) => {
      const nft: any = this.eth.contract(this.contractAbis['COLLATERAL_NFT']).at(nftAddr);
      const txHash = await executeAndRetry(nft.mint, [owner, tokenId, ref, amount, asset, this.ethConfig]);
      console.log(`[NFT.mint] txHash: ${txHash}`);
      return waitAndReturnEvents(this.eth, txHash, this.contracts['COLLATERAL_NFT'].abi, this.transactionTimeout);
    }

    approveNFT = async (nftAddr: string, tokenId: string, to: string) => {
      const nft: any = this.eth.contract(this.contractAbis['COLLATERAL_NFT']).at(nftAddr);
      const txHash = await executeAndRetry(nft.approve, [to, tokenId, this.ethConfig]);
      console.log(`[NFT Approve] txHash: ${txHash}`);
      return waitAndReturnEvents(this.eth, txHash, this.contracts['COLLATERAL_NFT'].abi, this.transactionTimeout);
    }

    getNFTCount = async (nftAddr: string): Promise<BN> => {
      const nft: any = this.eth.contract(this.contractAbis['COLLATERAL_NFT']).at(nftAddr);
      const res : { 0: BN } = await executeAndRetry(nft.count, []);
      return res[0];
    }

    getNFTData = async (nftAddr: string, tokenId: string): Promise<any> => {
      const nft: any = this.eth.contract(this.contractAbis['COLLATERAL_NFT']).at(nftAddr);
      const res = await executeAndRetry(nft.data, [tokenId]);
      return res;
    }

    getNFTOwner = async (nftAddr: string, tokenId: string): Promise<BN> => {
      const nft: any = this.eth.contract(this.contractAbis['COLLATERAL_NFT']).at(nftAddr);
      const res : { 0: BN } = await executeAndRetry(nft.ownerOf, [tokenId]);
      return res[0];
    }

    transferNFT = async (nftAddr: string, from: string, to: string, tokenId: string) => {
      const nft: any = this.eth.contract(this.contractAbis['COLLATERAL_NFT']).at(nftAddr);
      const txHash = await executeAndRetry(nft.transferFrom, [from, to, tokenId, this.ethConfig]);
      console.log(`[NFT Approve] txHash: ${txHash}`);
      return waitAndReturnEvents(this.eth, txHash, this.contracts['COLLATERAL_NFT'].abi, this.transactionTimeout);
    }
  };
}

export type  ICollateralActions = {
  mintTitleNFT(nftAddr:string, usr: string): Promise<any>,
  mintNFT(nftAddr:string, owner: string, tokenId: string, ref: string, amount: string, asset:string): Promise<any>,
  approveNFT(nftAddr:string, tokenId: string, to: string) : Promise<any>,
  getNFTCount(nftAddr:string): Promise<BN>,
  getNFTData(nftAddr:string, tokenId: string): Promise<any>,
  getNFTOwner(nftAddr:string, tokenId: string): Promise<BN>,
  transferNFT (nftAddr:string, from: string, to: string, tokenId: string): Promise<any>,
};

export default CollateralActions;
