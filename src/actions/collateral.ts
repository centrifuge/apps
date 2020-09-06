import { Constructor, TinlakeParams, PendingTransaction } from '../Tinlake'
import BN from 'bn.js'

export function CollateralActions<ActionsBase extends Constructor<TinlakeParams>>(Base: ActionsBase) {
  return class extends Base implements ICollateralActions {
    mintTitleNFT = async (nftAddr: string, user: string) => {
      // TODO: this is untested right now
      const collateralNft = this.contract('COLLATERAL_NFT', nftAddr)
      console.log(collateralNft)
      console.log(this.contract('COLLATERAL_NFT', nftAddr).functions)
      const tx = await this.contract('COLLATERAL_NFT', nftAddr).issue(user, this.overrides)
      const receipt = await this.getTransactionReceipt(tx)

      if (!(receipt.logs && receipt.logs[0])) {
        throw new Error('Event missing in collateralNft.issue(user) receipt')
      }

      const parsedLog = this.contract('PROXY_REGISTRY').interface.parseLog(receipt.logs[0])
      const nftId = parsedLog.values['2'].toString()
      return nftId
    }

    mintNFT = async (
      nftAddress: string,
      owner: string,
      tokenId: string,
      ref: string,
      amount: string,
      asset: string
    ) => {
      const nft = this.contract('COLLATERAL_NFT', nftAddress)
      return this.pending(nft.mint(owner, tokenId, ref, amount, asset, this.overrides))
    }

    approveNFT = async (nftAddress: string, tokenId: string, to: string) => {
      const nft = this.contract('COLLATERAL_NFT', nftAddress)
      return this.pending(nft.approve(to, tokenId, this.overrides))
    }

    setNFTApprovalForAll = async (nftAddress: string, to: string, approved: boolean) => {
      const nft = this.contract('COLLATERAL_NFT', nftAddress)
      return this.pending(nft.setApprovalForAll(to, approved, this.overrides))
    }

    isNFTApprovedForAll = async (nftAddress: string, owner: string, operator: string) => {
      return this.contract('COLLATERAL_NFT', nftAddress).isApprovedForAll(owner, operator)
    }

    getNFTCount = async (nftAddress: string): Promise<BN> => {
      return (await this.contract('COLLATERAL_NFT', nftAddress).count()).toBN()
    }

    getNFTData = async (nftAddress: string, tokenId: string): Promise<any> => {
      return this.contract('COLLATERAL_NFT', nftAddress).data(tokenId)
    }

    getNFTOwner = async (nftAddresss: string, tokenId: string): Promise<string> => {
      return this.contract('COLLATERAL_NFT', nftAddresss).ownerOf(tokenId)
    }

    transferNFT = async (nftAddress: string, from: string, to: string, tokenId: string) => {
      const nft = this.contract('COLLATERAL_NFT', nftAddress)
      return this.pending(nft.transferFrom(from, to, tokenId, this.overrides))
    }
  }
}

export type ICollateralActions = {
  mintTitleNFT(nftAddr: string, usr: string): Promise<string>
  mintNFT(
    nftAddr: string,
    owner: string,
    tokenId: string,
    ref: string,
    amount: string,
    asset: string
  ): Promise<PendingTransaction>
  approveNFT(nftAddr: string, tokenId: string, to: string): Promise<PendingTransaction>
  setNFTApprovalForAll(nftAddr: string, to: string, approved: boolean): Promise<PendingTransaction>
  isNFTApprovedForAll(nftAddr: string, owner: string, operator: string): Promise<boolean>
  getNFTCount(nftAddr: string): Promise<BN>
  getNFTData(nftAddr: string, tokenId: string): Promise<any>
  getNFTOwner(nftAddr: string, tokenId: string): Promise<string>
  transferNFT(nftAddr: string, from: string, to: string, tokenId: string): Promise<PendingTransaction>
}

export default CollateralActions
