import React from 'react';
import { mount } from 'enzyme';
import renderer from 'react-test-renderer';
import { BrowserRouter } from 'react-router-dom';
import { InvoiceDetails } from './InvoiceDetails';
import { createStore } from 'redux';
import getRootReducer from '../store/reducers';
import { AxisTheme } from '@centrifuge/axis-theme';
import { Grommet } from 'grommet';


const DynamicParamInvoiceDetails = InvoiceDetails as any;
const store = createStore(getRootReducer({}), { router: { location: { pathname: '/' } } });
describe('InvoiceDetails', () => {

  const methods = {
    getInvoiceById: jest.fn(() => {
    }),
    resetGetInvoiceById: jest.fn(() => {
    }),
    getContacts: jest.fn(() => {
    }),
    resetGetContacts: jest.fn(() => {
    }),
  };

  const routerProps = {
    match: {
      params: {
        id: '3333',
      },
    },
  };


  it('Should not render an empty form', () => {
    const invoice = {};
    const contacts = [
      {
        label: 'Alice',
        value: '0x1111',
      },
      {
        label: 'Bob',
        value: '0x1112',
      },
    ];
    const bodyShallow = renderer.create(
      // TODO Test fails when using Axis Theme. Investigate!!!
      <AxisTheme>
        <BrowserRouter>
          <DynamicParamInvoiceDetails
            invoice={invoice}
            contacts={contacts}
            {...methods}
            {...routerProps}

          />
        </BrowserRouter>
      </AxisTheme>,
    ).toJSON();
    expect(bodyShallow).toMatchSnapshot();
  });


  it('Should render the form with proper values for contact fields', () => {
    const invoice = {
      sender: "0x1111",
      recipient:"0x1111",
      payee:"0x11112"
    };
    const contacts = [
      {
        label: 'Alice',
        value: '0x1111',
      },
      {
        label: 'Bob',
        value: '0x11112',
      },
    ];
    const bodyShallow = renderer.create(
      <AxisTheme>
        <BrowserRouter>
          <DynamicParamInvoiceDetails
            invoice={invoice}
            contacts={contacts}
            {...methods}
            {...routerProps}

          />
        </BrowserRouter>
      </AxisTheme>,
    ).toJSON();
    expect(bodyShallow).toMatchSnapshot();
  });

  it('Should render the loading state', () => {
    const invoice = null;
    const contacts = [
      {
        label: 'Alice',
        value: '0x1111',
      },
      {
        label: 'Bob',
        value: '0x11112',
      },
    ];
    const bodyShallow = renderer.create(
      <AxisTheme>
        <BrowserRouter>
          <DynamicParamInvoiceDetails
            invoice={invoice}
            contacts={contacts}
            {...methods}
            {...routerProps}

          />
        </BrowserRouter>
      </AxisTheme>,
    ).toJSON();
    expect(bodyShallow).toMatchSnapshot();
  });


});
