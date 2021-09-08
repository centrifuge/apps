import { ITinlake, Loan, NFT } from '@centrifuge/tinlake-js'
import BN from 'bn.js'
import { BigNumber } from 'ethers'
import { useQuery } from 'react-query'
import { useIpfsPools } from '../components/IpfsPoolsProvider'
import Apollo from '../services/apollo'
import { initTinlake } from '../services/tinlake'
import { getNFT } from '../services/tinlake/actions'
import { Call, multicall } from './multicall'
const web3 = require('web3-utils')

const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000'

// SortableLoan adds properties of number type that support sorting in numerical order for grommet DataTable
export interface SortableLoan extends Loan {
  amountNum: number
  debtNum: number
  principalNum: number
  interestRateNum: number
  borrowsAggregatedAmountNum: number
  repaysAggregatedAmountNum: number
}

interface MulticallData {
  registry: string
  tokenId: BN
  principal: BN
  interestRate: BN
  debt: BN
  threshold: BN
  price: BN
  scoreCard: {
    thresholdRatio: BN
    ceilingRatio: BN
    interestRate: BN
    recoveryRatePD: BN
  }
}

export interface Asset extends MulticallData {
  loanId: string
  riskGroup: number
  status?: string
  nft?: NFT
  borrower?: string
  proxyOwner: BN
  ownerOf: string
  maturityDate?: number
}

export function useAsset(poolId: string, loanId: string) {
  const ipfsPools = useIpfsPools()
  const query = useQuery(['asset', poolId, loanId], () => {
    const pool = ipfsPools.active.find((p) => p.addresses.ROOT_CONTRACT.toLowerCase() === poolId.toLowerCase())
    const tinlake = initTinlake({ addresses: pool?.addresses, contractConfig: pool?.contractConfig })
    return getAsset(tinlake, loanId)
  })

  return query
}

async function getAsset(tinlake: ITinlake, loanId: string): Promise<Asset> {
  if (loanId === '0') throw new Error('Loan not found')

  // TODO: load riskGroup using multicall
  const riskGroup = (await tinlake.getRiskGroup(loanId)).toNumber()

  const toBN = (val: BigNumber) => new BN(val.toString())

  const calls: Call[] = [
    {
      target: tinlake.contractAddresses.SHELF!,
      call: ['shelf(uint256)(address,uint256)', loanId],
      returns: [[`registry`], [`tokenId`, toBN]],
    },
    {
      target: tinlake.contractAddresses.FEED!,
      call: ['ceiling(uint256)(uint256)', loanId],
      returns: [[`principal`, toBN]],
    },
    {
      target: tinlake.contractAddresses.PILE!,
      call: ['rates(uint256)(uint256,uint256,uint256,uint48,uint256)', riskGroup],
      returns: [[`rates.pie`], [`rates.chi`], [`interestRate`, toBN], [`rates.lastUpdated`], [`rates.fixedRate`]],
    },
    {
      target: tinlake.contractAddresses.PILE!,
      call: ['debt(uint256)(uint256)', loanId],
      returns: [[`debt`, toBN]],
    },
    {
      target: tinlake.contractAddresses.FEED!,
      call: ['thresholdRatio(uint256)(uint256)', riskGroup],
      returns: [[`scoreCard.thresholdRatio`, toBN]],
    },
    {
      target: tinlake.contractAddresses.FEED!,
      call: ['ceilingRatio(uint256)(uint256)', riskGroup],
      returns: [[`scoreCard.ceilingRatio`, toBN]],
    },
    {
      target: tinlake.contractAddresses.FEED!,
      call: ['recoveryRatePD(uint256)(uint256)', riskGroup],
      returns: [[`scoreCard.recoveryRatePD`, toBN]],
    },
  ]

  const [multicallData, ownerOf, proxyOwner] = await Promise.all([
    multicall<MulticallData>(calls),
    tinlake.getOwnerOfLoan(loanId),
    tinlake.getProxyOwnerByLoan(loanId),
  ])

  // TODO: load data using multicall
  const [ownerOfCollateral, proxy, nftData] = await Promise.all([
    tinlake.getOwnerOfCollateral(multicallData.registry, multicallData.tokenId.toString()),
    Apollo.getProxyOwner(ownerOf.toString().toLowerCase()),
    getNFT(multicallData.registry, tinlake, multicallData.tokenId.toString()),
  ])

  let status
  if (ownerOf === ZERO_ADDRESS) {
    status = 'closed'
  } else if (ownerOfCollateral.toString() === tinlake.contractAddresses.SHELF) {
    status = 'ongoing'
  } else {
    status = 'NFT locked'
  }

  const borrower = proxy?.owner ? web3.toChecksumAddress(proxy.owner) : undefined

  const nft = 'nft' in nftData ? nftData.nft : undefined

  return {
    loanId,
    riskGroup,
    status,
    nft,
    borrower,
    proxyOwner,
    ownerOf,
    maturityDate: nft?.maturityDate,
    ...multicallData,
  }
}
