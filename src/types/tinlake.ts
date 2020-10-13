import { TinlakeActions } from '../actions'
import BN from 'bn.js'
import Tinlake, { PendingTransaction, ContractAddresses, ContractAbis, Contracts } from '../Tinlake'

export type Loan = {
  loanId: string
  registry: string
  tokenId: BN
  ownerOf: BN
  principal: BN
  interestRate: BN
  debt: BN
  threshold?: BN
  price?: BN
  status?: string
  nft?: NFT
  proxyOwner?: string
  riskGroup?: number
}

export type Tranche = {
  availableFunds: BN
  tokenPrice: BN
  type: string
  token: string
  totalSupply: BN
  interestRate?: BN
}
export type NFT = {
  registry: string
  tokenId: BN
  nftOwner: string
  nftData: any
  maturityDate?: number
}
export type Investor = {
  junior: {
    maxSupply: BN
    tokenBalance: BN
  }
  senior: {
    maxSupply?: BN
    tokenBalance?: BN
  }
  address: string
}

export type ITinlake = TinlakeActions & Tinlake
export { PendingTransaction, ContractAddresses, ContractAbis, Contracts }
