import React from 'react';
import { mount } from 'enzyme';
import { BrowserRouter } from 'react-router-dom';
import { SearchSelect } from '@centrifuge/axis-search-select';
import { Anchor, Button, DataTable } from 'grommet';
import { FundingAgreements } from '../FundingAgreements';
import { defaultContacts, defaultUser } from '../../test-utilities/default-data';
import { getFundingStatus } from '@centrifuge/gateway-lib/utils/status';
import { FundingAgreement } from '@centrifuge/gateway-lib/models/funding-request';
import FundingAgreementForm from '../FundingAgreementForm';
import { withAllProvidersAndContexts } from '../../test-utilities/test-providers';

jest.mock('../../http-client');
const httpClient = require('../../http-client').httpClient;

describe('Funding Agreements', () => {


  const document = {
    _id: 'first_id',
    header: {
      document_id: '0xRandomDocumentId',
      nfts: [
        {
          owner: 'Owner of first nft',
          registry: '0xFirstRegistry',
          token_id: '0xFirstTokenId',
        },
        {
          owner: 'Owner of second nft',
          registry: '0xSecondRegistry',
          token_id: '0xSecondTokenId',
        },
      ],
    },
    createdAt: new Date('2019-07-09T10:54:59.900Z'),
    attributes: {

      ['_schema']: {
        key:
          '0x9ed63b1df0c1b6dc14b777a767ccb0562b7a0adf6f51bf0d90476f6833005f9a',
        type: 'string',
        value: 'first_schema',
      },

      ['reference_id']: {
        key:
          '0x9ed63b1df0c1b6dc14b777a767ccb0562b7a0adf6f51bf0d90476f6833005f9a',
        type: 'string',
        value: 'reference nr1',
      },

      ['customer']: {
        key:
          '0x9ed63b1df0c1b6dc14b777a767ccb0562b7a0adf6f51bf0d90476f6833005f9a',
        type: 'string',
        value: 'some customer',
      },

      ['percent']: {
        key:
          '0x9ed63b1df0c1b6dc14b777a767ccb0562b7a0adf6f51bf0d90476f6833005f9a',
        type: 'decimal',
        value: '100',
      },
      ['amount']: {
        key:
          '0x9ed63b1df0c1b6dc14b777a767ccb0562b7a0adf6f51bf0d90476f6833005f9a',
        type: 'decimal',
        value: '100',
      },
      funding_agreement: [{
        'agreement_id': {
          'type': 'bytes',
          'value': '0x9278be3cacb26915a61a8a2f4fb4d2aa92c062f4c8b596ef7794d0da879b0f7b',
          'key': '0x9ed63b1df0c1b6dc14b777a767ccb0562b7a0adf6f51bf0d90476f6833005f9a',
        },
        'amount': {
          'type': 'decimal',
          'value': '998.06',
          'key': '0x38ed5f156745e6b3ecf3cbf732b76d4119c4ddf9c074b51d328d42569b713171',
        },
        'apr': {
          'type': 'string',
          'value': '0.05',
          'key': '0x094d09cadf3e998f149fa9334f6d5529f574d86f421c02baa191e195e9579a20',
        },
        'borrower_id': {
          'type': 'bytes',
          'value': '0xc910ec8509ebee65d35fa05c5b0c574070d479ad',
          'key': '0xba27f11f43e661412a7f99e46c40495883188004dc9eb0058512fee7a4f9c227',
        },
        'currency': {
          'type': 'string',
          'value': 'USD',
          'key': '0x76b167150821030a27099f3a7fbc1e8d9ad0507c6ceb5b587ec9bce8db700d2b',
        },
        'days': {
          'type': 'integer',
          'value': '14',
          'key': '0xc52d7fa32b32b65473530f3c70ce6570726a6b7374723fe60ee55df368900c1e',
        },
        'fee': {
          'type': 'decimal',
          'value': '0',
          'key': '0x1d9ba21ec138d66900e8fb2af32da4654284d885a6b82e12062cbcbb14d51314',
        },
        'funder_id': {
          'type': 'bytes',
          'value': '0xe68f93649e5c33db110a8263df4eac74cea7b4ed',
          'key': '0xd0134f74e2b1a6b10581035fc5289d5566dc51353ccebc3693cf3b5f251fef9e',
        },
        'repayment_amount': {
          'type': 'decimal',
          'value': '1000',
          'key': '0x028568263c48c17b3276c92e2eeb82745056f4527de87dce01bbc4718ffdd1f4',
        },
        'repayment_due_date': {
          'type': 'timestamp',
          'value': '2019-09-30T15:47:26.589Z',
          'key': '0xdad32b28d3934a76fc119f48a47842bcba9168822df33eed16cde456e5e0468f',
        },
        'signatures': [{
          'type': 'signed',
          'value': '0xc910ec8509eBee65D35FA05C5b0C574070D479AD',
          'key': '0x51be0f0b963b709925026915cb1149c3c9bcd8caf2d947c4b8373530e0b9c595',
        }],
      }, {
        'agreement_id': {
          'type': 'bytes',
          'value': '0x9278be3cacb26915a61a8a2f4fb4d2aa92c062f4c8b596ef7794d0da879b0f7b',
          'key': '0x9ed63b1df0c1b6dc14b777a767ccb0562b7a0adf6f51bf0d93476f6833005f9a',
        },
        'amount': {
          'type': 'decimal',
          'value': '998.06',
          'key': '0x38ed5f156745e6b3ecf3cbf732b76d4119c4ddf9c074b51d328d42569b713171',
        },
        'apr': {
          'type': 'string',
          'value': '0.05',
          'key': '0x094d09cadf3e998f149fa9334f6d5529f574d86f421c02baa191e195e9579a20',
        },
        'borrower_id': {
          'type': 'bytes',
          'value': '0xc910ec8509ebee65d35fa05c5b0c574070d479ad',
          'key': '0xba27f11f43e661412a7f99e46c40495883188004dc9eb0058512fee7a4f9c227',
        },
        'currency': {
          'type': 'string',
          'value': 'USD',
          'key': '0x76b167150821030a27099f3a7fbc1e8d9ad0507c6ceb5b587ec9bce8db700d2b',
        },
        'days': {
          'type': 'integer',
          'value': '14',
          'key': '0xc52d7fa32b32b65473530f3c70ce6570726a6b7374723fe60ee55df368900c1e',
        },
        'fee': {
          'type': 'decimal',
          'value': '0',
          'key': '0x1d9ba21ec138d66900e8fb2af32da4654284d885a6b82e12062cbcbb14d51314',
        },
        'funder_id': {
          'type': 'bytes',
          'value': '0xSomeFunderId',
          'key': '0xd0134f74e2b1a6b10581035fc5289d5566dc51353ccebc3693cf3b5f251fef9e',
        },
        'repayment_amount': {
          'type': 'decimal',
          'value': '1000',
          'key': '0x028568263c48c17b3276c92e2eeb82745056f4527de87dce01bbc4718ffdd1f4',
        },
        'repayment_due_date': {
          'type': 'timestamp',
          'value': '2019-09-30T15:47:26.589Z',
          'key': '0xdad32b28d3934a76fc119f48a47842bcba9168822df33eed16cde456e5e0468f',
        },
        'signatures': [{
          'type': 'signed',
          'value': '0xc910ec8509eBee65D35FA05C5b0C574070D479AD',
          'key': '0x51be0f0b963b709925026915cb1149c3c9bcd8caf2d947c4b8373530e0b9c595',
        }],
      }],
    },
  };


  const onAsyncStart = jest.fn((message) => {
  });

  const onAsyncComplete = jest.fn((data) => {
  });

  const onAsyncError = jest.fn((error, title) => {

  });


  beforeEach(() => {
    onAsyncStart.mockClear();
    onAsyncComplete.mockClear();
    onAsyncError.mockClear();
  });


  it('Should render a Datatable with 2 funding Agreemtns and no request funding action', () => {

    const component = mount(
      withAllProvidersAndContexts(
        <FundingAgreements
          document={document}
          onAsyncStart={onAsyncStart}
          onAsyncComplete={onAsyncComplete}
          onAsyncError={onAsyncError}
          user={defaultUser}
          viewMode={true}
          contacts={defaultContacts}

        />),
    );
    const dataTable = component.find(DataTable);
    expect(dataTable.length).toEqual(1);

    //data should be flatten
    const mappedToSortable = document.attributes.funding_agreement.map((fundingAgreement: any) => {
      return {
        agreement_id: fundingAgreement.agreement_id.value,
        amount: fundingAgreement.amount.value,
        currency: fundingAgreement.currency.value,
        repayment_amount: fundingAgreement.repayment_amount.value,
        repayment_due_date: fundingAgreement.repayment_due_date.value,
        funder_id: fundingAgreement.funder_id.value,
        status: getFundingStatus(fundingAgreement),
        fee: fundingAgreement.fee.value,
        nft_address: fundingAgreement.nft_address ? fundingAgreement.nft_address.value : '',
        days: fundingAgreement.days.value,
        apr: fundingAgreement.apr.value,
      } as FundingAgreement;
    });
    expect(dataTable.prop('data')).toEqual(mappedToSortable);

    const rows = dataTable.find('tbody tr');
    expect(rows.length).toEqual(2);
    // Should not have request funding in viewMode
    expect(component.find(Button).findWhere(node => node.key() === 'create-funding-agreement').length).toEqual(0);
  });


  it('Should request a funding agreement successfully ', async () => {
    //FundingAgrement form has DatePicker and it will not find
    // the theme definition
    const component = mount(withAllProvidersAndContexts(
      <FundingAgreements
        document={document}
        onAsyncStart={onAsyncStart}
        onAsyncComplete={onAsyncComplete}
        onAsyncError={onAsyncError}
        user={defaultUser}
        viewMode={false}
        contacts={defaultContacts}

      />),
    );

    httpClient.funding.create.mockImplementation(async () => {
      return { data: 'Custom Payload' };
    });

    const fundingAction = component.find(Button).findWhere(node => node.key() === 'create-funding-agreement');
    fundingAction.simulate('click');
    const fundingForm = component.find(FundingAgreementForm);
    await fundingForm.prop('onSubmit')(
      { data: 'data' },
    );
    expect(onAsyncStart).toHaveBeenCalledTimes(1);
    expect(onAsyncError).toHaveBeenCalledTimes(0);
    expect(onAsyncComplete).toHaveBeenCalledWith('Custom Payload');


  });

  it('Should fail to request  a funding agreement', async () => {
    //FundingAgrement form has DatePicker and it will not find
    // the theme definition
    const component = mount(withAllProvidersAndContexts(
      <FundingAgreements
        document={document}
        onAsyncStart={onAsyncStart}
        onAsyncComplete={onAsyncComplete}
        onAsyncError={onAsyncError}
        user={defaultUser}
        viewMode={false}
        contacts={defaultContacts}

      />),
    );
    const error = new Error('Some Error');
    httpClient.funding.create.mockImplementation(async () => {
      throw error;
    });

    const fundingAction = component.find(Button).findWhere(node => node.key() === 'create-funding-agreement');
    fundingAction.simulate('click');
    const fundingForm = component.find(FundingAgreementForm);
    await fundingForm.prop('onSubmit')(
      { data: 'data' },
    );
    expect(onAsyncStart).toHaveBeenCalledTimes(1);
    expect(onAsyncComplete).toHaveBeenCalledTimes(0);
    expect(onAsyncError).toHaveBeenCalledWith(error, 'Failed to create funding agreement');


  });


  it('Should render the first agreement with a view action and second should also have sign', () => {

    const component = mount(
      withAllProvidersAndContexts(
        <FundingAgreements
          document={document}
          onAsyncStart={onAsyncStart}
          onAsyncComplete={onAsyncComplete}
          onAsyncError={onAsyncError}
          viewMode={false}
          user={{
            ...defaultUser,
            account: '0xSomeFunderId',
          }}
          contacts={defaultContacts}

        />),
    );
    const dataTable = component.find(DataTable);
    expect(dataTable.length).toEqual(1);


    const rows = dataTable.find('tbody tr');
    expect(rows.length).toEqual(2);

    expect(rows.at(0).find('.actions').find(Anchor).text()).toEqual('View');
    const anchorsForSecondRow = rows.at(1).find('.actions').find(Anchor);
    expect(anchorsForSecondRow.at(0).text()).toEqual('View');
    expect(anchorsForSecondRow.at(1).text()).toEqual('Sign');
  });


  it('Should sign an agreement', async () => {

    const component = mount(
      withAllProvidersAndContexts(
        <FundingAgreements
          document={document}
          onAsyncStart={onAsyncStart}
          onAsyncComplete={onAsyncComplete}
          onAsyncError={onAsyncError}
          viewMode={false}
          user={{
            ...defaultUser,
            account: '0xSomeFunderId',
          }}
          contacts={defaultContacts}

        />),
    );


    httpClient.funding.sign.mockImplementation(async (data) => {
      return { data: 'Custom Payload' };
    });

    const signAction = component.find('tbody tr').at(1).find('.actions').find(Anchor).at(1);
    await signAction.prop('onClick')();
    expect(onAsyncStart).toHaveBeenCalledTimes(1);
    expect(onAsyncError).toHaveBeenCalledTimes(0);
    expect(onAsyncComplete).toHaveBeenCalledWith('Custom Payload');
  });


  it('Should not sign an agreement', async () => {

    const component = mount(
      withAllProvidersAndContexts(
        <FundingAgreements
          document={document}
          onAsyncStart={onAsyncStart}
          onAsyncComplete={onAsyncComplete}
          onAsyncError={onAsyncError}
          viewMode={false}
          user={{
            ...defaultUser,
            account: '0xSomeFunderId',
          }}
          contacts={defaultContacts}

        />),
    );

    const error = new Error('Some Error');
    httpClient.funding.sign.mockImplementation(async (data) => {
      throw error;
    });

    const signAction = component.find('tbody tr').at(1).find('.actions').find(Anchor).at(1);
    await signAction.prop('onClick')();
    expect(onAsyncStart).toHaveBeenCalledTimes(1);
    expect(onAsyncComplete).toHaveBeenCalledTimes(0);
    expect(onAsyncError).toHaveBeenCalledWith(error, 'Failed to sign funding agreement');
  });


  it('Should open the funding agreement in ViewMode', () => {

    const component = mount(
      withAllProvidersAndContexts(
        <FundingAgreements
          document={document}
          onAsyncStart={onAsyncStart}
          onAsyncComplete={onAsyncComplete}
          onAsyncError={onAsyncError}
          viewMode={false}
          user={{
            ...defaultUser,
            account: '0xSomeFunderId',
          }}
          contacts={defaultContacts}

        />),
    );

    const viewAction = component.find('tbody tr').at(1).find('.actions').find(Anchor).at(0);
    viewAction.simulate('click');
    const fundingForm = component.find(FundingAgreementForm);
    expect(fundingForm.prop('isViewMode')).toEqual(true);
  });


});
