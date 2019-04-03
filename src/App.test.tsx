import React from 'react';
import ReactDOM from 'react-dom';
import { MemoryRouter } from 'react-router';
import { Provider } from 'react-redux';
import { createStore } from 'redux';

import getRootReducer from './store/reducers';
import App from './App';

const store = createStore(getRootReducer({}));

it('renders without crashing', () => {
  const div = document.createElement('div');
  ReactDOM.render(
    <Provider store={store}>
      <MemoryRouter>
        <App />
      </MemoryRouter>
    </Provider>,
    div,
  );
  ReactDOM.unmountComponentAtNode(div);
});
