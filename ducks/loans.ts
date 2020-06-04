import { AnyAction, Action } from 'redux';
import { ThunkAction } from 'redux-thunk';
import { Loan } from 'tinlake';
import { getLoan, TinlakeResult } from '../services/tinlake/actions';
import Apollo from '../services/apollo';
import Tinlake from 'tinlake/dist/Tinlake';
import { HYDRATE } from 'next-redux-wrapper';

// SortableLoan adds properties of number type that support sorting in numerical order for grommet DataTable
export interface SortableLoan extends Loan {
  debtNum: number;
  principalNum: number;
  interestRateNum: number;
}

// Actions
const LOAD = 'tinlake-ui/loans/LOAD';
const RECEIVE = 'tinlake-ui/loans/RECEIVE';
const LOAD_LOAN = 'tinlake-ui/loans/LOAD_LOAN';
const LOAN_NOT_FOUND = 'tinlake-ui/loans/LOAN_NOT_FOUND';
const RECEIVE_LOAN = 'tinlake-ui/loans/RECEIVE_LOAN';

export interface LoansState {
  loansState: null | 'loading' | 'found';
  loans: SortableLoan[];
  loanState: null | 'loading' | 'not found' | 'found';
  loan: null | Loan;
}

const initialState: LoansState = {
  loansState: null,
  loans: [],
  loanState: null,
  loan: null
};

// Reducer
export default function reducer(state: LoansState = initialState,
                                action: AnyAction = { type: '' }): LoansState {
  switch (action.type) {
    case HYDRATE: return { ...state, ...(action.payload.loans || {}) };
    case LOAD: return { ...state, loansState: 'loading' };
    case RECEIVE: return { ...state, loansState: 'found', loans: action.loans };
    case LOAD_LOAN: return { ...state, loanState: 'loading', loan: null };
    case LOAN_NOT_FOUND: return { ...state, loanState: 'not found' };
    case RECEIVE_LOAN: return { ...state, loanState: 'found', loan: action.loan };
    default: return state;
  }
}

// hardcoded root just for testing - will be removed in next pr
export function loadLoans(tinlake: Tinlake):
  ThunkAction<Promise<void>, LoansState, undefined, Action>  {
  return async (dispatch) => {
    dispatch({ type: LOAD });
    const root = tinlake.contractAddresses['ROOT_CONTRACT'];
    if (root === undefined) {
      throw new Error('could not get ROOT_CONTRACT address');
    }
    const result = await Apollo.getLoans(root);

    const loans: SortableLoan[] = result.data.map((l: Loan) => ({
      ...l,
      debtNum: parseFloat(l.debt.toString()),
      principalNum: parseFloat(l.principal.toString()),
      interestRateNum: parseFloat(l.interestRate.toString())
    }));

    dispatch({ loans, type: RECEIVE });
  };
}

export function loadLoan(tinlake: any, loanId: string, refresh = false):
  ThunkAction<Promise<void>, LoansState, undefined, Action> {
  return async (dispatch) => {
    if (!refresh) {
      dispatch({ type: LOAD_LOAN });
    }
    const result : TinlakeResult  = await getLoan(tinlake, loanId);
    if (result.errorMsg || !result.data) {
      dispatch({ type: LOAN_NOT_FOUND });
      return;
    }
    dispatch({ type: RECEIVE_LOAN, loan: result.data });

  };
}
