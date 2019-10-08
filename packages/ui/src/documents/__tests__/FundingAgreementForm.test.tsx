import { mount, shallow } from 'enzyme';
import React from 'react';
import { Spinner } from '@centrifuge/axis-spinner';
import { Modal } from '@centrifuge/axis-modal';
import FundingRequestForm from '../FundingAgreementForm';
import { FundingAgreement } from '@centrifuge/gateway-lib/models/funding-request';
import { dateToString } from '@centrifuge/gateway-lib/utils/formaters';
import { defaultContacts } from '../../test-utilities/default-data';
import { NumberInput } from '@centrifuge/axis-number-input';
import { DateInput } from '@centrifuge/axis-date-input';
import { SearchSelect } from '@centrifuge/axis-search-select';
import { TextInput } from 'grommet';
import { withAxis } from '../../test-utilities/test-providers';


describe('Funding Agreement Form', () => {

  let location = '';

  const push = (path) => {
    location = path;
  };


  const onSubmit = jest.fn(() => {
  });

  const onDiscard = jest.fn(() => {
  });

  const today = new Date('2019-06-05T00:00:00.000Z');


  const getFundingAgreement = (days: number = 31) => {
    const fundingAgreement: FundingAgreement = new FundingAgreement();
    let date = new Date(today);
    date.setDate(date.getDate() + days);
    fundingAgreement.repayment_due_date = dateToString(date);
    return fundingAgreement;
  };

  beforeEach(() => {
    onSubmit.mockClear();
    onDiscard.mockClear();
  });

  it('Should render Funding Agreement form with proper calculated values', async () => {


    const fundingAgreement = getFundingAgreement(31);
    fundingAgreement.amount = '1000';

    const component = mount(
      withAxis(
        <FundingRequestForm
          onSubmit={onSubmit}
          onDiscard={onDiscard}
          contacts={defaultContacts}
          today={today}
          isViewMode={false}
          fundingAgreement={fundingAgreement}/>,
      ),
    );

    const amountField = component.find({ name: 'amount' }).find(NumberInput);
    const repaymentAmountField = component.find({ name: 'repayment_amount' }).find(NumberInput);
    const repaymentDueDateField = component.find({ name: 'repayment_due_date' }).find(DateInput);
    const feeField = component.find({ name: 'fee' }).find(NumberInput);
    expect(amountField.prop('value')).toBe('1000');
    expect(repaymentAmountField.prop('value')).toBe('1004.31');
    expect(repaymentDueDateField.prop('value')).toBe('2019-07-06');
    expect(feeField.prop('value')).toBe('4.31');

  });

  it('Should submit the form', async () => {

    const fundingAgreement = getFundingAgreement(31);
    fundingAgreement.amount = '1000';
    fundingAgreement.funder_id = defaultContacts[0].address!;

    const component = mount(
      withAxis(
        <FundingRequestForm
          onSubmit={onSubmit}
          onDiscard={onDiscard}
          contacts={defaultContacts}
          today={today}
          isViewMode={false}
          fundingAgreement={fundingAgreement}/>,
      ),
    );

    const submit = component.find({ label: 'Request' }).find('button');
    submit.simulate('click');
    // Form validator are async so we need wait a little
    await new Promise(r => setTimeout(r, 0));
    expect(onSubmit).toHaveBeenCalledTimes(1);
    expect(onSubmit).toHaveBeenCalledWith(fundingAgreement);

  });


  it('Should discard the form', async () => {

    const fundingAgreement = getFundingAgreement(31);
    fundingAgreement.amount = '1000';
    fundingAgreement.funder_id = defaultContacts[0].address!;

    const component = mount(
      withAxis(
        <FundingRequestForm
          onSubmit={onSubmit}
          onDiscard={onDiscard}
          contacts={defaultContacts}
          today={today}
          isViewMode={false}
          fundingAgreement={fundingAgreement}/>,
      ),
    );

    const discard = component.find({ label: 'Discard' }).find('button');
    discard.simulate('click');
    expect(onDiscard).toHaveBeenCalledTimes(1);


  });


  it('Should have all fields disabled in view mode', async () => {

    const fundingAgreement = getFundingAgreement(31);
    fundingAgreement.amount = '1000';
    fundingAgreement.funder_id = defaultContacts[0].address!;

    const component = mount(
      withAxis(
        <FundingRequestForm
          onSubmit={onSubmit}
          onDiscard={onDiscard}
          contacts={defaultContacts}
          today={today}
          isViewMode={true}
          fundingAgreement={fundingAgreement}/>,
      ),
    );


    expect(component.find({ disabled: true }).find(TextInput).length).toBe(9);
    expect(component.find({ disabled: true }).find(DateInput).length).toBe(2);
    expect(component.find({ disabled: true }).find(SearchSelect).length).toBe(1);
    expect(component.find({ disabled: true }).find(NumberInput).length).toBe(4);

  });


});


