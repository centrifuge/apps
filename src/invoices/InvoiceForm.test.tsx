import React from 'react';
import { mount } from 'enzyme';
import renderer from 'react-test-renderer';
import InvoiceForm from './InvoiceForm';
import { BrowserRouter } from 'react-router-dom';
import { serializeSnapshot } from '../testing/serialize';

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

  it('Should render empty form', () => {
    const invoice = {
      currency:'USD',
    };
    const form = mount(
        <InvoiceForm invoice={invoice} contacts={contacts} onCancel={onCancel} onSubmit={onSubmit}/>
    )
  });

  it('Should render form with sender and recipient selected', () => {
    const invoice = {
      sender: contacts[0].value,
      recipient: contacts[1].value,
      currency:'USD',
    };
    const form = mount(
        <InvoiceForm invoice={invoice} contacts={contacts} onCancel={onCancel} onSubmit={onSubmit}/>
    );
    expect(serializeSnapshot(form)).toMatchSnapshot();
  });


});
