import Centrifuge, {
  CurrencyBalance,
  Perquintill,
  Pool,
  PoolMetadata,
  Price,
  Rate,
  TokenBalance,
} from '@centrifuge/centrifuge-js'
import { useCentrifuge, useEvmProvider } from '@centrifuge/centrifuge-react'
import { BigNumber } from '@ethersproject/bignumber'
import BN from 'bn.js'
import * as React from 'react'
import { useQuery } from 'react-query'
import { lastValueFrom } from 'rxjs'
import { ethConfig } from '../../config'
import { Dec } from '../Decimal'
import { currencies } from './currencies'
import { Call, multicall } from './multicall'
import { Fixed27Base } from './ratios'
import {
  ActivePool,
  ArchivedPool,
  IpfsPools,
  LaunchingPool,
  PoolMetadataDetails,
  TinlakeMetadataPool,
  UpcomingPool,
} from './types'

type Tranche = {
  availableFunds: BN
  tokenPrice: BN
  type: string
  token: string
  totalSupply: BN
  interestRate?: BN
}

export interface PoolTranche extends Tranche {
  pendingInvestments?: BN
  pendingRedemptions?: BN
  decimals?: number
  address?: string
  inMemberlist?: boolean
  effectiveBalance?: BN
  debt?: BN
  balance?: BN
  interestRate?: BN
  token: 'DROP' | 'TIN'
}

export interface RiskGroup {
  ceilingRatio: BN
  thresholdRatio: BN
  rate: {
    pie: BN
    chi: BN
    ratePerSecond: BN
    lastUpdated: BN
    fixedRate: BN
  }
  recoveryRatePD: BN
}

export interface WriteOffGroup {
  percentage: BN
  overdueDays: BN
}

export interface PoolData {
  junior: PoolTranche
  senior: PoolTranche
  maker?: any
  availableFunds: BN
  minJuniorRatio: BN
  currentJuniorRatio: BN
  netAssetValue: BN
  reserve: BN
  reserveAtLastEpochClose: BN
  maxJuniorRatio: BN
  maxReserve: BN
  totalPendingInvestments: BN
  totalRedemptionsCurrency: BN
  isPoolAdmin?: boolean
  adminLevel?: number
  reserveAndRemainingCredit?: BN
  discountRate: BN
  risk?: RiskGroup[]
  juniorInvestors?: { [key: string]: { collected: BN; uncollected: BN } }
  writeOffGroups?: WriteOffGroup[]
  isUpcoming: boolean
  isLaunching: boolean
  poolClosing?: boolean
}

export interface PoolsData {
  ongoingLoans: number
  totalFinancedCurrency: BN
  totalValue: BN
  pools: PoolData[]
}

export interface TinlakeLoanData {
  id: string
  borrowsAggregatedAmount: string
  debt: string
  financingDate: string | null
  index: number
  interestRatePerSecond: string
  maturityDate: string | null
  nftId: string
  pool: { id: string }
  repaysAggregatedAmount: string
  ceiling: string
  closed: number
  riskGroup: string
  owner: string
}

function parsePoolsMetadata(poolsMetadata: TinlakeMetadataPool[]): IpfsPools {
  const launching = poolsMetadata.filter((p): p is LaunchingPool => !!p.metadata.isLaunching)
  const active = poolsMetadata.filter(
    (p): p is ActivePool => !!('addresses' in p && p.addresses.ROOT_CONTRACT && !launching.includes(p))
  )
  const archived = poolsMetadata.filter((p): p is ArchivedPool => 'archivedValues' in p)
  const upcoming = poolsMetadata.filter((p): p is UpcomingPool => !('archivedValues' in p) && !('addresses' in p))

  return { active, upcoming, archived, launching }
}

function useIpfsPools(suspense = false) {
  // TODO get hash from registry
  const cent = useCentrifuge()
  const uri = ethConfig.poolsHash
  const { data } = useQuery(
    ['metadata', uri],
    async () => {
      const res = await lastValueFrom(cent.metadata.getMetadata(uri!))
      return res as { [key: string]: TinlakeMetadataPool }
    },
    {
      staleTime: Infinity,
      suspense,
    }
  )

  const parsed = React.useMemo(
    () => (data ? parsePoolsMetadata(Object.values(data) as TinlakeMetadataPool[]) : undefined),
    [data]
  )

  return parsed
}

export function useTinlakePools(suspense = false) {
  const ipfsPools = useIpfsPools(suspense)
  return useQuery(['tinlakePools', !!ipfsPools], () => getPools(ipfsPools!), {
    enabled: !!ipfsPools,
    staleTime: Infinity,
    suspense,
  })
}

export function useTinlakeLoans(poolId: string) {
  const tinlakePools = useTinlakePools()
  const provider = useEvmProvider()

  const pool = tinlakePools.data?.pools.find((p) => p.id === poolId)

  if (!pool) throw new Error(`Pool not found: ${poolId}`)

  const cent = useCentrifuge()

  return useQuery(['tinlakePools', pool], () => getTinlakeLoans(pool, cent, provider), {
    staleTime: Infinity,
    suspense: true,
  })
}

export type TinlakePool = Omit<Pool, 'metadata' | 'loanCollectionId' | 'tranches'> & {
  metadata: PoolMetadata
  tinlakeMetadata: PoolMetadataDetails
  tranches: (Omit<Pool['tranches'][0], 'poolMetadata'> & {
    poolMetadata: PoolMetadata
    pendingInvestments: CurrencyBalance
    pendingRedemptions: TokenBalance
  })[]

  creditline: { available: CurrencyBalance; used: CurrencyBalance; unused: CurrencyBalance } | null
  addresses: {
    TINLAKE_CURRENCY: string
    ROOT_CONTRACT: string
    ACTIONS: string
    PROXY_REGISTRY: string
    COLLATERAL_NFT: string
    SENIOR_TOKEN: string
    JUNIOR_TOKEN: string
    JUNIOR_OPERATOR: string
    SENIOR_OPERATOR: string
    CLERK?: string
    ASSESSOR: string
    RESERVE: string
    SENIOR_TRANCHE: string
    JUNIOR_TRANCHE: string
    FEED: string
    POOL_ADMIN?: string
    SENIOR_MEMBERLIST: string
    JUNIOR_MEMBERLIST: string
    COORDINATOR: string
    PILE: string
    MCD_VAT?: string
    MCD_JUG?: string
    MAKER_MGR?: string
    SHELF?: string
  }
  versions?: { FEED?: number; POOL_ADMIN?: number }
  contractConfig?: {
    JUNIOR_OPERATOR: 'ALLOWANCE_OPERATOR'
    SENIOR_OPERATOR: 'ALLOWANCE_OPERATOR' | 'PROPORTIONAL_OPERATOR'
  }

  network: 'mainnet' | 'kovan' | 'goerli'
  version: 2 | 3
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

function getTinlakeLoanStatus(loan: TinlakeLoanData) {
  if (loan.financingDate && loan.debt === '0') {
    return 'Closed'
  }
  if (!loan.financingDate) {
    return 'Created'
  }
  return 'Active'
}

async function getTinlakeLoans(pool: TinlakePool, cent: Centrifuge, provider: any) {
  const toBN = (val: BigNumber) => new BN(val.toString())

  const signer = provider!.getSigner()
  const connectedCent = cent.connectEvm(signer)

  const loans = 10

  const calls: Call[] = []

  for (let i = 0; i < loans; i += 1) {
    const riskGroupBefore = await connectedCent.tinlake.getRiskGroup(pool.addresses, pool.versions, i)

    const riskGroup = riskGroupBefore.toNumber()

    calls.push(
      {
        target: pool.addresses.SHELF!,
        call: ['shelf(uint256)(address,uint256)', i],
        returns: [[`registry${i}`], [`tokenId`, toBN]],
      },
      {
        target: pool.addresses.FEED,
        call: ['ceiling(uint256)(uint256)', i],
        returns: [[`principal${i}`, toBN]],
      },
      {
        target: pool.addresses.PILE,
        call: ['rates(uint256)(uint256,uint256,uint256,uint48,uint256)', riskGroup],
        returns: [
          [`rates${i}.pie`],
          [`rates${i}.chi`],
          [`interestRate${i}`, toBN],
          [`rates${i}.lastUpdated`],
          [`rates${i}.fixedRate`],
        ],
      },
      {
        target: pool.addresses.PILE,
        call: ['debt(uint256)(uint256)', i],
        returns: [[`debt${i}`, toBN]],
      },
      {
        target: pool.addresses.PILE,
        call: ['loanRates(uint256)(uint256)', i],
        returns: [[`rateGroup${i}`, (val: string) => Number(val.toString())]],
      },
      {
        target: pool.addresses.FEED,
        call: ['thresholdRatio(uint256)(uint256)', riskGroup],
        returns: [[`scoreCard${i}.thresholdRatio`, toBN]],
      },
      {
        target: pool.addresses.FEED!,
        call: ['ceilingRatio(uint256)(uint256)', riskGroup],
        returns: [[`scoreCard${i}.ceilingRatio`, toBN]],
      }
    )
  }

  console.log({ calls })

  const multicallData = await multicall<{ [key: string]: State }>(calls)

  console.log({ multicallData })

  // TODO: load data using multicall
  // const [nftData] = await Promise.all([getNFT(multicallData.registry, pool, multicallData.tokenId.toString())])

  // const nft = 'nft' in nftData ? nftData.nft : undefined

  // asset: {
  //   nftId: loan.nftId,
  //   collectionId: loan.pool.id,
  // },
  // id: loan.index.toString(),
  // originationDate: loan.financingDate ? new Date(Number(loan.financingDate) * 1000).toISOString() : null,
  // outstandingDebt: new CurrencyBalance(loan.debt, 18),
  // poolId: loan.pool.id,
  // pricing: {
  //   maturityDate: Number(loan.maturityDate) ? new Date(Number(loan.maturityDate) * 1000).toISOString() : null,
  //   interestRate: new Rate(
  //     new BN(loan.interestRatePerSecond).sub(new BN(10).pow(new BN(27))).mul(new BN(31536000))
  //   ),
  //   ceiling: new CurrencyBalance(loan.ceiling, 18),
  // },
  // status: getTinlakeLoanStatus(loan),
  // totalBorrowed: new CurrencyBalance(loan.borrowsAggregatedAmount, 18),
  // totalRepaid: new CurrencyBalance(loan.repaysAggregatedAmount, 18),
  // dateClosed: loan.closed ? new Date(Number(loan.closed) * 1000).toISOString() : 0,
  // riskGroup: loan.riskGroup,
  // owner: loan.owner,

  return multicallData
}

async function getPools(pools: IpfsPools): Promise<{ pools: TinlakePool[] }> {
  const toDateString = (val: BigNumber) => new Date(val.toNumber() * 1000).toISOString()
  const toNumber = (val: BigNumber) => val.toNumber()
  const toCurrencyBalance = (val: BigNumber) => new CurrencyBalance(val.toString(), 18)
  const toTokenBalance = (val: BigNumber) => new TokenBalance(val.toString(), 18)
  const toRate = (val: BigNumber) => new Rate(val.toString())
  const toPrice = (val: BigNumber) => new Price(val.toString())

  const calls: Call[] = []
  pools.active.forEach((pool) => {
    const poolId = pool.addresses.ROOT_CONTRACT
    calls.push(
      {
        target: pool.addresses.ASSESSOR,
        call: ['maxReserve()(uint256)'],
        returns: [[`${poolId}.maxReserve`, toCurrencyBalance]],
      },
      {
        target: pool.addresses.SENIOR_TRANCHE,
        call: ['totalSupply()(uint256)'],
        returns: [[`${poolId}.pendingSeniorInvestments`, toCurrencyBalance]],
      },
      {
        target: pool.addresses.SENIOR_TRANCHE,
        call: ['totalRedeem()(uint256)'],
        returns: [[`${poolId}.pendingSeniorRedemptions`, toTokenBalance]],
      },
      {
        target: pool.addresses.JUNIOR_TRANCHE,
        call: ['totalSupply()(uint256)'],
        returns: [[`${poolId}.pendingJuniorInvestments`, toCurrencyBalance]],
      },
      {
        target: pool.addresses.JUNIOR_TRANCHE,
        call: ['totalRedeem()(uint256)'],
        returns: [[`${poolId}.pendingJuniorRedemptions`, toCurrencyBalance]],
      },
      {
        target: pool.addresses.FEED,
        call: ['currentNAV()(uint256)'],
        returns: [[`${poolId}.netAssetValue`, toCurrencyBalance]],
      },
      {
        target: pool.addresses.ASSESSOR,
        call: ['maxSeniorRatio()(uint256)'],
        returns: [[`${poolId}.maxSeniorRatio`, toRate]],
      },
      {
        target: pool.addresses.ASSESSOR,
        call: ['seniorRatio()(uint256)'],
        returns: [[`${poolId}.seniorRatio`, toRate]],
      },
      {
        target: pool.addresses.ASSESSOR,
        call: ['seniorInterestRate()(uint256)'],
        returns: [[`${poolId}.seniorInterestRate`, toRate]],
      },
      {
        target: pool.addresses.COORDINATOR,
        call: ['poolClosing()(bool)'],
        returns: [[`${poolId}.poolClosing`]],
      },
      {
        target: pool.addresses.ASSESSOR,
        call: ['calcTokenPrices()(uint,uint)'],
        returns: [
          [`${poolId}.tokenPrices.0`, toPrice],
          [`${poolId}.tokenPrices.1`, toPrice],
        ],
      },
      {
        target: pool.addresses.JUNIOR_TOKEN,
        call: ['symbol()(string)'],
        returns: [[`${poolId}.juniorSymbol`]],
      },
      {
        target: pool.addresses.SENIOR_TOKEN,
        call: ['symbol()(string)'],
        returns: [[`${poolId}.seniorSymbol`]],
      },
      {
        target: pool.addresses.JUNIOR_TOKEN,
        call: ['totalSupply()(uint256)'],
        returns: [[`${poolId}.juniorIssuance`, toTokenBalance]],
      },
      {
        target: pool.addresses.SENIOR_TOKEN,
        call: ['totalSupply()(uint256)'],
        returns: [[`${poolId}.seniorIssuance`, toTokenBalance]],
      },
      {
        target: pool.addresses.COORDINATOR,
        call: ['lastEpochClosed()(uint256)'],
        returns: [[`${poolId}.epoch.lastClosed`, toDateString]],
      },
      {
        target: pool.addresses.COORDINATOR,
        call: ['currentEpoch()(uint256)'],
        returns: [[`${poolId}.epoch.current`, toNumber]],
      },
      {
        target: pool.addresses.COORDINATOR,
        call: ['lastEpochExecuted()(uint256)'],
        returns: [[`${poolId}.epoch.lastExecuted`, toNumber]],
      },
      {
        target: pool.addresses.COORDINATOR,
        call: ['minChallengePeriodEnd()(uint256)'],
        returns: [[`${poolId}.epoch.challengePeriodEnd`, toNumber]],
      },
      {
        target: pool.addresses.COORDINATOR,
        call: ['minimumEpochTime()(uint256)'],
        returns: [[`${poolId}.parameters.minEpochTime`, toNumber]],
      },
      {
        target: pool.addresses.COORDINATOR,
        call: ['challengeTime()(uint256)'],
        returns: [[`${poolId}.parameters.challengeTime`, toNumber]],
      },
      {
        target: pool.addresses.COORDINATOR,
        call: ['submissionPeriod()(bool)'],
        returns: [[`${poolId}.submissionPeriod`]],
      }
    )
    if (pool.addresses.CLERK !== undefined && pool.metadata.maker?.ilk) {
      calls.push(
        {
          target: pool.addresses.CLERK,
          call: ['debt()(uint)'],
          returns: [[`${poolId}.usedCreditline`, toCurrencyBalance]],
        },
        {
          target: pool.addresses.CLERK,
          call: ['remainingCredit()(uint256)'],
          returns: [[`${poolId}.unusedCreditline`, toCurrencyBalance]],
        },
        {
          target: pool.addresses.CLERK,
          call: ['creditline()(uint256)'],
          returns: [[`${poolId}.availableCreditline`, toCurrencyBalance]],
        },
        {
          target: pool.addresses.ASSESSOR,
          call: ['totalBalance()(uint256)'],
          returns: [[`${poolId}.reserve`, toTokenBalance]],
        },
        {
          target: pool.addresses.ASSESSOR,
          call: ['seniorDebt()(uint256)'],
          returns: [[`${poolId}.seniorDebt`, toCurrencyBalance]],
        },
        {
          target: pool.addresses.ASSESSOR,
          call: ['seniorBalance_()(uint256)'],
          returns: [[`${poolId}.seniorBalance`, toTokenBalance]],
        }
      )
    } else {
      calls.push(
        {
          target: pool.addresses.RESERVE,
          call: ['totalBalance()(uint256)'],
          returns: [[`${poolId}.reserve`, toTokenBalance]],
        },
        {
          target: pool.addresses.ASSESSOR,
          call: ['seniorDebt_()(uint256)'],
          returns: [[`${poolId}.seniorDebt`, toCurrencyBalance]],
        },
        {
          target: pool.addresses.ASSESSOR,
          call: ['seniorBalance_()(uint256)'],
          returns: [[`${poolId}.seniorBalance`, toTokenBalance]],
        }
      )
    }
  })

  const multicallData = await multicall<{ [key: string]: State }>(calls)

  const capacityPerPool: { [key: string]: BN } = {}
  const capacityGivenMaxReservePerPool: { [key: string]: BN } = {}
  const capacityGivenMaxDropRatioPerPool: { [key: string]: BN } = {}
  Object.keys(multicallData).forEach((poolId: string) => {
    const state = multicallData[poolId]

    // Investments will reduce the creditline and therefore reduce the senior debt
    const newUsedCreditline = state.unusedCreditline
      ? BN.max(
          new BN(0),
          (state.usedCreditline || new BN(0))
            .sub(state.pendingSeniorInvestments)
            .sub(state.pendingJuniorInvestments)
            .add(state.pendingSeniorRedemptions)
            .add(state.pendingJuniorRedemptions)
        )
      : new BN(0)

    const newUnusedCreditline = state.unusedCreditline ? state.availableCreditline?.sub(newUsedCreditline) : new BN(0)

    const newReserve = BN.max(
      new BN(0),
      state.reserve
        .add(state.pendingSeniorInvestments)
        .add(state.pendingJuniorInvestments)
        .sub(state.pendingSeniorRedemptions)
        .sub(state.pendingJuniorRedemptions)
        .sub(newUsedCreditline)
    )

    const capacityGivenMaxReserve = BN.max(
      new BN(0),
      state.maxReserve.sub(newReserve).sub(newUnusedCreditline || new BN(0))
    )

    // senior debt is reduced by any increase in the used creditline or increased by any decrease in the used creditline
    const newSeniorDebt = (state.usedCreditline || new BN(0)).gt(newUsedCreditline)
      ? state.seniorDebt.sub((state.usedCreditline || new BN(0)).sub(newUsedCreditline))
      : state.seniorDebt.add(newUsedCreditline.sub(state.usedCreditline || new BN(0)))

    // TODO: the change in senior balance should be multiplied by the mat here
    const newSeniorBalance = (state.usedCreditline || new BN(0)).gt(newUsedCreditline)
      ? state.seniorBalance.sub((state.usedCreditline || new BN(0)).sub(newUsedCreditline))
      : state.seniorBalance.add(newUsedCreditline.sub(state.usedCreditline || new BN(0)))

    const newSeniorAsset = newSeniorDebt
      .add(newSeniorBalance)
      .add(state.pendingSeniorInvestments)
      .sub(state.pendingSeniorRedemptions)

    const newJuniorAsset = state.netAssetValue.add(newReserve).sub(newSeniorAsset)
    const maxPoolSize = newJuniorAsset
      .mul(Fixed27Base.mul(new BN(10).pow(new BN(6))).div(Fixed27Base.sub(state.maxSeniorRatio)))
      .div(new BN(10).pow(new BN(6)))

    const maxSeniorAsset = maxPoolSize.sub(newJuniorAsset)

    const capacityGivenMaxDropRatio = BN.max(new BN(0), maxSeniorAsset.sub(newSeniorAsset))

    capacityPerPool[poolId] = BN.min(capacityGivenMaxReserve, capacityGivenMaxDropRatio)
    capacityGivenMaxReservePerPool[poolId] = capacityGivenMaxReserve
    capacityGivenMaxDropRatioPerPool[poolId] = capacityGivenMaxDropRatio
  })

  const combined = pools.active.map((p) => {
    const id = p.addresses.ROOT_CONTRACT
    const data = multicallData[id]
    const capacity = new CurrencyBalance(capacityPerPool[id], 18)
    const capacityGivenMaxReserve = new CurrencyBalance(capacityGivenMaxReservePerPool[id], 18)
    const metadata: PoolMetadata = {
      pool: {
        name: p.metadata.name,
        icon: p.metadata.media?.icon ? { uri: p.metadata.media.icon, mime: 'image/svg' } : null,
        asset: {
          class: p.metadata.asset,
        },
        newInvestmentsStatus: p.metadata.newInvestmentsStatus,
        issuer: {
          name: p.metadata.attributes?.Issuer ?? '',
          repName: p.metadata.description ?? '',
          description: p.metadata.description ?? '',
          email: p.metadata?.issuerEmail ?? '',
          logo: p.metadata.media?.logo
            ? {
                uri: p.metadata.media.logo,
                mime: '',
              }
            : null,
        },
        links: {
          executiveSummary: p.metadata?.attributes?.Links?.['Executive Summary']
            ? {
                uri: p.metadata.attributes.Links['Executive Summary'],
                mime: 'application/pdf',
              }
            : null,
          forum: p.metadata?.attributes?.Links?.['Forum Discussion'],
          website: p.metadata?.attributes?.Links?.['Website'],
        },
        status: 'open',
        listed: true,
      },
      tranches: {
        [`${id}-0`]: {
          icon: p.metadata?.media?.tin
            ? {
                uri: p.metadata.media.tin,
                mime: 'image/svg',
              }
            : null,
        },
        [`${id}-1`]: {
          icon: p.metadata?.media?.drop
            ? {
                uri: p.metadata.media.drop,
                mime: 'image/svg',
              }
            : null,
          minInitialInvestment: '5000000000000000000000',
        },
      },
      onboarding: {
        agreements: {
          [`${id}-0`]: {
            uri: p.metadata?.attributes?.Links?.['Agreements']?.[`${id}-0`] || '',
            mime: 'application/pdf',
          },
          [`${id}-1`]: {
            uri: p.metadata?.attributes?.Links?.['Agreements']?.[`${id}-1`] || '',
            mime: 'application/pdf',
          },
        },
      },
    }

    function getEpochStatus(): 'challengePeriod' | 'submissionPeriod' | 'ongoing' | 'executionPeriod' {
      const challengePeriodEnd = new Date(data.epoch.challengePeriodEnd).getTime()
      if (challengePeriodEnd !== 0) {
        if (challengePeriodEnd < Date.now()) return 'executionPeriod'
        return 'challengePeriod'
      }
      if (data.submissionPeriod) {
        return 'submissionPeriod'
      }
      return 'ongoing'
    }

    return {
      ...p,
      metadata,
      tinlakeMetadata: p.metadata,
      id,
      isTinlakePool: true,
      isClosing: data.poolClosing,
      capacity,
      capacityGivenMaxReserve,
      capacityGivenMaxDropRatio: new CurrencyBalance(capacityGivenMaxDropRatioPerPool[id], 18),
      value: new CurrencyBalance(data.reserve.add(data.netAssetValue), 18),
      reserve: {
        max: data.maxReserve,
        available: data.reserve,
        total: data.reserve,
      },
      nav: {
        latest: data.netAssetValue,
        lastUpdated: new Date().toISOString(),
      },
      createdAt: null,
      isInitialised: true,
      currency: currencies.DAI,
      tranches: [
        {
          index: 0,
          id: `${id}-0`,
          seniority: 0,
          balance: new TokenBalance(data.reserve.sub(data.seniorBalance), 18),
          minRiskBuffer: null,
          currentRiskBuffer: new Perquintill(0),
          interestRatePerSec: null,
          lastUpdatedInterest: new Date().toISOString(),
          ratio: Perquintill.fromFloat(Dec(1).sub(data.seniorRatio.toDecimal())),
          totalIssuance: data.juniorIssuance,
          tokenPrice: data.tokenPrices[0],
          capacity: capacityGivenMaxReserve,
          poolId: id,
          currency: {
            decimals: 18,
            name: `${p.metadata.name} Junior`,
            symbol: data.juniorSymbol,
            isPoolCurrency: true,
            isPermissioned: true,
            key: `tinlake-${id}-junior`,
          },
          poolMetadata: metadata,
          poolCurrency: currencies.DAI,
          pendingInvestments: data.pendingJuniorInvestments,
          pendingRedemptions: data.pendingJuniorRedemptions,
        },
        {
          index: 1,
          id: `${id}-1`,
          seniority: 1,
          balance: data.seniorBalance,
          minRiskBuffer: Rate.fromFloat(Dec(1).sub(data.maxSeniorRatio.toDecimal())),
          currentRiskBuffer: Rate.fromFloat(Dec(1).sub(data.seniorRatio.toDecimal())),
          interestRatePerSec: data.seniorInterestRate,
          lastUpdatedInterest: new Date().toISOString(),
          ratio: Perquintill.fromFloat(data.seniorRatio.toDecimal()),
          totalIssuance: data.seniorIssuance,
          tokenPrice: data.tokenPrices[1],
          capacity,
          poolId: id,
          currency: {
            decimals: 18,
            name: `${p.metadata.name} Senior`,
            symbol: data.seniorSymbol,
            isPoolCurrency: true,
            isPermissioned: true,
            key: `tinlake-${id}-senior`,
          },
          poolMetadata: metadata,
          poolCurrency: currencies.DAI,
          pendingInvestments: data.pendingSeniorInvestments,
          pendingRedemptions: data.pendingSeniorRedemptions,
        },
      ],
      epoch: {
        ...data.epoch,
        status: getEpochStatus(),
      },
      parameters: {
        ...data.parameters,
        maxNavAge: 5 * 60,
      },
      creditline: data.availableCreditline
        ? {
            available: data.availableCreditline,
            used: data.usedCreditline!,
            unused: data.unusedCreditline!,
          }
        : null,
    }
  })

  return { pools: combined }
}

interface State {
  maxReserve: CurrencyBalance
  reserve: CurrencyBalance
  pendingSeniorInvestments: CurrencyBalance
  pendingSeniorRedemptions: TokenBalance
  pendingJuniorInvestments: CurrencyBalance
  pendingJuniorRedemptions: TokenBalance
  netAssetValue: CurrencyBalance
  seniorDebt: CurrencyBalance
  seniorBalance: CurrencyBalance
  maxSeniorRatio: Rate
  seniorRatio: Rate
  seniorInterestRate: Rate
  usedCreditline?: CurrencyBalance
  availableCreditline?: CurrencyBalance
  unusedCreditline?: CurrencyBalance
  poolClosing: boolean
  tokenPrices: [Price, Price]
  juniorSymbol: string
  seniorSymbol: string
  juniorIssuance: TokenBalance
  seniorIssuance: TokenBalance
  epoch: {
    current: number
    lastClosed: string
    lastExecuted: number
    challengePeriodEnd: number
  }
  parameters: {
    challengeTime: number
    minEpochTime: number
  }
  submissionPeriod: boolean
}
