import { Loan } from '@centrifuge/tinlake-js'
import { HYDRATE } from 'next-redux-wrapper'
import { Action, AnyAction } from 'redux'
import { ThunkAction } from 'redux-thunk'
import Apollo from '../services/apollo'
import { getLoan } from '../services/tinlake/actions'
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

// Actions
const LOAD = 'tinlake-ui/loans/LOAD'
const RECEIVE = 'tinlake-ui/loans/RECEIVE'
const LOAD_LOAN = 'tinlake-ui/loans/LOAD_LOAN'
const LOAN_NOT_FOUND = 'tinlake-ui/loans/LOAN_NOT_FOUND'
const RECEIVE_LOAN = 'tinlake-ui/loans/RECEIVE_LOAN'

export interface LoansState {
  loansState: null | 'loading' | 'found'
  loans: SortableLoan[]
  loanState: null | 'loading' | 'not found' | 'found'
  loan: null | Loan
}

const initialState: LoansState = {
  loansState: null,
  loans: [],
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

let watcher: any = createWatcher([], multicallConfig)

export function loadLoan(
  tinlake: any,
  loanId: string,
  refresh = false
): ThunkAction<Promise<void>, LoansState, undefined, Action> {
  return async (dispatch) => {
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

    // TODO: also get using multicall
    const riskGroup = await tinlake.getRiskGroup(loanId)

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
        call: ['rates(uint256)(uint256,uint256,uint256,uint48,uint256)', riskGroup.toNumber()],
        returns: [[`rates.pie`], [`rates.chi`], [`rates.interestRate`], [`rates.lastUpdated`], [`rates.fixedRate`]],
      },
      {
        target: tinlake.contractAddresses.PILE,
        call: ['debt(uint256)(uint256)', loanId],
        returns: [[`debt`, toBN]],
      },
    ]

    watcher.recreate(globalWatchers, multicallConfig)

    try {
      console.log('subscribing')
      watcher.batch().subscribe((updates: any[]) => {
        console.log(updates)
      })
      watcher.start()
    } catch (e) {
      console.error(e)
    }
    const loan = await getLoan(tinlake, loanId)

    dispatch({ loan, type: RECEIVE_LOAN })
  }
}
