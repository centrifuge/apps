import React from 'react';
import { mount } from 'enzyme';
import renderer from 'react-test-renderer';
import { BrowserRouter } from 'react-router-dom';
import FundingRequestForm from './FundingRequestForm';
import { FundingRequest } from '../common/models/funding-request';
import { dateFormatter } from '../common/formaters';
import { Formik } from 'formik';

describe('RequestFundingForm', () => {


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

    var date = new Date();
    date.setDate(date.getDate() + 27);

    const fundingRequest = {
      invoice_id: 'id',
      document_id: 'document',
      funder: contacts[0].value,
      wallet_address: '0x9967094155de5A4D3969b69071B9F601Ac25f89e',
      funding_id: 'SOMEID',
      amount: 1000,
      days: 0,
      apr: 5,
      fee: 1,
      repayment_due_date: dateFormatter(date),
      repayment_amount: 0,
      currency: 'USD',

    };

    const fundingForm = renderer.create(
      <FundingRequestForm fundingRequest={fundingRequest} contacts={contacts} onDiscard={onDiscard}
                          onSubmit={onSubmit}/>,
    );

    const repaymentDateInput = fundingForm.root.findByProps({ name: 'repayment_amount' });
    expect(repaymentDateInput.props.value).toEqual('1013.70');
    expect(fundingForm.toJSON()).toMatchSnapshot();

  });

  it('Should render form with sender default values and correctly calculate the computed values for days 31, apr 5% and fee 1%', () => {

    var date = new Date();
    date.setDate(date.getDate() + 31);

    const fundingRequest = {
      invoice_id: 'id',
      document_id: 'document',
      funder: contacts[0].value,
      wallet_address: '0x9967094155de5A4D3969b69071B9F601Ac25f89e',
      funding_id: 'SOMEID',
      amount: 1000,
      days: 0,
      apr: 5,
      fee: 1,
      repayment_due_date: dateFormatter(date),
      repayment_amount: 0,
      currency: 'USD',

    };

    const fundingForm = renderer.create(
      <FundingRequestForm fundingRequest={fundingRequest} contacts={contacts} onDiscard={onDiscard}
                          onSubmit={onSubmit}/>,
    );

    const repaymentDateInput = fundingForm.root.findByProps({ name: 'repayment_amount' });
    expect(repaymentDateInput.props.value).toEqual('1014.25');
    expect(fundingForm.toJSON()).toMatchSnapshot();

  });

  it('Should render form with sender default values and correctly calculate the computed values for days 31, apr 5% and fee 0%', () => {

    var date = new Date();
    date.setDate(date.getDate() + 31);

    const fundingRequest = {
      invoice_id: 'id',
      document_id: 'document',
      funder: contacts[0].value,
      wallet_address: '0x9967094155de5A4D3969b69071B9F601Ac25f89e',
      funding_id: 'SOMEID',
      amount: 1000,
      days: 0,
      apr: 5,
      fee: 0,
      repayment_due_date: dateFormatter(date),
      repayment_amount: 0,
      currency: 'USD',

    };
    const fundingForm = renderer.create(
      <FundingRequestForm fundingRequest={fundingRequest} contacts={contacts} onDiscard={onDiscard}
                          onSubmit={onSubmit}/>,
    );

    const repaymentDateInput = fundingForm.root.findByProps({ name: 'repayment_amount' });
    expect(repaymentDateInput.props.value).toEqual('1004.25');
    expect(fundingForm.toJSON()).toMatchSnapshot();

  });


  it('Should call the callback functions', () => {

    var date = new Date();
    date.setDate(date.getDate() + 31);

    const fundingRequest = {
      invoice_id: 'id',
      document_id: 'document',
      funder: contacts[0].value,
      wallet_address: '0x9967094155de5A4D3969b69071B9F601Ac25f89e',
      funding_id: 'SOMEID',
      amount: 1000,
      days: 0,
      apr: 5,
      fee: 1,
      repayment_due_date: dateFormatter(date),
      repayment_amount: 0,
      currency: 'USD',

    };
    const fundingForm = renderer.create(
      <FundingRequestForm fundingRequest={fundingRequest} contacts={contacts} onDiscard={onDiscard}
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
