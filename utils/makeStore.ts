import { createStore, combineReducers, applyMiddleware, compose } from 'redux';
import loansReducer from '../ducks/loans';
import dashboardReducer from '../ducks/dashboard';
import authReducer from '../ducks/auth';
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
        dashboard: dashboardReducer,
        auth: authReducer
      },
    ),
    initialState,
    composeEnhancers(
      applyMiddleware(thunk),
    ),
  );
};

export default makeStore;
