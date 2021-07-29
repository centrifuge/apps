import { createWatcher } from '@makerdao/multicall'
import BN from 'bn.js'
import { BigNumber } from 'ethers'
import { HYDRATE } from 'next-redux-wrapper'
import { Action, AnyAction } from 'redux'
import { ThunkAction } from 'redux-thunk'
import { IpfsPools, multicallConfig, Pool } from '../config'
import Apollo from '../services/apollo'
import { PoolStatus } from './pool'

// Actions
const LOAD_POOLS = 'tinlake-ui/pools/LOAD_POOLS'
const RECEIVE_POOLS = 'tinlake-ui/pools/RECEIVE_POOLS'
const RECEIVE_POOLS_DAILY_DATA = 'tinlake-ui/pools/RECEIVE_POOLS_DAILY_DATA'

export interface PoolData {
  id: string
  name: string
  slug: string
  isUpcoming: boolean
  isArchived: boolean
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
  order: number
  version: number
  totalFinancedCurrency: BN
  financingsCount?: number
  status?: PoolStatus
  reserve?: BN
  assetValue?: BN
  juniorYield14Days: BN | null
  seniorYield14Days: BN | null
  icon: string | null
  juniorTokenPrice?: BN | null
  seniorTokenPrice?: BN | null
  currency: string
  capacity?: BN
}

export interface PoolsData {
  ongoingLoans: number
  totalFinancedCurrency: BN
  totalValue: BN
  pools: PoolData[]
}

export interface PoolsDailyData {
  day: number
  poolValue: number
}

export interface PoolsState {
  state: null | 'loading' | 'found'
  data: null | PoolsData
  poolsDailyData: PoolsDailyData[]
}

const initialState: PoolsState = {
  state: null,
  data: null,
  poolsDailyData: [],
}

const watcher: any = createWatcher([], multicallConfig)
watcher.onError((err: Error) => console.error(`Pool multicall error: ${err}`))

export default function reducer(state: PoolsState = initialState, action: AnyAction = { type: '' }): PoolsState {
  switch (action.type) {
    case HYDRATE:
      return { ...state, ...(action.payload.pools || {}) }
    case LOAD_POOLS:
      return { ...state, state: 'loading' }
    case RECEIVE_POOLS:
      return { ...state, state: 'found', data: action.data }
    case RECEIVE_POOLS_DAILY_DATA:
      return { ...state, poolsDailyData: action.data }
    default:
      return state
  }
}

export function loadPools(pools: IpfsPools): ThunkAction<Promise<void>, { pools: PoolsState }, undefined, Action> {
  return async (dispatch) => {
    dispatch({ type: LOAD_POOLS })
    // Load ipfs data only
    const initialPoolsData = await Apollo.getInitialPools(pools)
    dispatch({ data: initialPoolsData, type: RECEIVE_POOLS })

    // Load with subgraph data
    const poolsData = await Apollo.getPools(pools)
    dispatch({ data: poolsData, type: RECEIVE_POOLS })

    const toBN = (val: BigNumber) => new BN(val.toString())

    let watchers: any[] = []
    pools.active.forEach((pool: Pool) => {
      watchers = [
        ...watchers,
        ...[
          {
            target: pool.addresses.ASSESSOR,
            call: ['maxReserve()(uint256)'],
            returns: [[`${pool.addresses.ROOT_CONTRACT}.maxReserve`, toBN]],
          },
          {
            target: pool.addresses.RESERVE,
            call: ['totalBalance()(uint256)'],
            returns: [[`${pool.addresses.ROOT_CONTRACT}.reserve`, toBN]],
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
        ],
      ]
    })
    watcher.recreate(watchers, multicallConfig)

    try {
      watcher.batch().subscribe((updates: any[]) => {
        let updatesPerPool: any = {}
        updates.forEach((update: any) => {
          const poolId = update.type.split('.')[0]
          const key = update.type.split('.')[1]
          if (!(poolId in updatesPerPool)) updatesPerPool[poolId] = {}
          updatesPerPool[poolId][key] = update.value
        })

        let capacityPerPool: { [key: string]: BN } = {}
        Object.keys(updatesPerPool).forEach((poolId: string) => {
          const state: State = updatesPerPool[poolId]
          // TODO: add remainingCredit
          const capacity = state.maxReserve
            .sub(state.reserve)
            .sub(state.pendingSeniorInvestments)
            .sub(state.pendingJuniorInvestments)
            .add(state.pendingSeniorRedemptions)
            .add(state.pendingJuniorRedemptions)
          const capacityGivenMaxReserve = capacity.ltn(0) ? new BN(0) : capacity
          capacityPerPool[poolId] = capacityGivenMaxReserve
        })

        const poolsWithCapacity = poolsData.pools.map((pool: PoolData) => {
          if (pool.id in capacityPerPool) return { ...pool, capacity: capacityPerPool[pool.id] }
          return pool
        })
        dispatch({ data: { ...poolsData, pools: poolsWithCapacity }, type: RECEIVE_POOLS })
      })

      watcher.start()
    } catch (e) {
      console.error(e)
    }
  }
}

export function loadPoolsDailyData(): ThunkAction<Promise<void>, { pools: PoolsState }, undefined, Action> {
  return async (dispatch) => {
    const poolsDailyData = await Apollo.getPoolsDailyData()
    dispatch({ data: poolsDailyData, type: RECEIVE_POOLS_DAILY_DATA })
  }
}

interface State {
  maxReserve: BN
  reserve: BN
  pendingSeniorInvestments: BN
  pendingSeniorRedemptions: BN
  pendingJuniorInvestments: BN
  pendingJuniorRedemptions: BN
}
