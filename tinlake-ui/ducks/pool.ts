import { Tranche } from '@centrifuge/tinlake-js'
import BN from 'bn.js'
import { HYDRATE } from 'next-redux-wrapper'
import { Action, AnyAction } from 'redux'
import { ThunkAction } from 'redux-thunk'
import { getEpoch } from '../services/tinlake/actions'
import { createWatcher, IUpdate } from '@makerdao/multicall'
import config from '../config'
import { BigNumber } from 'ethers'

const multicallConfig = {
  rpcUrl: config.rpcUrl,
  multicallAddress: '0x2cc8688c5f75e365aaeeb4ea8d6a480405a48d2a',
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
  data: null | PoolData
}

const initialState: PoolState = {
  state: null,
  data: null,
}

export default function reducer(state: PoolState = initialState, action: AnyAction = { type: '' }): PoolState {
  switch (action.type) {
    case HYDRATE:
      return { ...state, ...(action.payload.pool || {}) }
    case LOAD_POOL:
      return { ...state, state: 'loading' }
    case RECEIVE_POOL:
      return { ...state, state: 'found', data: action.data }
    case RECEIVE_EPOCH:
      return { ...state, state: 'found', data: { ...(state.data as PoolData), epoch: action.epoch } }
    default:
      return state
  }
}

let watcher: any = undefined

export function loadPool(tinlake: any): ThunkAction<Promise<void>, PoolState, undefined, Action> {
  return async (dispatch) => {
    dispatch({ type: LOAD_POOL })
    // const poolData = await getPool(tinlake)
    // dispatch({ data: poolData, type: RECEIVE_POOL })

    const toBN = (val: BigNumber) => new BN(val.toString())

    const seniorToJuniorRatio = (seniorRatio: BN) => {
      return new BN(10).pow(new BN(27)).sub(seniorRatio)
    }

    watcher = createWatcher(
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

    // TODO: also get this using multicall
    const t0_init = performance.now()
    const address = await tinlake.signer?.getAddress()
    const seniorInMemberlist = address ? await tinlake.checkSeniorTokenMemberlist(address) : false
    const juniorInMemberlist = address ? await tinlake.checkJuniorTokenMemberlist(address) : false

    const t1_init = performance.now()
    console.log('Call to get initial values took ' + (t1_init - t0_init) + ' milliseconds.')

    try {
      const t0 = performance.now()
      watcher.batch().subscribe((updates: IUpdate[]) => {
        const data: Partial<PoolData> = updates.reduce(
          (prev: any, update: IUpdate) => {
            const prefix = update.type.split('.')[0]
            if (prefix === 'junior') prev['junior'][update.type.split('.')[1]] = update.value
            else if (prefix === 'senior') prev['senior'][update.type.split('.')[1]] = update.value
            else prev[update.type] = update.value
            return prev
          },
          { junior: { type: 'junior' }, senior: { type: 'senior' }, epoch: {} }
        )

        const zero = new BN(0)
        data.junior!.availableFunds = (data.reserve || zero).sub(data.senior!.availableFunds || zero)
        data.totalPendingInvestments = (data.senior!.pendingInvestments || zero).add(
          data.junior!.pendingInvestments || zero
        )

        data.senior!.address = tinlake.contractAddresses['JUNIOR_TOKEN']
        data.senior!.inMemberlist = seniorInMemberlist
        data.junior!.address = tinlake.contractAddresses['SENIOR_TOKEN']
        data.junior!.inMemberlist = juniorInMemberlist

        const juniorRedemptionsCurrency = (data.junior?.pendingRedemptions || zero)
          .mul(data.junior?.tokenPrice || zero)
          .div(new BN(10).pow(new BN(27)))

        const seniorRedemptionsCurrency = (data.senior?.pendingRedemptions || zero)
          .mul(data.senior?.tokenPrice || zero)
          .div(new BN(10).pow(new BN(27)))

        data.totalRedemptionsCurrency = juniorRedemptionsCurrency.add(seniorRedemptionsCurrency)

        const t1 = performance.now()
        console.log('Call to get multicall values took ' + (t1 - t0) + ' milliseconds.')
        console.log('Receiving data', data)

        dispatch({ data: data, type: RECEIVE_POOL })
      })

      watcher.start()
    } catch (e) {
      console.error(e)
    }

    const t0_epoch = performance.now()
    const epoch = await getEpoch(tinlake)
    dispatch({ epoch, type: RECEIVE_EPOCH })
    const t1_epoch = performance.now()
    console.log('Call to get epoch data took ' + (t1_epoch - t0_epoch) + ' milliseconds.')
  }
}
