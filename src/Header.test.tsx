import React from 'react';
import Header from './Header';
import { Provider } from 'react-redux';
import { createStore } from 'redux';
import getRootReducer from './store/reducers';
import { User } from './common/models/user';
import renderer from 'react-test-renderer';
import { BrowserRouter } from "react-router-dom";
import invoicesRoutes from "./invoices/routes";
import contactsRoutes from "./contacts/routes";
import userRoutes from "./user/routes";

const store = createStore(getRootReducer({}),{router:{location: {pathname:'/'}}});

describe('Header', () => {

  const user = new User();
  const push = (route:string) => route;
  it('Should not render main menu', () => {
    const bodyShallow = renderer.create(

      <Provider store={store}>
        <BrowserRouter >
          <Header selectedRoute={'/'} menuItems={[]} push={push}/>
        </BrowserRouter>
      </Provider>,
    ).toJSON();
    expect(bodyShallow).toMatchSnapshot();
  });

  it('Should render main menu', () => {

    const commonItems = [
      { label: 'Invoices', route: invoicesRoutes.index },
      { label: 'Contacts', route: contactsRoutes.index },
      { label: 'Logout', route: userRoutes.logout, external: true },
    ];

    const bodyShallow = renderer.create(
      <Provider store={store}>
        <BrowserRouter >
          <Header selectedRoute={'/'} menuItems={commonItems} push={push}/>
        </BrowserRouter>
      </Provider>,
    ).toJSON();
    expect(bodyShallow).toMatchSnapshot();
  });
});
