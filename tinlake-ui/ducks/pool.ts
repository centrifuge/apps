import { Tranche } from '@centrifuge/tinlake-js'
import { createWatcher } from '@makerdao/multicall'
import BN from 'bn.js'
import { BigNumber } from 'ethers'
import { HYDRATE } from 'next-redux-wrapper'
import { Action, AnyAction } from 'redux'
import { ThunkAction } from 'redux-thunk'
import config from '../config'
import { getEpoch } from '../services/tinlake/actions'
import { Fixed27Base, seniorToJuniorRatio } from '../utils/ratios'

const multicallConfig = {
  rpcUrl: config.rpcUrl,
  multicallAddress:
    config.network === 'Mainnet'
      ? '0xeefba1e63905ef1d7acba5a8513c70307c1ce441'
      : '0x2cc8688c5f75e365aaeeb4ea8d6a480405a48d2a',
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
}

export interface PoolData {
  junior: PoolTranche
  senior?: PoolTranche
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
  epoch?: EpochData
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
}

const initialState: PoolState = {
  state: null,
  poolId: null,
  data: null,
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
      return { ...state, state: 'found', data: { ...(state.data as PoolData), epoch: action.epoch } }
    default:
      return state
  }
}

let watcher: any = createWatcher([], multicallConfig)

export function loadPool(tinlake: any): ThunkAction<Promise<void>, PoolState, undefined, Action> {
  return async (dispatch, getState) => {
    const poolId = tinlake.contractAddresses.ROOT_CONTRACT
    if ((getState() as any).pool.poolId === poolId) {
      return
    }

    dispatch({ poolId, type: LOAD_POOL })

    const toBN = (val: BigNumber) => new BN(val.toString())

    watcher.recreate(
      [
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
      ],
      multicallConfig
    )

    const address = await tinlake.signer?.getAddress()

    // TODO: also get this using multicall
    const seniorInMemberlist = address ? await tinlake.checkSeniorTokenMemberlist(address) : false
    const juniorInMemberlist = address ? await tinlake.checkJuniorTokenMemberlist(address) : false

    try {
      const prev = ((getState() as any).pool.poolId === tinlake.contractAddresses.ROOT_CONTRACT &&
        (getState() as any).pool.data) || {
        junior: { type: 'junior' },
        senior: { type: 'senior' },
        epoch: {},
      }
      watcher.batch().subscribe((updates: any[]) => {
        const data: Partial<PoolData> = updates.reduce((prev: any, update: any) => {
          const prefix = update.type.split('.')[0]
          if (prefix === 'junior' || prefix === 'senior') {
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

        data.senior!.address = tinlake.contractAddresses['JUNIOR_TOKEN']
        data.senior!.inMemberlist = seniorInMemberlist
        data.junior!.address = tinlake.contractAddresses['SENIOR_TOKEN']
        data.junior!.inMemberlist = juniorInMemberlist

        const juniorRedemptionsCurrency = (data.junior?.pendingRedemptions || new BN(0))
          .mul(data.junior?.tokenPrice || new BN(0))
          .div(Fixed27Base)

        const seniorRedemptionsCurrency = (data.senior?.pendingRedemptions || new BN(0))
          .mul(data.senior?.tokenPrice || new BN(0))
          .div(Fixed27Base)

        data.totalRedemptionsCurrency = juniorRedemptionsCurrency.add(seniorRedemptionsCurrency)

        // TODO: used for debugging, to be removed before merging
        // try {
        //   let newObj: any = {}
        //   Object.keys(data).map((key: string) => {
        //     if (key !== 'junior' && key !== 'senior') newObj[key] = (data as any)[key].toString()
        //   })
        //   newObj['junior'] = {}
        //   Object.keys((data as any)['junior']).map((key: string) => {
        //     newObj['junior'][key] = (data as any)['junior'][key].toString()
        //   })
        //   newObj['senior'] = {}
        //   Object.keys((data as any)['senior']).map((key: string) => {
        //     newObj['senior'][key] = (data as any)['senior'][key].toString()
        //   })
        //   console.log(`New data: ${newObj['senior']['token']} / ${newObj['junior']['token']}`, newObj)
        // } catch (e) {
        //   console.error(e)
        // }

        dispatch({ data: data, type: RECEIVE_POOL })
      })

      watcher.start()
    } catch (e) {
      console.error(e)
    }

    // TODO: also get this using multicall
    const epoch = await getEpoch(tinlake)
    dispatch({ epoch, type: RECEIVE_EPOCH })
  }
}
