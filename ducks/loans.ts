import { AnyAction, Action } from 'redux';
import Tinlake, { Loan, BalanceDebt, Address } from 'tinlake';
import BN from 'bn.js';
import getLoanStatus, { LoanStatus } from '../utils/getLoanStatus';
import { ThunkAction } from 'redux-thunk';
import { bnToHex } from '../utils/bnToHex';

// Config
const startingLoanId = 42;

// Actions
const LOAD = 'tinlake-ui/loans/LOAD';
const RECEIVE = 'tinlake-ui/loans/RECEIVE';
const LOAD_SINGLE = 'tinlake-ui/loans/LOAD_SINGLE';
const LOAD_SINGLE_NOT_FOUND = 'tinlake-ui/loans/LOAD_SINGLE_NOT_FOUND';
const RECEIVE_SINGLE = 'tinlake-ui/loans/RECEIVE_SINGLE';

export interface InternalLoan extends Loan {
  loanId: string;
  balance: BN;
  debt: BN;
  fee: BN;
  status: LoanStatus;
  nftOwner: Address;
  loanOwner: Address;
}

export interface LoansState {
  loansState: null | 'loading' | 'found';
  loans: InternalLoan[];
  singleLoanState: null | 'loading' | 'not found' | 'found';
  singleLoan: null | InternalLoan;
}

const initialState: LoansState = {
  loansState: null,
  loans: [],
  singleLoanState: null,
  singleLoan: null,
};

// Reducer
export default function reducer(state: LoansState = initialState,
                                action: AnyAction = { type: '' }): LoansState {
  switch (action.type) {
    case LOAD: return { ...state, loansState: 'loading' };
    case RECEIVE: return { ...state, loansState: 'found', loans: action.loans };
    case LOAD_SINGLE: return { ...state, singleLoanState: 'loading', singleLoan: null };
    case LOAD_SINGLE_NOT_FOUND: return { ...state, singleLoanState: 'not found' };
    case RECEIVE_SINGLE: return { ...state, singleLoanState: 'found', singleLoan: action.loan };
    default: return state;
  }
}

// side effects, only as applicable
// e.g. thunks, epics, etc
export function getLoans(tinlake: Tinlake):
  ThunkAction<Promise<void>, LoansState, undefined, Action>  {
  return async (dispatch) => {
    dispatch({ type: LOAD });

    const count = await tinlake.loanCount();

    const loanPromises: Promise<Loan>[] = [];
    const balanceDebtPromises: Promise<BalanceDebt>[] = [];

    for (let i = startingLoanId; i < count.toNumber(); i += 1) {
      loanPromises.push(tinlake.getLoan(`${i}`));
      balanceDebtPromises.push(tinlake.getBalanceDebt(`${i}`));
    }

    const loans = await Promise.all(loanPromises);
    const balanceDebtData = await Promise.all(balanceDebtPromises);

    const nftOwnerPromises: Promise<Address>[] = [];
    const loanOwnerPromises: Promise<Address>[] = [];
    for (let i = 0; i < count.toNumber() - startingLoanId; i += 1) {
      nftOwnerPromises.push(tinlake.ownerOfNFT(bnToHex(loans[i].tokenId)));
      loanOwnerPromises.push(tinlake.ownerOfLoan(`${i + startingLoanId}`));
    }
    const nftOwners: Address[] = [];
    const loanOwners: Address[] = [];
    for (let i = 0; i < count.toNumber() - startingLoanId; i += 1) {
      try {
        nftOwners[i] = await nftOwnerPromises[i];
      } catch (e) {
        console.warn(`Could not get NFT owner for Loan ID ${i + startingLoanId}, ` +
        `NFT ID ${bnToHex(loans[i].tokenId)}`);
        nftOwners[i] = '';
      }
      try {
        loanOwners[i] = await loanOwnerPromises[i];
      } catch (e) {
        console.warn(`Could not get loan owner for Loan ID ${i + startingLoanId}, ` +
          `NFT ID ${bnToHex(loans[i].tokenId)}`);
        loanOwners[i] = '';
      }
    }

    const extendedLoansData: InternalLoan[] = loans.map((loan, i) => {
      return ({
        loanId: `${i + startingLoanId}`,
        loanOwner: loanOwners[i],
        nftOwner: nftOwners[i],
        principal: loan.principal,
        price: loan.price,
        fee: balanceDebtData[i].fee,
        registry: loan.registry,
        tokenId: loan.tokenId,
        balance: balanceDebtData[i].balance,
        debt: balanceDebtData[i].debt,
        status: getLoanStatus(loan.principal, balanceDebtData[i].debt),
      });
    });

    dispatch({ type: RECEIVE, loans: extendedLoansData });
  };
}

export function getLoan(tinlake: Tinlake, loanId: string):
  ThunkAction<Promise<void>, LoansState, undefined, Action> {
  return async (dispatch) => {
    dispatch({ type: LOAD_SINGLE });

    const count = await tinlake.loanCount();

    if (count.toNumber() <= Number(loanId)) {
      dispatch({ type: LOAD_SINGLE_NOT_FOUND });
    }

    const [loan, balanceDebtData] = await Promise.all([
      tinlake.getLoan(loanId),
      tinlake.getBalanceDebt(loanId),
    ]);

    const nftOwnerPromise = tinlake.ownerOfNFT(bnToHex(loan.tokenId));
    const loanOwnerPromise = tinlake.ownerOfLoan(loanId);

    let nftOwner: Address;
    let loanOwner: Address;
    try {
      nftOwner = await nftOwnerPromise;
    } catch (e) {
      console.warn(`Could not get NFT owner for Loan ID ${loanId}, ` +
        `NFT ID ${loan.tokenId.toString()}`);
      nftOwner = '';
    }
    try {
      loanOwner = await loanOwnerPromise;
    } catch (e) {
      console.warn(`Could not get loan owner for Loan ID ${loanId}, ` +
        `NFT ID ${loan.tokenId.toString()}`);
      loanOwner = '';
    }

    const extendedLoanData: InternalLoan = {
      loanId,
      nftOwner,
      loanOwner,
      principal: loan.principal,
      price: loan.price,
      fee: balanceDebtData.fee,
      registry: loan.registry,
      tokenId: loan.tokenId,
      balance: balanceDebtData.balance,
      debt: balanceDebtData.debt,
      status: getLoanStatus(loan.principal, balanceDebtData.debt),
    };

    dispatch({ type: RECEIVE_SINGLE, loan: extendedLoanData });
  };
}
