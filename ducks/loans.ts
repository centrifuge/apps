import { AnyAction, Action } from 'redux';
import Tinlake, { Loan, BalanceDebt } from 'tinlake';
// tslint:disable-next-line:import-name
import BN from 'bn.js';
import getLoanStatus from '../utils/getLoanStatus';
import { ThunkAction } from 'redux-thunk';

// Actions
const LOAD = 'tinlake-ui/loans/LOAD';
const RECEIVE = 'tinlake-ui/loans/RECEIVE';

export interface InternalLoan extends Loan {
  loanId: number;
  balance: BN;
  debt: BN;
  status: string;
}

export interface LoansState {
  loading: boolean;
  loans: InternalLoan[];
}

const initialState: LoansState = {
  loading: false,
  loans: [],
};

// Reducer
export default function reducer(state: LoansState = initialState,
                                action: AnyAction = { type: '' }) {
  switch (action.type) {
    case LOAD: return { ...state, loading: true };
    case RECEIVE: return { ...state, loading: false, loans: action.payload };
    default: return state;
  }
}

// side effects, only as applicable
// e.g. thunks, epics, etc
export function getLoans(tinlake: Tinlake): ThunkAction<Promise<void>, LoansState, undefined,
  Action>  {
  return async (dispatch: (action: AnyAction) => Promise<any>) => {
    dispatch({ type: LOAD });

    const count = await tinlake.loanCount();

    const loanPromises: Promise<Loan>[] = [];
    const balanceDebtPromises: Promise<BalanceDebt>[] = [];

    for (let i = 0; i < count.toNumber(); i += 1) {
      loanPromises.push(tinlake.getLoan(i));
      balanceDebtPromises.push(tinlake.getBalanceDebt(i));
    }

    const loans = await Promise.all(loanPromises);
    const balanceDebtData = await Promise.all(balanceDebtPromises);

    const extendedLoansData = loans.map((loan, i) => {
      return ({
        loanId: i,
        principal: loan.principal,
        price: loan.price,
        registry: loan.registry,
        tokenId: loan.tokenId,
        balance: balanceDebtData[i].balance,
        debt: balanceDebtData[i].debt,
        status: getLoanStatus(loan.principal, balanceDebtData[i].debt),
      });
    });

    dispatch({ type: RECEIVE, payload: extendedLoansData });
  };
}
