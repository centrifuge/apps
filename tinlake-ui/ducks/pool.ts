import { Tranche } from '@centrifuge/tinlake-js'
import { createWatcher } from '@makerdao/multicall'
import BN from 'bn.js'
import { BigNumber, ethers } from 'ethers'
import { HYDRATE } from 'next-redux-wrapper'
import { Action, AnyAction } from 'redux'
import { ThunkAction } from 'redux-thunk'
import config from '../config'
import { getEpoch } from '../services/tinlake/actions'
import { Fixed27Base, seniorToJuniorRatio } from '../utils/ratios'

const multicallConfig = {
  rpcUrl: config.rpcUrl,
  multicallAddress: config.multicallContractAddress,
  interval: 60000,
}

// Actions
const LOAD_POOL = 'tinlake-ui/pool/LOAD_POOL'
const RECEIVE_POOL = 'tinlake-ui/pool/RECEIVE_POOL'
const RECEIVE_EPOCH = 'tinlake-ui/pool/RECEIVE_EPOCH'

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
  senior?: PoolTranche
  maker?: any
  availableFunds: BN
  minJuniorRatio: BN
  currentJuniorRatio: BN
  netAssetValue: BN
  reserve: BN
  maxJuniorRatio: BN
  maxReserve: BN
  outstandingVolume: BN
  totalPendingInvestments: BN
  totalRedemptionsCurrency: BN
  isPoolAdmin?: boolean
  reserveAndRemainingCredit?: BN
}

export type PoolStatus = 'Upcoming' | 'Active' | 'Deployed' | 'Closed'

export interface ArchivedPoolData {
  status: PoolStatus
  legacyLink: string
  totalFinancedCurrency: string
  financingsCount: string
  seniorInterestRate: string
}

export type EpochData = {
  id: number
  state: 'open' | 'can-be-closed' | 'in-submission-period' | 'in-challenge-period' | 'challenge-period-ended'
  isBlockedState: boolean
  minimumEpochTime: number
  minimumEpochTimeLeft: number
  minChallengePeriodEnd: number
  lastEpochClosed: number
  latestBlockTimestamp: number
  seniorOrderedInEpoch: number
  juniorOrderedInEpoch: number
}

export interface PoolState {
  state: null | 'loading' | 'found'
  poolId: string | null
  data: null | PoolData
  epoch: null | EpochData
}

const initialState: PoolState = {
  state: null,
  poolId: null,
  data: null,
  epoch: null,
}

export default function reducer(state: PoolState = initialState, action: AnyAction = { type: '' }): PoolState {
  switch (action.type) {
    case HYDRATE:
      return { ...state, ...(action.payload.pool || {}) }
    case LOAD_POOL:
      return { ...state, state: 'loading', poolId: action.poolId }
    case RECEIVE_POOL:
      return { ...state, state: 'found', data: action.data }
    case RECEIVE_EPOCH:
      return { ...state, state: 'found', epoch: action.epoch }
    default:
      return state
  }
}

const watcher: any = createWatcher([], multicallConfig)
watcher.onError((err: Error) => console.error(`Pool multicall error: ${err}`))

let prevAddress: string | undefined = undefined

export function loadPool(
  tinlake: any,
  ilk: string = '',
  forceReload?: boolean
): ThunkAction<Promise<void>, { pool: PoolState }, undefined, Action> {
  return async (dispatch, getState) => {
    const address = await tinlake.signer?.getAddress()

    const poolId = tinlake.contractAddresses.ROOT_CONTRACT

    // Dont load data again for the same pool and address combination
    if (!forceReload && (getState() as any).pool.poolId === poolId && prevAddress === address) {
      return
    }

    // Save the address so we do reload the data if the address changes
    prevAddress = address

    dispatch({ poolId, type: LOAD_POOL })

    const toBN = (val: BigNumber) => new BN(val.toString())

    const addressWatchers = address
      ? tinlake.contractAddresses.POOL_ADMIN
        ? [
            {
              target: tinlake.contractAddresses.SENIOR_MEMBERLIST,
              call: ['hasMember(address)(bool)', address || '0'],
              returns: [[`senior.inMemberlist`]],
            },
            {
              target: tinlake.contractAddresses.JUNIOR_MEMBERLIST,
              call: ['hasMember(address)(bool)', address || '0'],
              returns: [[`junior.inMemberlist`]],
            },
            {
              target: tinlake.contractAddresses.POOL_ADMIN,
              call: ['admins(address)(uint256)', address || '0'],
              returns: [[`isPoolAdmin`, (num: BigNumber) => toBN(num).toNumber() === 1]],
            },
          ]
        : [
            {
              target: tinlake.contractAddresses.SENIOR_MEMBERLIST,
              call: ['hasMember(address)(bool)', address || '0'],
              returns: [[`senior.inMemberlist`]],
            },
            {
              target: tinlake.contractAddresses.JUNIOR_MEMBERLIST,
              call: ['hasMember(address)(bool)', address || '0'],
              returns: [[`junior.inMemberlist`]],
            },
          ]
      : []

    const globalWatchers = [
      {
        target: tinlake.contractAddresses.ASSESSOR,
        call: ['maxReserve()(uint256)'],
        returns: [[`maxReserve`, toBN]],
      },
      {
        target: tinlake.contractAddresses.ASSESSOR,
        call: ['calcJuniorTokenPrice()(uint256)'],
        returns: [[`junior.tokenPrice`, toBN]],
      },
      {
        target: tinlake.contractAddresses.ASSESSOR,
        call: ['calcSeniorTokenPrice()(uint256)'],
        returns: [[`senior.tokenPrice`, toBN]],
      },
      {
        target: tinlake.contractAddresses.ASSESSOR,
        call: ['seniorBalance_()(uint256)'],
        returns: [[`senior.availableFunds`, toBN]],
      },
      {
        target: tinlake.contractAddresses.RESERVE,
        call: ['totalBalance()(uint256)'],
        returns: [[`reserve`, toBN]],
      },
      {
        target: tinlake.contractAddresses.ASSESSOR,
        call: ['maxSeniorRatio()(uint256)'],
        returns: [[`minJuniorRatio`, (val: BigNumber) => seniorToJuniorRatio(toBN(val))]],
      },
      {
        target: tinlake.contractAddresses.ASSESSOR,
        call: ['minSeniorRatio()(uint256)'],
        returns: [[`maxJuniorRatio`, (val: BigNumber) => seniorToJuniorRatio(toBN(val))]],
      },
      {
        target: tinlake.contractAddresses.ASSESSOR,
        call: ['seniorRatio()(uint256)'],
        returns: [[`currentJuniorRatio`, (val: BigNumber) => seniorToJuniorRatio(toBN(val))]],
      },
      {
        target: tinlake.contractAddresses.FEED,
        call: ['currentNAV()(uint256)'],
        returns: [[`netAssetValue`, toBN]],
      },
      {
        target: tinlake.contractAddresses.PILE,
        call: ['total()(uint256)'],
        returns: [[`outstandingVolume`, toBN]],
      },
      {
        target: tinlake.contractAddresses.SENIOR_TRANCHE,
        call: ['totalSupply()(uint256)'],
        returns: [[`senior.pendingInvestments`, toBN]],
      },
      {
        target: tinlake.contractAddresses.SENIOR_TRANCHE,
        call: ['totalRedeem()(uint256)'],
        returns: [[`senior.pendingRedemptions`, toBN]],
      },
      {
        target: tinlake.contractAddresses.JUNIOR_TRANCHE,
        call: ['totalSupply()(uint256)'],
        returns: [[`junior.pendingInvestments`, toBN]],
      },
      {
        target: tinlake.contractAddresses.JUNIOR_TRANCHE,
        call: ['totalRedeem()(uint256)'],
        returns: [[`junior.pendingRedemptions`, toBN]],
      },
      {
        target: tinlake.contractAddresses.SENIOR_TOKEN,
        call: ['totalSupply()(uint256)'],
        returns: [[`senior.totalSupply`, toBN]],
      },
      {
        target: tinlake.contractAddresses.JUNIOR_TOKEN,
        call: ['totalSupply()(uint256)'],
        returns: [[`junior.totalSupply`, toBN]],
      },
      {
        target: tinlake.contractAddresses.RESERVE,
        call: ['currencyAvailable()(uint256)'],
        returns: [[`availableFunds`, toBN]],
      },
      {
        target: tinlake.contractAddresses.ASSESSOR,
        call: ['seniorInterestRate()(uint256)'],
        returns: [[`senior.interestRate`, toBN]],
      },
      {
        target: tinlake.contractAddresses.SENIOR_TOKEN,
        call: ['symbol()(string)'],
        returns: [
          [
            `senior.token`,
            (symbol: string) => {
              if (!symbol || symbol.length === 0) {
                return `${tinlake.contractAddresses['SENIOR_TOKEN']?.substr(2, 2).toUpperCase()}DRP`
              }
              return symbol
            },
          ],
        ],
      },
      {
        target: tinlake.contractAddresses.JUNIOR_TOKEN,
        call: ['symbol()(string)'],
        returns: [
          [
            `junior.token`,
            (symbol: string) => {
              if (!symbol || symbol.length === 0) {
                return `${tinlake.contractAddresses['JUNIOR_TOKEN']?.substr(2, 2).toUpperCase()}TIN`
              }
              return symbol
            },
          ],
        ],
      },
      {
        target: tinlake.contractAddresses.SENIOR_TOKEN,
        call: ['decimals()(uint8)'],
        returns: [[`senior.decimals`]],
      },
      {
        target: tinlake.contractAddresses.JUNIOR_TOKEN,
        call: ['decimals()(uint8)'],
        returns: [[`junior.decimals`]],
      },
    ]

    const isMakerIntegrated = tinlake.contractAddresses.CLERK !== undefined && ilk !== ''

    const makerWatchers = isMakerIntegrated
      ? [
          {
            target: tinlake.contractAddresses.MCD_VAT,
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
            target: tinlake.contractAddresses.MCD_JUG,
            call: ['ilks(bytes32)(uint256,uint256)', ethers.utils.formatBytes32String(ilk)],
            returns: [
              [`maker.duty`, toBN],
              [`maker.rho`, toBN],
            ],
          },
          {
            target: tinlake.contractAddresses.CLERK,
            call: ['remainingCredit()(uint)'],
            returns: [[`maker.remainingCredit`, toBN]],
          },
          {
            target: tinlake.contractAddresses.CLERK,
            call: ['mat()(uint)'],
            returns: [[`maker.mat`, toBN]],
          },
          {
            target: tinlake.contractAddresses.CLERK,
            call: ['creditline()(uint)'],
            returns: [[`maker.creditline`, toBN]],
          },
          {
            target: tinlake.contractAddresses.CLERK,
            call: ['debt()(uint)'],
            returns: [[`maker.debt`, toBN]],
          },
          {
            target: tinlake.contractAddresses.ASSESSOR,
            call: ['effectiveSeniorBalance()(uint)'],
            returns: [[`senior.effectiveBalance`, toBN]],
          },
          {
            target: tinlake.contractAddresses.ASSESSOR,
            call: ['seniorDebt()(uint)'],
            returns: [[`senior.debt`, toBN]],
          },
          {
            target: tinlake.contractAddresses.ASSESSOR,
            call: ['seniorBalance()(uint)'],
            returns: [[`senior.balance`, toBN]],
          },
          {
            target: tinlake.contractAddresses.ASSESSOR,
            call: ['totalBalance()(uint)'],
            returns: [[`reserveAndRemainingCredit`, toBN]],
          },
          {
            target: tinlake.contractAddresses.SENIOR_TOKEN,
            call: ['balanceOf(address)(uint)', tinlake.contractAddresses.MAKER_MGR],
            returns: [[`maker.dropBalance`, toBN]],
          },
        ]
      : []

    watcher.recreate([...addressWatchers, ...globalWatchers, ...makerWatchers], multicallConfig)

    try {
      const initial = {
        junior: { type: 'junior' },
        senior: { type: 'senior' },
        maker: {},
      }

      const prev =
        (getState() as any).pool.poolId === tinlake.contractAddresses.ROOT_CONTRACT
          ? (getState() as any).pool.data || initial
          : initial

      watcher.batch().subscribe((updates: any[]) => {
        const data: Partial<PoolData> = updates.reduce((prev: any, update: any) => {
          const prefix = update.type.split('.')[0]
          if (prefix === 'junior' || prefix === 'senior' || prefix === 'maker') {
            const item = update.type.split('.')[1]
            prev[prefix][item] = update.value
          } else {
            prev[update.type] = update.value
          }

          return prev
        }, prev)

        data.junior!.availableFunds = (data.reserve || new BN(0)).sub(data.senior!.availableFunds || new BN(0))
        data.totalPendingInvestments = (data.senior!.pendingInvestments || new BN(0)).add(
          data.junior!.pendingInvestments || new BN(0)
        )

        data.senior!.address = tinlake.contractAddresses['SENIOR_TOKEN']
        data.junior!.address = tinlake.contractAddresses['JUNIOR_TOKEN']

        const juniorRedemptionsCurrency = (data.junior?.pendingRedemptions || new BN(0))
          .mul(data.junior?.tokenPrice || new BN(0))
          .div(Fixed27Base)

        const seniorRedemptionsCurrency = (data.senior?.pendingRedemptions || new BN(0))
          .mul(data.senior?.tokenPrice || new BN(0))
          .div(Fixed27Base)

        data.totalRedemptionsCurrency = juniorRedemptionsCurrency.add(seniorRedemptionsCurrency)

        dispatch({ data, type: RECEIVE_POOL })
      })

      watcher.start()
    } catch (e) {
      console.error(e)
    }

    // TODO: also get this using multicall
    const epoch = await getEpoch(tinlake, address)
    dispatch({ epoch, type: RECEIVE_EPOCH })
  }
}
