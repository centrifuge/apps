import { createStore, combineReducers, applyMiddleware, compose } from 'redux'
import * as Sentry from '@sentry/react'

import poolsReducer from '../ducks/pools'
import loansReducer from '../ducks/loans'
import investmentsReducer from '../ducks/investments'
import poolReducer from '../ducks/pool'
import authReducer from '../ducks/auth'
import thunk from 'redux-thunk'
import transactionReducer from '../ducks/transactions'

const sentryReduxEnhancer = Sentry.createReduxEnhancer({})

declare global {
  interface Window {
    __REDUX_DEVTOOLS_EXTENSION_COMPOSE__: any
  }
}
const composeEnhancers =
  typeof window !== 'undefined' && window.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__
    ? window.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__
    : compose

const makeStore = () => {
  return createStore(
    combineReducers({
      sentryReduxEnhancer,
      pools: poolsReducer,
      loans: loansReducer,
      investments: investmentsReducer,
      pool: poolReducer,
      auth: authReducer,
      transactions: transactionReducer,
    }),
    composeEnhancers(applyMiddleware(thunk))
  )
}

export default makeStore
