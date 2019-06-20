import React from 'react';
import { mount } from 'enzyme';
import renderer from 'react-test-renderer';
import { BrowserRouter } from 'react-router-dom';
import FundingRequestForm from './FundingRequestForm';
import { FundingRequest } from '../common/models/funding-request';
import { dateToString } from '../common/formaters';
import { Formik } from 'formik';

describe('RequestFundingForm', () => {

  const today = new Date('2019-06-05T00:00:00.000Z')
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

  it('Should render empty form', () => {
    const fundingRequest = new FundingRequest();
    const bodyShallow = renderer.create(
      <FundingRequestForm fundingRequest={fundingRequest} contacts={contacts} onDiscard={onDiscard}
                          onSubmit={onSubmit}/>,
    ).toJSON();
    expect(bodyShallow).toMatchSnapshot();
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

    const fundingForm = renderer.create(
      <FundingRequestForm fundingRequest={fundingRequest}
                          today={today}
                          contacts={contacts}
                          onDiscard={onDiscard}
                          onSubmit={onSubmit}/>,
    );

    const repaymentDateInput = fundingForm.root.findByProps({ name: 'amount' });
    expect(repaymentDateInput.props.value).toEqual('991.18');
    expect(fundingForm.toJSON()).toMatchSnapshot();

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
      currency: 'USD',

    };

    const fundingForm = renderer.create(
      <FundingRequestForm fundingRequest={fundingRequest}
                          today={today}
                          contacts={contacts}
                          onDiscard={onDiscard}
                          onSubmit={onSubmit}/>,
    );

    const repaymentDateInput = fundingForm.root.findByProps({ name: 'amount' });
    expect(repaymentDateInput.props.value).toEqual('985.83');
    expect(fundingForm.toJSON()).toMatchSnapshot();

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
    const fundingForm = renderer.create(
      <FundingRequestForm fundingRequest={fundingRequest}
                          today={today}
                          contacts={contacts}
                          onDiscard={onDiscard}
                          onSubmit={onSubmit}/>,
    );

    const repaymentDateInput = fundingForm.root.findByProps({ name: 'amount' });
    expect(repaymentDateInput.props.value).toEqual('995.83');
    expect(fundingForm.toJSON()).toMatchSnapshot();

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
    const fundingForm = renderer.create(
      <FundingRequestForm fundingRequest={fundingRequest}
                          today={today}
                          contacts={contacts}
                          onDiscard={onDiscard}
                          onSubmit={onSubmit}/>,
    );

    const form = fundingForm.root.findByType(Formik);
    const discardButton = fundingForm.root.findByProps({ label: 'Discard' });

    form.props.onSubmit(fundingRequest, {
      setSubmitting: () => {
      },
    });
    discardButton.props.onClick();

    expect(onDiscard.mock.calls.length).toEqual(1);
    expect(onSubmit.mock.calls.length).toEqual(1);


  });


});
