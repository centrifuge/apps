import { Tranche } from '@centrifuge/tinlake-js'
import BN from 'bn.js'
import { BigNumber, ethers } from 'ethers'
import { useQuery } from 'react-query'
import { useSelector } from 'react-redux'
import { useIpfsPools } from '../components/IpfsPoolsProvider'
import { IpfsPools } from '../config'
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
  outstandingVolume: BN
  totalPendingInvestments: BN
  totalRedemptionsCurrency: BN
  isPoolAdmin?: boolean
  reserveAndRemainingCredit?: BN
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

async function getPool(ipfsPools: IpfsPools, poolId: string, address?: string | null) {
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
      target: pool.addresses.PILE,
      call: ['total()(uint256)'],
      returns: [[`outstandingVolume`, toBN]],
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
  ]

  if (address) {
    calls.push(
      ...(pool.addresses.POOL_ADMIN
        ? [
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
          ]
        : [
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
          ])
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

  return data
}
