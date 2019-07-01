import { createStore, combineReducers, applyMiddleware } from 'redux';
import loansReducer from '../ducks/loans';
import thunk from 'redux-thunk';

const makeStore = (initialState: any) => {
  return createStore(
    combineReducers(
      {
        loans: loansReducer,
      },
    ),
    initialState,
    applyMiddleware(thunk),
  );
};

export default makeStore;
