import React from 'react';
import { mount } from 'enzyme';
import { BrowserRouter } from 'react-router-dom';
import FundingRequestForm from './FundingRequestForm';
import { FundingRequest } from '../common/models/funding-request';
import { dateToString } from '../common/formaters';
import { Formik } from 'formik';
import { serializeSnapshot } from '../testing/serialize';


describe('RequestFundingForm', () => {

  const today = new Date('2019-06-05T00:00:00.000Z');
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

  const onDiscard = jest.fn(() => {
  });


  beforeAll(() => {
    onDiscard.mockClear();
    onSubmit.mockClear();
  });

  it('Should render the form', () => {
    const fundingRequest = new FundingRequest();
    fundingRequest.currency = 'USD';
    fundingRequest.invoice_id = '2222';
    fundingRequest.document_id = '0xsss';
    fundingRequest.invoice_amount = 1000;
    fundingRequest.repayment_due_date = dateToString(new Date(today));
    const fundingForm = mount(
      <FundingRequestForm fundingRequest={fundingRequest} today={today} contacts={contacts} onDiscard={onDiscard}
                          onSubmit={onSubmit}/>,
    );
    expect(serializeSnapshot(fundingForm)).toMatchSnapshot();
  });

  it('Should render form with sender default values and correctly calculate the computed values', () => {

    var date = new Date(today);
    date.setDate(date.getDate() + 27);

    const fundingRequest = {
      invoice_id: 'id',
      document_id: 'document',
      funder: contacts[0].value,
      agreement_id: 'SOMEID',
      amount: 0,
      days: 0,
      apr: 0.05,
      fee: 0.01,
      repayment_due_date: dateToString(date),
      repayment_amount: 1005,
      currency: 'USD',

    };

    const fundingForm = mount(
      <FundingRequestForm fundingRequest={fundingRequest}
                          today={today}
                          contacts={contacts}
                          onDiscard={onDiscard}
                          onSubmit={onSubmit}/>,
    );

    const amountInput = fundingForm.find(`input[name="amount"]`);
    expect(amountInput.props().value).toEqual('$991.18');

  });

  it('Should render form with sender default values and correctly calculate the computed values for days 31, apr 5% and fee 1%', () => {

    var date = new Date(today);
    date.setDate(date.getDate() + 30);

    const fundingRequest = {
      invoice_id: 'id',
      document_id: 'document',
      funder: contacts[0].value,
      agreement_id: 'SOMEID',
      amount: 0,
      days: 0,
      apr: 0.05,
      fee: 0.01,
      repayment_due_date: dateToString(date),
      repayment_amount: 1000,
      currency: 'EUR',

    };

    const fundingForm = mount(
      <FundingRequestForm fundingRequest={fundingRequest}
                          today={today}
                          contacts={contacts}
                          onDiscard={onDiscard}
                          onSubmit={onSubmit}/>,
    );

    const amountInput = fundingForm.find(`input[name="amount"]`);
    expect(amountInput.props().value).toEqual('€985.83');

  });

  it('Should render form with sender default values and correctly calculate the computed values for days 31, apr 5% and fee 0%', () => {

    var date = new Date(today);
    date.setDate(date.getDate() + 30);


    const fundingRequest = {
      invoice_id: 'id',
      document_id: 'document',
      funder: contacts[0].value,
      agreement_id: 'SOMEID',
      amount: 0,
      days: 0,
      apr: 0.05,
      fee: 0,
      repayment_due_date: dateToString(date),
      repayment_amount: 1000,
      currency: 'USD',

    };
    const fundingForm = mount(
      <FundingRequestForm fundingRequest={fundingRequest}
                          today={today}
                          contacts={contacts}
                          onDiscard={onDiscard}
                          onSubmit={onSubmit}/>,
    );

    const amountInput = fundingForm.find(`input[name="amount"]`);
    expect(amountInput.props().value).toEqual('$995.83');

  });


  it('Should call the callback functions', () => {

    var date = new Date(today);
    date.setDate(date.getDate() + 30);
    const fundingRequest = {
      invoice_id: 'id',
      document_id: 'document',
      funder: contacts[0].value,
      agreement_id: 'SOMEID',
      amount: 0,
      days: 0,
      apr: 0.05,
      fee: 0.01,
      repayment_due_date: dateToString(date),
      repayment_amount: 1000,
      currency: 'USD',

    };
    const fundingForm = mount(
      <FundingRequestForm fundingRequest={fundingRequest}
                          today={today}
                          contacts={contacts}
                          onDiscard={onDiscard}
                          onSubmit={onSubmit}/>,
    );

    const form = fundingForm.find(Formik);
    const discardButton = fundingForm.find(`[label="Discard"]`).first();
    discardButton.simulate('click');

    form.props().onSubmit(fundingRequest, {
      setSubmitting: () => {
      },
    });

    expect(onDiscard.mock.calls.length).toEqual(1);
    expect(onSubmit.mock.calls.length).toEqual(1);

  });

});
