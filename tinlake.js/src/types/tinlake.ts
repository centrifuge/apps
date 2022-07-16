import BN from 'bn.js'
import { TinlakeActions } from '../actions'
import Tinlake, { ContractAbis, ContractAddresses, Contracts, ContractVersions, PendingTransaction } from '../Tinlake'

export type ScoreCard = {
  thresholdRatio: BN
  ceilingRatio: BN
  interestRate: BN
  recoveryRatePD: BN
}

export type Loan = {
  loanId: string
  registry: string
  tokenId: BN
  ownerOf: string
  principal: BN
  interestRate: BN
  debt: BN
  threshold?: BN
  price?: BN
  status?: string
  nft?: NFT
  proxyOwner?: string
  riskGroup?: number
  scoreCard?: ScoreCard
  maturityDate?: number
  financingDate?: number
  borrowsAggregatedAmount?: BN
  repaysAggregatedAmount?: BN
  borrower?: string
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

interface RSV {
  r: string
  s: string
  v: number
}

export type DaiPermitMessage = RSV & {
  holder: string
  spender: string
  nonce: number
  expiry: number | string
  allowed?: boolean
}

export type ERC2612PermitMessage = RSV & {
  owner: string
  spender: string
  value: number | string
  nonce: number | string
  deadline: number | string
}

export type PermitMessage = DaiPermitMessage | ERC2612PermitMessage

export type ITinlake = TinlakeActions & Tinlake
export { PendingTransaction, ContractAddresses, ContractVersions, ContractAbis, Contracts }
