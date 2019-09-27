import React from 'react';
import { mount } from 'enzyme';
import { BrowserRouter } from 'react-router-dom';
import { SearchSelect } from '@centrifuge/axis-search-select';
import { Nfts } from '../Nfts';
import { Button, DataTable } from 'grommet';
import MintNftForm from '../MintNftForm';
import { defaultUser } from '../../test-utilities/default-data';
import { withAllProvidersAndContexts } from '../../test-utilities/test-providers';

jest.mock('../../http-client');
const httpClient = require('../../http-client').httpClient;

describe('Nfts', () => {

  const registries = [
    {
      label: 'First Registry',
      address: '0xFirstRegistry',
      proofs: [
        'firstRegistryFirstProof',
        'firstRegistrySecondProof',
      ],
    },
    {
      label: 'Second Registry',
      address: '0xSecondRegistry',
      proofs: [
        'secondRegistryFirstProof',
        'secondRegistrySecondProof',
      ],
    },
  ];

  const document = {
    _id: 'first_id',
    header: {
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
        value: 'some cust' +
          'omer',
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
    },
  };


  const onAsyncStart = jest.fn((message) => {
  });

  const onAsyncComplete = jest.fn((data) => {

  });

  const onAsyncError = jest.fn((error, title) => {

  });


  beforeEach(() => {
    onAsyncStart.mockReset();
    onAsyncComplete.mockReset();
    onAsyncError.mockReset();
  });


  it('Should render a Datatable with 2 nfts and no mint action', () => {

    const component = mount(
      withAllProvidersAndContexts(
        <Nfts document={document}
              onAsyncStart={onAsyncStart}
              onAsyncComplete={onAsyncComplete}
              onAsyncError={onAsyncError}
              viewMode={true}
              user={defaultUser}
              registries={registries}

        />),
    );
    const dataTable = component.find(DataTable);
    expect(dataTable.length).toEqual(1);
    const rows = dataTable.find('tbody tr');
    expect(dataTable.prop('data')).toEqual(document.header.nfts);
    expect(rows.length).toEqual(2);
    expect(component.find(Button).length).toEqual(0);
  });


  it('Should mint a nft successfully ', async () => {

    const component = mount(
      withAllProvidersAndContexts(
        <Nfts document={document}
              onAsyncStart={onAsyncStart}
              onAsyncComplete={onAsyncComplete}
              onAsyncError={onAsyncError}
              viewMode={false}
              user={defaultUser}
              registries={registries}

        />),
    );

    httpClient.documents.mint.mockImplementation(async () => {
      return { data: 'Custom Payload' };
    });

    const mintAction = component.find(Button).findWhere(node => node.key() === 'mint-nft');
    mintAction.simulate('click');
    const mintingForm = component.find(MintNftForm);
    await mintingForm.prop('onSubmit')(
      { registry: registries[0] },
    );
    expect(onAsyncStart).toHaveBeenCalledTimes(1);
    expect(onAsyncError).toHaveBeenCalledTimes(0);
    expect(onAsyncComplete).toHaveBeenCalledWith('Custom Payload');


  });

  it('Should fail to mint a nft ', async () => {

    const component = mount(
      withAllProvidersAndContexts(
        <Nfts document={document}
              onAsyncStart={onAsyncStart}
              onAsyncComplete={onAsyncComplete}
              onAsyncError={onAsyncError}
              viewMode={false}
              user={defaultUser}
              registries={registries}

        />),
    );
    const error = new Error('Some Error');
    httpClient.documents.mint.mockImplementation(async () => {
      throw error;
    });

    const mintAction = component.find(Button).findWhere(node => node.key() === 'mint-nft');
    mintAction.simulate('click');
    const mintingForm = component.find(MintNftForm);
    await mintingForm.prop('onSubmit')(
      { registry: registries[0] },
    );
    expect(onAsyncStart).toHaveBeenCalledTimes(1);
    expect(onAsyncComplete).toHaveBeenCalledTimes(0);
    expect(onAsyncError).toHaveBeenCalledWith(error, 'Failed to mint NFT');


  });


});
