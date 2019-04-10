import React from 'react';
import { shallow } from 'enzyme';

import Header from './Header';
import { Provider } from 'react-redux';
import { createStore } from 'redux';
import getRootReducer from './store/reducers';

const store = createStore(getRootReducer({}),{router:{location: {pathname:'/'}}});

describe('Header', () => {
  it('matches snapshot', () => {
    const bodyShallow = shallow(
      <Provider store={store}>
        <Header/>
      </Provider>,
    );
    expect(bodyShallow).toMatchSnapshot();
  });
});
