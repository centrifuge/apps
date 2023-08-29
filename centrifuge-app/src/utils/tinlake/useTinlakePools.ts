import {
  CurrencyBalance,
  Perquintill,
  Pool,
  PoolMetadata,
  Price,
  Rate,
  TinlakeLoan,
  TokenBalance,
} from '@centrifuge/centrifuge-js'
import { useCentrifuge } from '@centrifuge/centrifuge-react'
import { BigNumber } from '@ethersproject/bignumber'
import { Contract } from '@ethersproject/contracts'
import { InfuraProvider } from '@ethersproject/providers'
import BN from 'bn.js'
import * as React from 'react'
import { useQuery } from 'react-query'
import { lastValueFrom } from 'rxjs'
import { ethConfig } from '../../config'
import { Dec } from '../Decimal'
import feedv1Abi from './abis/NAVFeed_V1.abi.json'
import feedv2Abi from './abis/NAVFeed_V2.abi.json'
import feedv3Abi from './abis/NAVFeed_V3.abi.json'
import pileAbi from './abis/Pile.abi.json'
import { currencies } from './currencies'
import { Call, multicall } from './multicall'
import { Fixed27Base } from './ratios'
import {
  ActivePool,
  ArchivedPool,
  IpfsPools,
  LaunchingPool,
  PoolMetadataDetails,
  PoolStatus,
  TinlakeMetadataPool,
  UpcomingPool,
} from './types'

export interface PoolData {
  id: string
  name: string
  slug: string
  isUpcoming: boolean
  isArchived: boolean
  isLaunching: boolean
  isOversubscribed: boolean
  asset: string
  ongoingLoans: number
  totalDebt: BN
  totalDebtNum: number
  totalRepaysAggregatedAmount: BN
  totalRepaysAggregatedAmountNum: number
  weightedInterestRate: BN
  weightedInterestRateNum: number
  seniorInterestRate?: BN
  seniorInterestRateNum: number
  order?: number
  version: number
  totalFinancedCurrency: BN
  financingsCount?: number
  status?: PoolStatus
  reserve?: BN
  assetValue?: BN
  juniorYield14Days: BN | null
  seniorYield14Days: BN | null
  juniorYield30Days: BN | null
  seniorYield30Days: BN | null
  juniorYield90Days: BN | null
  seniorYield90Days: BN | null
  icon: string | null
  juniorTokenPrice?: BN | null
  seniorTokenPrice?: BN | null
  currency: string
  capacity?: BN
  capacityGivenMaxReserve?: BN
  capacityGivenMaxDropRatio?: BN
  shortName: string
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

export function useIpfsPools(suspense = false) {
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

  const pool = tinlakePools?.data?.pools?.find((p) => p.id.toLowerCase() === poolId.toLowerCase())

  return useQuery(
    ['tinlakePoolLoans', poolId, pool],
    async () => {
      const loans = await getTinlakeLoans(poolId)

      const writeOffPercentagePromises = loans.map(async (loan) => {
        if (pool) {
          const writeOffPercentage = await getWriteOffPercentage(pool, loan.index)

          if (writeOffPercentage.isZero()) {
            return {
              loanId: loan.index,
              percentage: '0',
            }
          }

          return {
            loanId: loan.index,
            percentage: writeOffPercentage.div(new BN(10).pow(new BN(25))).toString(),
          }
        }

        return {
          loanId: loan.index,
          percentage: '0',
        }
      })

      const writeOffPercentage = (await Promise.all(writeOffPercentagePromises)).reduce((acc, curr) => {
        acc[curr.loanId] = curr.percentage
        return acc
      }, {} as { [key: number]: string })

      return loans.map((loan) => ({
        asset: {
          nftId: loan.nftId,
          collectionId: loan.pool.id,
        },
        id: loan.index.toString(),
        originationDate: loan.financingDate ? new Date(Number(loan.financingDate) * 1000).toISOString() : null,
        outstandingDebt: new CurrencyBalance(loan.debt, 18),
        poolId: loan.pool.id,
        pricing: {
          maturityDate: Number(loan.maturityDate) ? new Date(Number(loan.maturityDate) * 1000).toISOString() : null,
          interestRate: new Rate(
            new BN(loan.interestRatePerSecond).sub(new BN(10).pow(new BN(27))).mul(new BN(31536000))
          ),
          ceiling: new CurrencyBalance(loan.ceiling, 18),
        },
        status: getTinlakeLoanStatus(loan, writeOffPercentage[loan.index]),
        writeOffPercentage: writeOffPercentage[loan.index],
        totalBorrowed: new CurrencyBalance(loan.borrowsAggregatedAmount, 18),
        totalRepaid: new CurrencyBalance(loan.repaysAggregatedAmount, 18),
        dateClosed: loan.closed ? new Date(Number(loan.closed) * 1000).toISOString() : 0,
        riskGroup: loan.riskGroup,
        owner: loan.owner,
      })) as TinlakeLoan[]
    },
    {
      enabled: !!pool && !!poolId && !!poolId.startsWith('0x'),
      staleTime: Infinity,
      suspense: true,
    }
  )
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
    CLAIM_CFG: string
    MCD_VAT?: string
    MCD_JUG?: string
    MAKER_MGR?: string
  }
  versions?: { FEED?: number; POOL_ADMIN?: number }
  contractConfig?: {
    JUNIOR_OPERATOR: 'ALLOWANCE_OPERATOR'
    SENIOR_OPERATOR: 'ALLOWANCE_OPERATOR' | 'PROPORTIONAL_OPERATOR'
  }

  network: 'mainnet' | 'kovan' | 'goerli'
  version: 2 | 3
}

function getTinlakeLoanStatus(loan: TinlakeLoanData, writeOffPercentage: string) {
  if (loan.financingDate && (loan.debt === '0' || writeOffPercentage === '100')) {
    return 'Closed'
  }
  if (!loan.financingDate) {
    return 'Created'
  }
  return 'Active'
}

// TODO: refactor to use multicall instead of subgraph
async function getTinlakeLoans(poolId: string) {
  let pools: {
    loans: unknown[]
  }[] = []

  const response = await fetch(import.meta.env.REACT_APP_TINLAKE_SUBGRAPH_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      query: `
        query GetLoansByPoolId($poolId: String!) {
          pools (where: { id_in: [$poolId]}) {
            loans (first: 1000) {
              nftId
              id
              index
              financingDate
              debt
              pool {
                id
              }
              maturityDate
              interestRatePerSecond
              borrowsAggregatedAmount
              repaysAggregatedAmount
              ceiling
              closed
              riskGroup
              owner
            }
          }
        }
      `,
      variables: {
        poolId: poolId.toLowerCase(),
      },
    }),
  })

  if (response?.ok) {
    const { data, errors } = await response.json()
    if (errors?.length) {
      throw new Error(`Issue fetching loans for Tinlake pool ${poolId}. Errors: ${errors}`)
    }
    pools = data.pools
  } else {
    throw new Error(`Issue fetching loans for Tinlake pool ${poolId}. Status: ${response?.status}`)
  }

  const loans = pools.reduce((assets: any[], pool: any) => {
    if (pool.loans) {
      assets.push(...pool.loans)
    }
    return assets
  }, [])

  return loans
}

async function getWriteOffGroups(pool: TinlakePool) {
  const feedAbi = pool.versions?.FEED === 2 ? feedv2Abi : feedv3Abi
  const provider = new InfuraProvider()

  const navFeed = new Contract(pool.addresses.FEED, feedAbi, provider)

  const groups = []
  let i = 0
  const maxWriteOffGroups = 100
  while (i < maxWriteOffGroups) {
    try {
      const group = await navFeed.writeOffGroups(i)
      groups.push(group)
      i += 1
    } catch (e) {
      return groups
    }
  }
  return groups
}

export async function getWriteOffPercentage(pool: TinlakePool, loanId: number): Promise<BN> {
  const feedAbi = (() => {
    if (pool.versions?.FEED === 2) {
      return feedv2Abi
    }
    if (pool.versions?.FEED === 3) {
      return feedv3Abi
    }
    return feedv1Abi
  })()

  const provider = new InfuraProvider()
  const pile = new Contract(pool.addresses.PILE, pileAbi, provider)
  const navFeed = new Contract(pool.addresses.FEED, feedAbi, provider)

  const loanRate = await pile.loanRates(loanId)

  if (loanRate.lt(1000)) {
    return new BN(0)
  }

  if (navFeed.writeOffs) {
    const writeOffGroup = loanRate.sub(1000)
    const { percentage } = await navFeed.writeOffs(writeOffGroup.toString())

    return Rate.fromFloat(1).sub(new BN(percentage.toString()))
  } else if (navFeed.writeOffGroups) {
    const writeOffGroups = await getWriteOffGroups(pool)
    let { percentage } = writeOffGroups[loanRate.sub(1000).toNumber()]
    if (percentage) {
      percentage = Rate.fromFloat(1).sub(new BN(percentage.toString()))

      return percentage
    }

    return new BN(0)
  }

  return new BN(0)
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
    try {
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
        .mul(Fixed27Base.mul(new BN(10).pow(new BN(6))).div(Fixed27Base.sub(state?.maxSeniorRatio)))
        .div(new BN(10).pow(new BN(6)))

      const maxSeniorAsset = maxPoolSize.sub(newJuniorAsset)

      const capacityGivenMaxDropRatio = BN.max(new BN(0), maxSeniorAsset.sub(newSeniorAsset))

      capacityPerPool[poolId] = BN.min(capacityGivenMaxReserve, capacityGivenMaxDropRatio)
      capacityGivenMaxReservePerPool[poolId] = capacityGivenMaxReserve
      capacityGivenMaxDropRatioPerPool[poolId] = capacityGivenMaxDropRatio
    } catch (e) {
      console.error(e)
    }
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
        tranches: {
          [`${id}-0`]: {
            agreement: {
              uri: p.metadata?.attributes?.Links?.['Agreements']?.[`${id}-0`] || '',
              mime: 'application/pdf',
            },
            openForOnboarding: p.metadata.newInvestmentsStatus.junior === 'open',
          },
          [`${id}-1`]: {
            agreement: {
              uri: p.metadata?.attributes?.Links?.['Agreements']?.[`${id}-1`] || '',
              mime: 'application/pdf',
            },
            openForOnboarding: p.metadata.newInvestmentsStatus.senior === 'open',
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
          minRiskBuffer: Rate.fromFloat(Dec(1).sub(data.maxSeniorRatio.toDecimal() || Dec(0))),
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
