import { Constructor, TinlakeParams, PendingTransaction } from '../Tinlake'
import { waitAndReturnEvents, executeAndRetry } from '../services/ethereum'
import BN from 'bn.js'

export function CollateralActions<ActionsBase extends Constructor<TinlakeParams>>(Base: ActionsBase) {
  return class extends Base implements ICollateralActions {
    mintTitleNFT = async (nftAddr: string, user: string) => {
      const nft: any = this.eth.contract(this.contractAbis['COLLATERAL_NFT']).at(nftAddr)
      const txHash = await executeAndRetry(nft.issue, [user, this.ethConfig])
      console.log(`[Mint NFT] txHash: ${txHash}`)
      const res: any = await waitAndReturnEvents(
        this.eth,
        txHash,
        this.contractAbis['COLLATERAL_NFT'],
        this.transactionTimeout
      )
      return res.events[0].data[2].toString()
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
      return this.pending(nft.mint(owner, tokenId, ref, amount, asset))
    }

    approveNFT = async (nftAddress: string, tokenId: string, to: string) => {
      const nft = this.contract('COLLATERAL_NFT', nftAddress)
      return this.pending(nft.approve(to, tokenId))
    }

    setNFTApprovalForAll = async (nftAddress: string, to: string, approved: boolean) => {
      const nft = this.contract('COLLATERAL_NFT', nftAddress)
      return this.pending(nft.setApprovalForAll(to, approved))
    }

    isNFTApprovedForAll = async (nftAddress: string, owner: string, operator: string) => {
      return this.contract('COLLATERAL_NFT', nftAddress).isApprovedForAll(owner, operator)
    }

    getNFTCount = async (nftAddr: string): Promise<BN> => {
      const nft: any = this.eth.contract(this.contractAbis['COLLATERAL_NFT']).at(nftAddr)
      const res: { 0: BN } = await executeAndRetry(nft.count, [])
      return res[0]
    }

    getNFTData = async (nftAddress: string, tokenId: string): Promise<any> => {
      return this.contract('COLLATERAL_NFT', nftAddress).data(tokenId)
    }

    getNFTOwner = async (nftAddresss: string, tokenId: string): Promise<BN> => {
      return this.contract('COLLATERAL_NFT', nftAddresss).ownerOf(tokenId)
    }

    transferNFT = async (nftAddress: string, from: string, to: string, tokenId: string) => {
      const nft: any = this.eth.contract(this.contractAbis['COLLATERAL_NFT']).at(nftAddress)
      const txHash = await executeAndRetry(nft.transferFrom, [from, to, tokenId, this.ethConfig])
      console.log(`[NFT Approve] txHash: ${txHash}`)
      return waitAndReturnEvents(this.eth, txHash, this.contractAbis['COLLATERAL_NFT'], this.transactionTimeout)
    }
  }
}

export type ICollateralActions = {
  mintTitleNFT(nftAddr: string, usr: string): Promise<any>
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
  getNFTOwner(nftAddr: string, tokenId: string): Promise<BN>
  transferNFT(nftAddr: string, from: string, to: string, tokenId: string): Promise<any>
}

export default CollateralActions
