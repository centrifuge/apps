import React from 'react';
import Header from './Header';
import { Provider } from 'react-redux';
import { createStore } from 'redux';
import getRootReducer from './store/reducers';
import { User } from './common/models/user';
import renderer from 'react-test-renderer';
import { BrowserRouter } from 'react-router-dom';
import routes from './routes';
import { AxisTheme } from '@centrifuge/axis-theme';

const store = createStore(getRootReducer({}), { router: { location: { pathname: '/' } } });

describe('Header', () => {

  const user = new User();
  const push = (route: string) => route;
  it('Should render an empty header', () => {
    const bodyShallow = renderer.create(
      <Provider store={store}>
        <BrowserRouter>
          <Header selectedRoute={'/'} menuItems={[]} user={null} push={push}/>
        </BrowserRouter>
      </Provider>,
    ).toJSON();
    expect(bodyShallow).toMatchSnapshot();
  });

  it('Should render the Header', () => {

    const items = [
      { label: 'Invoices', route: routes.invoices.index },
      { label: 'Contacts', route: routes.contacts.index },
      { label: 'Logout', route: routes.user.logout, external: true, secondary: true },
    ];

    const user = new User();
    user.account = '0x33333';

    const bodyShallow = renderer.create(
      <Provider store={store}>
        <BrowserRouter>
          <AxisTheme>
            <Header selectedRoute={'/'} user={user} menuItems={items} push={push}/>
          </AxisTheme>
        </BrowserRouter>
      </Provider>
  ,
  ).toJSON();
  expect(bodyShallow).toMatchSnapshot();
  });

  });
