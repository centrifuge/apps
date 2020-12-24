import { Loan } from '@centrifuge/tinlake-js'
import { HYDRATE } from 'next-redux-wrapper'
import { Action, AnyAction } from 'redux'
import { ThunkAction } from 'redux-thunk'
import Apollo from '../services/apollo'
import { getNFT, addProxyDetails } from '../services/tinlake/actions'
import { createWatcher } from '@makerdao/multicall'
import config from '../config'
import { BigNumber } from 'ethers'
import BN from 'bn.js'

const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000'

const multicallConfig = {
  rpcUrl: config.rpcUrl,
  multicallAddress:
    config.network === 'Mainnet'
      ? '0xeefba1e63905ef1d7acba5a8513c70307c1ce441'
      : '0x2cc8688c5f75e365aaeeb4ea8d6a480405a48d2a',
  interval: 60000,
}

// SortableLoan adds properties of number type that support sorting in numerical order for grommet DataTable
export interface SortableLoan extends Loan {
  amountNum: number
  debtNum: number
  principalNum: number
  interestRateNum: number
}

export interface AssetData {
  day: number
  totalDebt: number
}

// Actions
const LOAD = 'tinlake-ui/loans/LOAD'
const RECEIVE = 'tinlake-ui/loans/RECEIVE'
const RECEIVE_ASSET_DATA = 'tinlake-ui/loans/RECEIVE_ASSET_DATA'
const LOAD_LOAN = 'tinlake-ui/loans/LOAD_LOAN'
const LOAN_NOT_FOUND = 'tinlake-ui/loans/LOAN_NOT_FOUND'
const RECEIVE_LOAN = 'tinlake-ui/loans/RECEIVE_LOAN'

export interface LoansState {
  loansState: null | 'loading' | 'found'
  loans: SortableLoan[]
  assetData: AssetData[]
  loanState: null | 'loading' | 'not found' | 'found'
  loan: null | Loan
}

const initialState: LoansState = {
  loansState: null,
  loans: [],
  assetData: [],
  loanState: null,
  loan: null,
}

// Reducer
export default function reducer(state: LoansState = initialState, action: AnyAction = { type: '' }): LoansState {
  switch (action.type) {
    case HYDRATE:
      return { ...state, ...(action.payload.loans || {}) }
    case LOAD:
      return { ...state, loansState: 'loading' }
    case RECEIVE:
      return { ...state, loansState: 'found', loans: action.loans }
    case RECEIVE_ASSET_DATA:
      return { ...state, assetData: action.data }
    case LOAD_LOAN:
      return { ...state, loanState: 'loading', loan: null }
    case LOAN_NOT_FOUND:
      return { ...state, loanState: 'not found' }
    case RECEIVE_LOAN:
      return { ...state, loanState: 'found', loan: action.loan }
    default:
      return state
  }
}

export function loadLoans(tinlake: any): ThunkAction<Promise<void>, LoansState, undefined, Action> {
  return async (dispatch) => {
    dispatch({ type: LOAD })
    const root = tinlake.contractAddresses['ROOT_CONTRACT']
    if (root === undefined) {
      throw new Error('could not get ROOT_CONTRACT address')
    }
    const result = await Apollo.getLoans(root)

    if (result.data) {
      const loans: SortableLoan[] = result.data.map((l: Loan) => ({
        ...l,
        amountNum: l.debt.isZero() ? parseFloat(l.principal.toString()) : parseFloat(l.debt.toString()),
        debtNum: parseFloat(l.debt.toString()),
        principalNum: parseFloat(l.principal.toString()),
        interestRateNum: parseFloat(l.interestRate.toString()),
      }))

      dispatch({ loans, type: RECEIVE })
    } else {
      const loans: any[] = []
      dispatch({ loans, type: RECEIVE })
    }
  }
}

export function loadAssetData(tinlake: any): ThunkAction<Promise<void>, LoansState, undefined, Action> {
  return async (dispatch) => {
    const root = tinlake.contractAddresses['ROOT_CONTRACT']

    const assetData = await Apollo.getAssetData(root)
    console.log({ assetData })
    dispatch({ data: assetData, type: RECEIVE_ASSET_DATA })
  }
}
let watcher: any = createWatcher([], multicallConfig)

export function loadLoan(
  tinlake: any,
  loanId: string,
  refresh = false
): ThunkAction<Promise<void>, LoansState, undefined, Action> {
  return async (dispatch, getState) => {
    if (!refresh) {
      dispatch({ type: LOAD_LOAN })
    }

    // if (!loan) {
    //   dispatch({ type: LOAN_NOT_FOUND })
    //   return
    // }

    if (loanId === '0') {
      dispatch({ type: LOAN_NOT_FOUND })
      return
    }

    // TODO: load riskGroup using multicall
    const riskGroup = (await tinlake.getRiskGroup(loanId)).toNumber()

    const toBN = (val: BigNumber) => new BN(val.toString())

    const globalWatchers = [
      {
        target: tinlake.contractAddresses.SHELF,
        call: ['shelf(uint256)(address,uint256)', loanId],
        returns: [[`registry`], [`tokenId`]],
      },
      {
        target: tinlake.contractAddresses.FEED,
        call: ['ceiling(uint256)(uint256)', loanId],
        returns: [[`principal`, toBN]],
      },
      {
        target: tinlake.contractAddresses.TITLE,
        call: ['ownerOf(uint256)(address)', loanId],
        returns: [
          [
            `ownerOf`,
            (val: string | null) => {
              if (!val) return ZERO_ADDRESS
              return val
            },
          ],
        ],
      },
      {
        target: tinlake.contractAddresses.PILE,
        call: ['rates(uint256)(uint256,uint256,uint256,uint48,uint256)', riskGroup],
        returns: [[`rates.pie`], [`rates.chi`], [`rates.interestRate`], [`rates.lastUpdated`], [`rates.fixedRate`]],
      },
      {
        target: tinlake.contractAddresses.PILE,
        call: ['debt(uint256)(uint256)', loanId],
        returns: [[`debt`, toBN]],
      },
      {
        target: tinlake.contractAddresses.FEED,
        call: ['thresholdRatio(uint256)(uint256)', riskGroup],
        returns: [[`scoreCard.thresholdRatio`, toBN]],
      },
      {
        target: tinlake.contractAddresses.FEED,
        call: ['ceilingRatio(uint256)(uint256)', riskGroup],
        returns: [[`scoreCard.ceilingRatio`, toBN]],
      },
      {
        target: tinlake.contractAddresses.FEED,
        call: ['recoveryRatePD(uint256)(uint256)', riskGroup],
        returns: [[`scoreCard.recoveryRatePD`, toBN]],
      },
    ]

    watcher.recreate(globalWatchers, multicallConfig)

    try {
      const initial = { loanId, riskGroup, scoreCard: {} }
      const prev =
        (getState() as any).loans.loan?.loanId === loanId ? (getState() as any).loans.loan || initial : initial

      watcher.batch().subscribe(async (updates: any[]) => {
        const data: Partial<Loan> = updates.reduce((prev: any, update: any) => {
          const prefix = update.type.split('.')[0]
          if (prefix === 'scoreCard') {
            const item = update.type.split('.')[1]
            prev[prefix][item] = update.value
          } else if (prefix === 'rates') {
            const item = update.type.split('.')[1]

            if (item === 'interestRate') {
              prev['interestRate'] = update.value
              prev['scoreCard']['interestRate'] = update.value
            }
          } else {
            prev[update.type] = update.value
          }

          return prev
        }, prev)

        // TODO: load getOwnerOfCollateral using multicall
        if (
          (await tinlake.getOwnerOfCollateral(data.registry, data.tokenId)).toString() ===
          tinlake.contractAddresses.SHELF
        ) {
          data.status = 'ongoing'
        } else if ((data.ownerOf as any) === ZERO_ADDRESS) {
          data.status = 'closed'
        } else {
          data.status = 'NFT locked'
        }

        // TODO: load proxyOwner using multicall
        await addProxyDetails(tinlake, data as Loan)

        dispatch({ loan: data, type: RECEIVE_LOAN })

        if (!data.nft) {
          // TODO: load nft using multicall
          const nftData = await getNFT((data as any).registry, tinlake, `${data.tokenId}`)
          data.nft = (nftData && (nftData as any).nft) || {}
          dispatch({ loan: data, type: RECEIVE_LOAN })
        }
      })
      watcher.start()
    } catch (e) {
      console.error(e)
    }
  }
}
