import * as Sentry from '@sentry/react'
import { applyMiddleware, combineReducers, compose, createStore } from 'redux'
import thunk from 'redux-thunk'
import config from '../config'
import authReducer from '../ducks/auth'
import centChainWalletReducer from '../ducks/centChainWallet'
import transactionReducer from '../ducks/transactions'

const sentryReduxEnhancer = config.enableErrorLogging ? Sentry.createReduxEnhancer({}) : {}

declare global {
  // eslint-disable-next-line no-unused-vars
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
      auth: authReducer,
      transactions: transactionReducer,
      centChainWallet: centChainWalletReducer,
    }),
    composeEnhancers(applyMiddleware(thunk))
  )
}

export default makeStore
