import { Tranche } from '@centrifuge/tinlake-js'
import BN from 'bn.js'
import { BigNumber, ethers } from 'ethers'
import { useQuery } from 'react-query'
import { useSelector } from 'react-redux'
import { useIpfsPools } from '../components/IpfsPoolsProvider'
import config, { IpfsPools, JuniorInvestor } from '../config'
import { Call, multicall } from './multicall'
import { Fixed27Base, seniorToJuniorRatio } from './ratios'

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

export type EpochData = {
  id: number
  state: 'open' | 'can-be-closed' | 'in-submission-period' | 'in-challenge-period' | 'challenge-period-ended'
  isBlockedState: boolean
  minimumEpochTime: number
  challengeTime: number
  minimumEpochTimeLeft: number
  minChallengePeriodEnd: number
  lastEpochClosed: number
  latestBlockTimestamp: number
  seniorOrderedInEpoch: number
  juniorOrderedInEpoch: number
}

export function usePool(poolId?: string) {
  const ipfsPools = useIpfsPools()

  const address = useSelector<any, string | null>((state) => state.auth.address)
  const query = useQuery(['pool', poolId, address], () => getPool(ipfsPools, poolId!, address), { enabled: !!poolId })

  return query
}

export async function getPool(ipfsPools: IpfsPools, poolId: string, address?: string | null) {
  const pool = ipfsPools.active.find((p) => p.addresses.ROOT_CONTRACT.toLowerCase() === poolId.toLowerCase())

  if (!pool) throw new Error(`Pool not found: ${poolId}`)

  const ilk = pool?.metadata.maker?.ilk || ''
  const isMakerIntegrated = pool.addresses.CLERK !== undefined && ilk !== ''

  const toBN = (val: BigNumber) => new BN(val.toString())
  const calls: Call[] = [
    {
      target: pool.addresses.ASSESSOR,
      call: ['maxReserve()(uint256)'],
      returns: [[`maxReserve`, toBN]],
    },
    {
      target: pool.addresses.ASSESSOR,
      call: ['calcJuniorTokenPrice()(uint256)'],
      returns: [[`junior.tokenPrice`, toBN]],
    },
    {
      target: pool.addresses.ASSESSOR,
      call: ['calcSeniorTokenPrice()(uint256)'],
      returns: [[`senior.tokenPrice`, toBN]],
    },
    {
      target: pool.addresses.ASSESSOR,
      call: ['seniorBalance_()(uint256)'],
      returns: [[`senior.availableFunds`, toBN]],
    },
    {
      target: pool.addresses.RESERVE,
      call: ['totalBalance()(uint256)'],
      returns: [[`reserve`, toBN]],
    },
    {
      target: pool.addresses.COORDINATOR,
      call: ['epochReserve()(uint256)'],
      returns: [[`reserveAtLastEpochClose`, toBN]],
    },
    {
      target: pool.addresses.ASSESSOR,
      call: ['maxSeniorRatio()(uint256)'],
      returns: [[`minJuniorRatio`, (val: BigNumber) => seniorToJuniorRatio(toBN(val))]],
    },
    {
      target: pool.addresses.ASSESSOR,
      call: ['minSeniorRatio()(uint256)'],
      returns: [[`maxJuniorRatio`, (val: BigNumber) => seniorToJuniorRatio(toBN(val))]],
    },
    {
      target: pool.addresses.ASSESSOR,
      call: ['seniorRatio()(uint256)'],
      returns: [[`currentJuniorRatio`, (val: BigNumber) => seniorToJuniorRatio(toBN(val))]],
    },
    {
      target: pool.addresses.FEED,
      call: ['currentNAV()(uint256)'],
      returns: [[`netAssetValue`, toBN]],
    },
    {
      target: pool.addresses.SENIOR_TRANCHE,
      call: ['totalSupply()(uint256)'],
      returns: [[`senior.pendingInvestments`, toBN]],
    },
    {
      target: pool.addresses.SENIOR_TRANCHE,
      call: ['totalRedeem()(uint256)'],
      returns: [[`senior.pendingRedemptions`, toBN]],
    },
    {
      target: pool.addresses.JUNIOR_TRANCHE,
      call: ['totalSupply()(uint256)'],
      returns: [[`junior.pendingInvestments`, toBN]],
    },
    {
      target: pool.addresses.JUNIOR_TRANCHE,
      call: ['totalRedeem()(uint256)'],
      returns: [[`junior.pendingRedemptions`, toBN]],
    },
    {
      target: pool.addresses.SENIOR_TOKEN,
      call: ['totalSupply()(uint256)'],
      returns: [[`senior.totalSupply`, toBN]],
    },
    {
      target: pool.addresses.JUNIOR_TOKEN,
      call: ['totalSupply()(uint256)'],
      returns: [[`junior.totalSupply`, toBN]],
    },
    {
      target: pool.addresses.RESERVE,
      call: ['currencyAvailable()(uint256)'],
      returns: [[`availableFunds`, toBN]],
    },
    {
      target: pool.addresses.ASSESSOR,
      call: ['seniorInterestRate()(uint256)'],
      returns: [[`senior.interestRate`, toBN]],
    },
    {
      target: pool.addresses.SENIOR_TOKEN,
      call: ['symbol()(string)'],
      returns: [
        [
          `senior.token`,
          (symbol: string) => {
            if (!symbol || symbol.length === 0) {
              return `${pool.addresses['SENIOR_TOKEN']?.substr(2, 2).toUpperCase()}DRP`
            }
            return symbol
          },
        ],
      ],
    },
    {
      target: pool.addresses.JUNIOR_TOKEN,
      call: ['symbol()(string)'],
      returns: [
        [
          `junior.token`,
          (symbol: string) => {
            if (!symbol || symbol.length === 0) {
              return `${pool.addresses['JUNIOR_TOKEN']?.substr(2, 2).toUpperCase()}TIN`
            }
            return symbol
          },
        ],
      ],
    },
    {
      target: pool.addresses.SENIOR_TOKEN,
      call: ['decimals()(uint8)'],
      returns: [[`senior.decimals`]],
    },
    {
      target: pool.addresses.JUNIOR_TOKEN,
      call: ['decimals()(uint8)'],
      returns: [[`junior.decimals`]],
    },
    {
      target: pool.addresses.FEED,
      call: ['discountRate()(uint256)'],
      returns: [[`discountRate`, toBN]],
    },
    {
      target: pool.addresses.COORDINATOR,
      call: ['poolClosing()(bool)'],
      returns: [[`poolClosing`]],
    },
  ]

  const maxRiskGroups = 100
  for (let i = 0; i < maxRiskGroups; i += 1) {
    calls.push(
      {
        target: pool.addresses.FEED,
        call: ['ceilingRatio(uint256)(uint256)', i],
        returns: [[`risk[${i}].ceilingRatio`, toBN]],
      },
      {
        target: pool.addresses.FEED,
        call: ['thresholdRatio(uint256)(uint256)', i],
        returns: [[`risk[${i}].thresholdRatio`, toBN]],
      },
      {
        target: pool.addresses.PILE,
        call: ['rates(uint256)(uint256,uint256,uint256,uint48,uint256)', i],
        returns: [
          [`risk[${i}].rate.pie`, toBN],
          [`risk[${i}].rate.chi`, toBN],
          [`risk[${i}].rate.ratePerSecond`, toBN],
          [`risk[${i}].rate.lastUpdated`, toBN],
          [`risk[${i}].rate.fixedRate`, toBN],
        ],
      },
      {
        target: pool.addresses.FEED,
        call: ['recoveryRatePD(uint256)(uint256)', i],
        returns: [[`risk[${i}].recoveryRatePD`, toBN]],
      }
    )
  }

  if (pool.versions?.POOL_ADMIN && pool.versions?.POOL_ADMIN >= 2) {
    const maxWriteOffGroups = 0
    for (let i = 0; i < maxWriteOffGroups; i += 1) {
      calls.push({
        target: pool.addresses.FEED,
        call: ['writeOffGroups(uint256)(uint128,uint128)', i],
        returns: [
          [`writeOffGroups[${i}].percentage`, toBN],
          [`writeOffGroups[${i}].overdueDays`, toBN],
        ],
      })

      // TODO: load for v1 NAV feed, which doesn't have the overdueDays prop
    }
  }

  pool.metadata.juniorInvestors?.forEach((investor: JuniorInvestor) => {
    calls.push(
      {
        target: pool.addresses.JUNIOR_TOKEN,
        call: ['balanceOf(address)(uint256)', investor.address],
        returns: [[`juniorInvestors[${investor.name.replaceAll('.', '-')}].collected`, toBN]],
      },
      {
        target: pool.addresses.JUNIOR_TRANCHE,
        call: ['calcDisburse(address)(uint256,uint256,uint256,uint256)', investor.address],
        returns: [[`-`], [`juniorInvestors[${investor.name.replaceAll('.', '-')}].uncollected`, toBN], [`-`], [`-`]],
      }
    )
  })

  // TODO: Make separate query for user address related data
  // Now it's fetching all pool data again when the address is set
  // Which can cause it to load twice on page load
  if (address) {
    calls.push(
      ...(pool.addresses.POOL_ADMIN && pool.versions?.POOL_ADMIN && pool.versions?.POOL_ADMIN >= 2
        ? ([
            {
              target: pool.addresses.SENIOR_MEMBERLIST,
              call: ['hasMember(address)(bool)', address || '0'],
              returns: [[`senior.inMemberlist`]],
            },
            {
              target: pool.addresses.JUNIOR_MEMBERLIST,
              call: ['hasMember(address)(bool)', address || '0'],
              returns: [[`junior.inMemberlist`]],
            },
            {
              target: pool.addresses.POOL_ADMIN,
              call: ['admin_level(address)(uint256)', address || '0'],
              returns: [[`isPoolAdmin`, (num: BigNumber) => toBN(num).toNumber() >= 1]],
            },
            {
              target: pool.addresses.POOL_ADMIN,
              call: ['admin_level(address)(uint256)', address || '0'],
              returns: [[`adminLevel`, (num: BigNumber) => toBN(num).toNumber()]],
            },
          ] as Call[])
        : pool.addresses.POOL_ADMIN
        ? ([
            {
              target: pool.addresses.SENIOR_MEMBERLIST,
              call: ['hasMember(address)(bool)', address || '0'],
              returns: [[`senior.inMemberlist`]],
            },
            {
              target: pool.addresses.JUNIOR_MEMBERLIST,
              call: ['hasMember(address)(bool)', address || '0'],
              returns: [[`junior.inMemberlist`]],
            },
            {
              target: pool.addresses.POOL_ADMIN,
              call: ['admins(address)(uint256)', address || '0'],
              returns: [[`isPoolAdmin`, (num: BigNumber) => toBN(num).toNumber() === 1]],
            },
          ] as Call[])
        : ([
            {
              target: pool.addresses.SENIOR_MEMBERLIST,
              call: ['hasMember(address)(bool)', address || '0'],
              returns: [[`senior.inMemberlist`]],
            },
            {
              target: pool.addresses.JUNIOR_MEMBERLIST,
              call: ['hasMember(address)(bool)', address || '0'],
              returns: [[`junior.inMemberlist`]],
            },
          ] as Call[]))
    )
  }

  if (isMakerIntegrated) {
    calls.push(
      {
        target: pool.addresses.MCD_VAT!,
        call: ['ilks(bytes32)(uint256,uint256,uint256,uint256,uint256)', ethers.utils.formatBytes32String(ilk)],
        returns: [
          [`maker.art`, toBN],
          [`maker.rate`, toBN],
          [`maker.spot`, toBN],
          [`maker.line`, toBN],
          [`maker.dust`, toBN],
        ],
      },
      {
        target: pool.addresses.MCD_JUG!,
        call: ['ilks(bytes32)(uint256,uint256)', ethers.utils.formatBytes32String(ilk)],
        returns: [
          [`maker.duty`, toBN],
          [`maker.rho`, toBN],
        ],
      },
      {
        target: pool.addresses.CLERK!,
        call: ['remainingCredit()(uint)'],
        returns: [[`maker.remainingCredit`, toBN]],
      },
      {
        target: pool.addresses.CLERK!,
        call: ['remainingOvercollCredit()(uint)'],
        returns: [[`maker.remainingOvercollCredit`, toBN]],
      },
      {
        target: pool.addresses.CLERK!,
        call: ['matBuffer()(uint)'],
        returns: [[`maker.matBuffer`, toBN]],
      },
      {
        target: pool.addresses.CLERK!,
        call: ['mat()(uint)'],
        returns: [[`maker.mat`, toBN]],
      },
      {
        target: pool.addresses.CLERK!,
        call: ['creditline()(uint)'],
        returns: [[`maker.creditline`, toBN]],
      },
      {
        target: pool.addresses.CLERK!,
        call: ['debt()(uint)'],
        returns: [[`maker.debt`, toBN]],
      },
      {
        target: pool.addresses.CLERK!,
        call: ['juniorStake()(uint)'],
        returns: [[`maker.juniorStake`, toBN]],
      },
      {
        target: pool.addresses.ASSESSOR,
        call: ['effectiveSeniorBalance()(uint)'],
        returns: [[`senior.effectiveBalance`, toBN]],
      },
      {
        target: pool.addresses.ASSESSOR,
        call: ['seniorDebt()(uint)'],
        returns: [[`senior.debt`, toBN]],
      },
      {
        target: pool.addresses.ASSESSOR,
        call: ['seniorBalance()(uint)'],
        returns: [[`senior.balance`, toBN]],
      },
      {
        target: pool.addresses.ASSESSOR,
        call: ['totalBalance()(uint)'],
        returns: [[`reserveAndRemainingCredit`, toBN]],
      },
      {
        target: pool.addresses.SENIOR_TOKEN,
        call: ['balanceOf(address)(uint)', pool.addresses.MAKER_MGR!],
        returns: [[`maker.dropBalance`, toBN]],
      }
    )
  }

  const data = await multicall<PoolData>(calls)

  data.junior.availableFunds = (data.reserve || new BN(0)).sub(data.senior.availableFunds || new BN(0))
  data.totalPendingInvestments = (data.senior.pendingInvestments || new BN(0)).add(
    data.junior.pendingInvestments || new BN(0)
  )

  data.senior.address = pool.addresses['SENIOR_TOKEN']
  data.junior.address = pool.addresses['JUNIOR_TOKEN']

  const juniorRedemptionsCurrency = (data.junior.pendingRedemptions || new BN(0))
    .mul(data.junior.tokenPrice || new BN(0))
    .div(Fixed27Base)

  const seniorRedemptionsCurrency = (data.senior.pendingRedemptions || new BN(0))
    .mul(data.senior.tokenPrice || new BN(0))
    .div(Fixed27Base)

  data.totalRedemptionsCurrency = juniorRedemptionsCurrency.add(seniorRedemptionsCurrency)

  data.isUpcoming =
    pool.metadata.isUpcoming || (!config.featureFlagNewOnboardingPools.includes(poolId) && !pool.metadata.isLaunching)

  data.isLaunching = !!pool.metadata.isLaunching

  return data
}
