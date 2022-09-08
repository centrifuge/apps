import BN from 'bn.js'
import { BigNumber } from 'ethers'
import { useQuery } from 'react-query'
import { useIpfsPools } from '../components/IpfsPoolsProvider'
import config, { IpfsPools, Pool, PoolStatus } from '../config'
import Apollo from '../services/apollo'
import { Call, multicall } from './multicall'
import { Fixed27Base, UintBase } from './ratios'

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

export function usePools() {
  const ipfsPools = useIpfsPools()
  return useQuery(['pools'], () => getPools(ipfsPools))
}

async function getPools(ipfsPools: IpfsPools): Promise<PoolsData> {
  const toBN = (val: BigNumber) => new BN(val.toString())

  const calls: Call[] = []
  ipfsPools.active.forEach((pool: Pool) => {
    calls.push(
      {
        target: pool.addresses.ASSESSOR,
        call: ['maxReserve()(uint256)'],
        returns: [[`${pool.addresses.ROOT_CONTRACT}.maxReserve`, toBN]],
      },
      {
        target: pool.addresses.SENIOR_TRANCHE,
        call: ['totalSupply()(uint256)'],
        returns: [[`${pool.addresses.ROOT_CONTRACT}.pendingSeniorInvestments`, toBN]],
      },
      {
        target: pool.addresses.SENIOR_TRANCHE,
        call: ['totalRedeem()(uint256)'],
        returns: [[`${pool.addresses.ROOT_CONTRACT}.pendingSeniorRedemptions`, toBN]],
      },
      {
        target: pool.addresses.JUNIOR_TRANCHE,
        call: ['totalSupply()(uint256)'],
        returns: [[`${pool.addresses.ROOT_CONTRACT}.pendingJuniorInvestments`, toBN]],
      },
      {
        target: pool.addresses.JUNIOR_TRANCHE,
        call: ['totalRedeem()(uint256)'],
        returns: [[`${pool.addresses.ROOT_CONTRACT}.pendingJuniorRedemptions`, toBN]],
      },
      {
        target: pool.addresses.FEED,
        call: ['currentNAV()(uint256)'],
        returns: [[`${pool.addresses.ROOT_CONTRACT}.netAssetValue`, toBN]],
      },
      {
        target: pool.addresses.ASSESSOR,
        call: ['maxSeniorRatio()(uint256)'],
        returns: [[`${pool.addresses.ROOT_CONTRACT}.maxSeniorRatio`, toBN]],
      },
      {
        target: pool.addresses.ASSESSOR,
        call: ['seniorRatio()(uint256)'],
        returns: [[`${pool.addresses.ROOT_CONTRACT}.seniorRatio`, toBN]],
      },
      {
        target: pool.addresses.COORDINATOR,
        call: ['poolClosing()(bool)'],
        returns: [[`${pool.addresses.ROOT_CONTRACT}.poolClosing`]],
      }
    )

    if (pool.addresses.CLERK !== undefined && pool.metadata.maker?.ilk !== '') {
      calls.push(
        {
          target: pool.addresses.CLERK,
          call: ['debt()(uint)'],
          returns: [[`${pool.addresses.ROOT_CONTRACT}.usedCreditline`, toBN]],
        },
        {
          target: pool.addresses.CLERK,
          call: ['remainingCredit()(uint256)'],
          returns: [[`${pool.addresses.ROOT_CONTRACT}.unusedCreditline`, toBN]],
        },
        {
          target: pool.addresses.CLERK,
          call: ['creditline()(uint256)'],
          returns: [[`${pool.addresses.ROOT_CONTRACT}.availableCreditline`, toBN]],
        },
        {
          target: pool.addresses.ASSESSOR,
          call: ['totalBalance()(uint256)'],
          returns: [[`${pool.addresses.ROOT_CONTRACT}.reserve`, toBN]],
        },
        {
          target: pool.addresses.ASSESSOR,
          call: ['seniorDebt()(uint256)'],
          returns: [[`${pool.addresses.ROOT_CONTRACT}.seniorDebt`, toBN]],
        },
        {
          target: pool.addresses.ASSESSOR,
          call: ['seniorBalance_()(uint256)'],
          returns: [[`${pool.addresses.ROOT_CONTRACT}.seniorBalance`, toBN]],
        }
      )
    } else {
      calls.push(
        {
          target: pool.addresses.RESERVE,
          call: ['totalBalance()(uint256)'],
          returns: [[`${pool.addresses.ROOT_CONTRACT}.reserve`, toBN]],
        },
        {
          target: pool.addresses.ASSESSOR,
          call: ['seniorDebt_()(uint256)'],
          returns: [[`${pool.addresses.ROOT_CONTRACT}.seniorDebt`, toBN]],
        },
        {
          target: pool.addresses.ASSESSOR,
          call: ['seniorBalance_()(uint256)'],
          returns: [[`${pool.addresses.ROOT_CONTRACT}.seniorBalance`, toBN]],
        }
      )
    }
  })

  const [poolsData, multicallData] = await Promise.all([
    Apollo.getPools(ipfsPools),
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

  const poolsWithCapacity = poolsData.pools.map((pool: PoolData) => {
    const poolConfig = ipfsPools.active.find((p) => p.addresses.ROOT_CONTRACT.toLowerCase() === pool.id.toLowerCase())!
    if (pool.id in capacityPerPool) {
      const isUpcoming =
        pool.isUpcoming ||
        poolConfig.metadata.isUpcoming ||
        (!config.featureFlagNewOnboardingPools.includes(pool.id) && !pool.isLaunching)

      const capacity = capacityPerPool[pool.id]
      return {
        ...pool,
        capacity,
        isUpcoming: !!isUpcoming,
        isArchived: !!poolConfig.metadata.isArchived,
        order: isUpcoming ? -2 : pool.isOversubscribed || !capacity ? -1 : capacity.div(UintBase).toNumber(),
        capacityGivenMaxReserve: capacityGivenMaxReservePerPool[pool.id],
        capacityGivenMaxDropRatio: capacityGivenMaxDropRatioPerPool[pool.id],
        poolClosing: multicallData[pool.id].poolClosing,
      }
    }
    return pool
  })
  return { ...poolsData, pools: poolsWithCapacity }
}

interface State {
  maxReserve: BN
  reserve: BN
  pendingSeniorInvestments: BN
  pendingSeniorRedemptions: BN
  pendingJuniorInvestments: BN
  pendingJuniorRedemptions: BN
  netAssetValue: BN
  seniorDebt: BN
  seniorBalance: BN
  maxSeniorRatio: BN
  seniorRatio: BN
  usedCreditline?: BN
  availableCreditline?: BN
  unusedCreditline?: BN
  poolClosing: boolean
}
