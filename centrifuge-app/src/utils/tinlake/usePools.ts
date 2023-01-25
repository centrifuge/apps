import { CurrencyBalance, Perquintill, Pool, PoolMetadata, Price, Rate, TokenBalance } from '@centrifuge/centrifuge-js'
import { useCentrifuge } from '@centrifuge/centrifuge-react'
import BN from 'bn.js'
import { BigNumber } from 'ethers'
import * as React from 'react'
import { useQuery } from 'react-query'
import { lastValueFrom } from 'rxjs'
import { ethConfig } from '../../config'
import { Dec } from '../Decimal'
import { Call, multicall } from './multicall'
import { Fixed27Base } from './ratios'
import {
  ActivePool,
  ArchivedPool,
  IpfsPools,
  LaunchingPool,
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
  return useQuery(['tinlakePools', !!ipfsPools], () => getPools(ipfsPools!), { enabled: !!ipfsPools, suspense })
}

// export type TinlakeMetadata = {
//   //// Do something with:
//   // "shortName": "GIG Pool",
//   // "slug": "gig-pool",
//   // "currencySymbol": "DAI",
//   // "maker": {
//   //   "ilk": "RWA010-A",
//   //   "minNonMakerDropShare": 0.25
//   // },
//   // "juniorInvestors": [
//   //   {
//   //     "name": "BlockTower Credit Partners, LP",
//   //     "address": "0x1bd5d6e5d95393a3175C56683B2cB9ddB3188fC1"
//   //   }
//   // ],
//   pool: {
//     name: string
//     icon: { uri: string; mime: string } | null
//     asset: { class: string }
//     issuer: {
//       name: string | undefined
//       description: string | undefined
//       email: string | undefined
//       logo: { uri: string; mime: string } | null
//     }
//     links: {
//       executiveSummary: { uri: string | undefined; mime: string }
//       forum: string | undefined
//       website: string | undefined
//     }
//     status: string
//     listed: boolean
//     tranches: {
//       [x: string]:
//         | { icon: { uri: string | undefined; mime: string }; minInitialInvestment?: undefined }
//         | { icon: { uri: string | undefined; mime: string }; minInitialInvestment: string }
//     }
//   }
// }

export type TinlakePool = Omit<Pool, 'metadata' | 'loanCollectionId' | 'tranches'> & {
  metadata: PoolMetadata
  tranches: (Omit<Pool['tranches'][0], 'poolMetadata'> & { poolMetadata: PoolMetadata })[]

  creditline: { available: CurrencyBalance; used: CurrencyBalance; unused: CurrencyBalance } | null
  addresses: {
    TINLAKE_CURRENCY: string
    ROOT_CONTRACT: string
    ACTIONS: string
    PROXY_REGISTRY: string
    COLLATERAL_NFT: string
    SENIOR_TOKEN: string
    JUNIOR_TOKEN: string
    CLERK?: string | undefined
    ASSESSOR: string
    RESERVE: string
    SENIOR_TRANCHE: string
    JUNIOR_TRANCHE: string
    FEED: string
    POOL_ADMIN?: string | undefined
    SENIOR_MEMBERLIST: string
    JUNIOR_MEMBERLIST: string
    COORDINATOR: string
    PILE: string
    MCD_VAT?: string | undefined
    MCD_JUG?: string | undefined
    MAKER_MGR?: string | undefined
  }
  versions?: { FEED?: number | undefined; POOL_ADMIN?: number | undefined } | undefined
  contractConfig?:
    | { JUNIOR_OPERATOR: 'ALLOWANCE_OPERATOR'; SENIOR_OPERATOR: 'ALLOWANCE_OPERATOR' | 'PROPORTIONAL_OPERATOR' }
    | undefined
  network: 'mainnet' | 'kovan' | 'goerli'
  version: 2 | 3
}

async function getPools(pools: IpfsPools): Promise<{ pools: TinlakePool[] }> {
  const toBN = (val: BigNumber) => new BN(val.toString())
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
        call: ['challengeTime()(uint256)'],
        returns: [[`${poolId}.epoch.challengeTime`, toNumber]],
      },
      {
        target: pool.addresses.COORDINATOR,
        call: ['challengeTime()(uint256)'],
        returns: [[`${poolId}.epoch.challengeTime`, toNumber]],
      },
      {
        target: pool.addresses.COORDINATOR,
        call: ['submissionPeriod()(bool)'],
        returns: [[`${poolId}.submissionPeriod`]],
      }
    )

    if (pool.addresses.CLERK !== undefined && pool.metadata.maker?.ilk !== '') {
      calls.push(
        {
          target: pool.addresses.CLERK,
          call: ['debt()(uint256)'],
          returns: [[`${poolId}.usedCreditline`, toCurrencyBalance]],
        },
        {
          target: pool.addresses.CLERK,
          call: ['remainingCredit()(uint)'],
          returns: [[`${poolId}.unusedCreditline`, toBN]],
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

  const [multicallData] = await Promise.all([
    // Apollo.getPools(pools),
    multicall<{ [key: string]: State }>(calls),
  ])

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

    // console.log(poolId)
    // console.log(
    //   `newReserve: ${parseFloat(state.reserve.toString()) / 10 ** 24}M + ${
    //     parseFloat(state.pendingSeniorInvestments.toString()) / 10 ** 24
    //   }M + ${parseFloat(state.pendingJuniorInvestments.toString()) / 10 ** 24}M - ${
    //     parseFloat(state.pendingSeniorRedemptions.toString()) / 10 ** 24
    //   }M - ${parseFloat(state.pendingJuniorRedemptions.toString()) / 10 ** 24}M`
    // )

    // console.log(
    //   ` - capacityGivenMaxReserve: ${parseFloat(state.maxReserve.toString()) / 10 ** 24}M - ${
    //     parseFloat(newReserve.toString()) / 10 ** 24
    //   }M- ${parseFloat((newUnusedCreditline || new BN(0)).toString()) / 10 ** 24}M`
    // )

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

    // console.log(` - oldSeniorDebt: ${parseFloat(state.seniorDebt.toString()) / 10 ** 24}M `)
    // console.log(` - newSeniorDebt: ${parseFloat(newSeniorDebt.toString()) / 10 ** 24}M `)
    // console.log(` - oldSeniorBalance: ${parseFloat(state.seniorBalance.toString()) / 10 ** 24}M `)
    // console.log(` - newSeniorBalance: ${parseFloat(newSeniorBalance.toString()) / 10 ** 24}M `)

    const newSeniorAsset = newSeniorDebt
      .add(newSeniorBalance)
      .add(state.pendingSeniorInvestments)
      .sub(state.pendingSeniorRedemptions)

    const newJuniorAsset = state.netAssetValue.add(newReserve).sub(newSeniorAsset)
    const maxPoolSize = newJuniorAsset
      .mul(Fixed27Base.mul(new BN(10).pow(new BN(6))).div(Fixed27Base.sub(state.maxSeniorRatio)))
      .div(new BN(10).pow(new BN(6)))

    // console.log(` - newJuniorAsset: ${parseFloat(newJuniorAsset.toString()) / 10 ** 24}M `)
    // console.log(
    //   ` - mul: ${Fixed27Base.mul(new BN(10).pow(new BN(6)))
    //     .div(Fixed27Base.sub(state.maxSeniorRatio))
    //     .toString()}`
    // )
    // console.log(` - maxPoolSize: ${parseFloat(maxPoolSize.toString()) / 10 ** 24}M `)

    const maxSeniorAsset = maxPoolSize.sub(newJuniorAsset)

    const capacityGivenMaxDropRatio = BN.max(new BN(0), maxSeniorAsset.sub(newSeniorAsset))

    // console.log(
    //   ` - capacityGivenMaxDropRatioPerPool: ${parseFloat(state.maxSeniorRatio.toString()) / 10 ** 27}% * (${
    //     parseFloat(state.netAssetValue.toString()) / 10 ** 24
    //   }M +  ${parseFloat(newReserve.toString()) / 10 ** 24}M) -  ${
    //     parseFloat(newSeniorAsset.toString()) / 10 ** 24
    //   }M`
    // )
    // console.log('\n\n')
    // console.log('\n\n')

    capacityPerPool[poolId] = BN.min(capacityGivenMaxReserve, capacityGivenMaxDropRatio)
    capacityGivenMaxReservePerPool[poolId] = capacityGivenMaxReserve
    capacityGivenMaxDropRatioPerPool[poolId] = capacityGivenMaxDropRatio
  })

  const currency = {
    decimals: 18,
    name: 'Dai',
    symbol: 'DAI',
    key: 'Dai',
    isPoolCurrency: false,
    isPermissioned: false,
  }

  const combined = pools.active.map((p) => {
    const id = p.addresses.ROOT_CONTRACT
    const data = multicallData[id]
    const capacity = new CurrencyBalance(capacityPerPool[id], 18)
    const capacityGivenMaxReserve = new CurrencyBalance(capacityGivenMaxReservePerPool[id], 18)
    const metadata: PoolMetadata = {
      //// Do something with:
      // "shortName": "GIG Pool",
      // "slug": "gig-pool",
      // "currencySymbol": "DAI",
      // "maker": {
      //   "ilk": "RWA010-A",
      //   "minNonMakerDropShare": 0.25
      // },
      // "juniorInvestors": [
      //   {
      //     "name": "BlockTower Credit Partners, LP",
      //     "address": "0x1bd5d6e5d95393a3175C56683B2cB9ddB3188fC1"
      //   }
      // ],
      pool: {
        name: p.metadata.name,
        icon: p.metadata.media?.icon ? { uri: p.metadata.media.icon, mime: 'image/svg' } : null,
        asset: {
          class: p.metadata.asset,
        },
        issuer: {
          name: p.metadata.attributes?.Issuer ?? '',
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
      riskGroups: [],
    }

    function getEpochStatus(): 'challengePeriod' | 'submissionPeriod' | 'ongoing' | 'executionPeriod' {
      if (new Date(data.epoch.challengePeriodEnd).getTime() === 0) {
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
      // loanCollectionId: string | null;
      currency,
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
          poolCurrency: currency,
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
          poolCurrency: currency,
        },
      ],
      epoch: {
        ...data.epoch,
        status: getEpochStatus(),
      },
      parameters: {
        minEpochTime: 24 * 60 * 60,
        challengeTime: 5 * 60,
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
    /*
interface PoolMetadataDetails {
  name: string
  shortName?: string
  slug: string
  description?: string
  media?: PoolMedia
  website?: string
  asset: string
  securitize?: SecuritizeData
  attributes?: { [key: string]: string | { [key: string]: string } }
  assetMaturity?: string
  currencySymbol?: string
  isUpcoming?: boolean
  isArchived?: boolean
  isLaunching?: boolean
  maker?: { ilk: string }
  issuerEmail?: string
  juniorInvestors?: JuniorInvestor[]
}
type P = {
  version?: number;
  pool: {
    name: string;
    icon: {
        uri: string;
        mime: string;
    } | null;
    asset: {
        class: string;
    };
    issuer: {
        name: string;
        description: string;
        email: string;
        logo?: {
            uri: string;
            mime: string;
        } | null;
    };
    links: {
        executiveSummary: {
            uri: string;
            mime: string;
        } | null;
        forum: string;
        website: string;
    };
    status: PoolStatus;
    listed: boolean;
  };
*/
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
    challengeTime: number
  }
  submissionPeriod: boolean
}
