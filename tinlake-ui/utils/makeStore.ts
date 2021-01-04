import * as Sentry from '@sentry/react'
import { applyMiddleware, combineReducers, compose, createStore } from 'redux'
import thunk from 'redux-thunk'
import config from '../config'
import authReducer from '../ducks/auth'
import investmentsReducer from '../ducks/investments'
import loansReducer from '../ducks/loans'
import poolReducer from '../ducks/pool'
import poolsReducer from '../ducks/pools'
import rewardsReducer from '../ducks/rewards'
import transactionReducer from '../ducks/transactions'
import userRewardsReducer from '../ducks/userRewards'

const sentryReduxEnhancer = config.enableErrorLogging ? Sentry.createReduxEnhancer({}) : {}

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
      rewards: rewardsReducer,
      userRewards: userRewardsReducer,
    }),
    composeEnhancers(applyMiddleware(thunk))
  )
}

export default makeStore
