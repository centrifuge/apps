import React from 'react';
import { shallow } from 'enzyme';

import Header from './Header';
import { Provider } from 'react-redux';
import { createStore } from 'redux';
import getRootReducer from './store/reducers';
import { User } from './common/models/user';

const store = createStore(getRootReducer({}),{router:{location: {pathname:'/'}}});

describe('Header', () => {

  const user = new User();
  const push = (route:string) => route;
  it('Should not render main menu', () => {
    const bodyShallow = shallow(
      <Provider store={store}>
        <Header selectedRoute={'/'} loggedInUser={null} push={push}/>
      </Provider>,
    );
    expect(bodyShallow).toMatchSnapshot();
  });

  it('Should render main menu', () => {
    const bodyShallow = shallow(
      <Provider store={store}>
        <Header selectedRoute={'/'} loggedInUser={user} push={push}/>
      </Provider>,
    );
    expect(bodyShallow).toMatchSnapshot();
  });
});
