import React from 'react';
import { mount } from 'enzyme';
import renderer from 'react-test-renderer';
import { createStore } from 'redux';
import getRootReducer from './../store/reducers';
import InvoiceForm from './InvoiceForm';

const store = createStore(getRootReducer({}), { router: { location: { pathname: '/' } } });

describe('InvoiceForm', () => {


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

  const onSubmit = jest.fn(() => {

  });

  const onCancel = jest.fn(() => {

  });

  it('Should not render empty form', () => {
    const invoice = {};
    const bodyShallow = renderer.create(
      <InvoiceForm invoice={invoice}  contacts={contacts} onCancel={onCancel} onSubmit={onSubmit}/>,
    ).toJSON();
    expect(bodyShallow).toMatchSnapshot();
  });

  it('Should not render form with sender and recipient selected', () => {
    const invoice = {
      sender: contacts[0].value,
      recipient: contacts[1].value,
    };
    const bodyShallow = renderer.create(
      <InvoiceForm invoice={invoice}  contacts={contacts} onCancel={onCancel} onSubmit={onSubmit}/>,
    ).toJSON();
    expect(bodyShallow).toMatchSnapshot();
  });


});
