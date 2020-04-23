import { AnyAction, Action } from 'redux';
import { ThunkAction } from 'redux-thunk';
import { getLoans, getLoan, TinlakeResult, Loan } from '../services/tinlake/actions';

// Actions
const LOAD = 'tinlake-ui/loans/LOAD';
const RECEIVE = 'tinlake-ui/loans/RECEIVE';
const LOAD_LOAN = 'tinlake-ui/loans/LOAD_LOAN';
const LOAN_NOT_FOUND = 'tinlake-ui/loans/LOAN_NOT_FOUND';
const RECEIVE_LOAN = 'tinlake-ui/loans/RECEIVE_LOAN';

export interface LoansState {
  loansState: null | 'loading' | 'found';
  loans: Loan[];
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
    case LOAD: return { ...state, loansState: 'loading' };
    case RECEIVE: return { ...state, loansState: 'found', loans: action.loans };
    case LOAD_LOAN: return { ...state, loanState: 'loading', loan: null };
    case LOAN_NOT_FOUND: return { ...state, loanState: 'not found' };
    case RECEIVE_LOAN: return { ...state, loanState: 'found', loan: action.loan };
    default: return state;
  }
}

export function loadLoans(tinlake: any):
  ThunkAction<Promise<void>, LoansState, undefined, Action>  {
  return async (dispatch) => {
    dispatch({ type: LOAD });
    const result = await getLoans(tinlake);
    dispatch({ type: RECEIVE, loans: result.data });
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
