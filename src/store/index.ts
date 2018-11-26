import { createStore, applyMiddleware, compose } from 'redux';
import { createBrowserHistory } from 'history';
import createSagaMiddleware from 'redux-saga';
import { routerMiddleware } from 'connected-react-router';

import createRootReducer from '../reducers';
import sagas from '../sagas';

const sagasMiddleware = createSagaMiddleware();

export const history = createBrowserHistory();

const store = createStore(
  createRootReducer(history),
  compose(applyMiddleware(routerMiddleware(history), sagasMiddleware)),
);

sagasMiddleware.run(sagas);

export default store;
