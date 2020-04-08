import { createStore, combineReducers, applyMiddleware, compose } from 'redux';
import loansReducer from '../ducks/loans';
import investmentsReducer from '../ducks/investments';
import analyticsReducer from '../ducks/analytics';
import authReducer from '../ducks/auth';
import transactionReducer from '../ducks/transactions';
import thunk from 'redux-thunk';

declare global {
  interface Window { __REDUX_DEVTOOLS_EXTENSION_COMPOSE__: any; }
}
const composeEnhancers = typeof window !== 'undefined' &&
  window.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__ ?
  window.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__ : compose;

const makeStore = (initialState: any) => {
  return createStore(
    combineReducers(
      {
        loans: loansReducer,
        investments: investmentsReducer,
        analytics: analyticsReducer,
        auth: authReducer,
        transactions: transactionReducer
      },
    ),
    initialState,
    composeEnhancers(
      applyMiddleware(thunk),
    ),
  );
};

export default makeStore;
