import React from 'react';
import { mount } from 'enzyme';
import { Nfts } from '../Nfts';
import { Button, DataTable } from 'grommet';
import MintNftForm from '../MintNftForm';
import { defaultContacts, defaultUser } from '../../test-utilities/default-data';
import { withAllProvidersAndContexts } from '../../test-utilities/test-providers';

jest.mock('../../http-client');
const httpClient = require('../../http-client').httpClient;

describe('Nfts', () => {

  const registries = [
    {
      label: 'First Registry',
      address: '0xFirstRegistry',
      asset_manager_address: '0x3bDa52c72Af90794168A37b0DB8Ee784E6507906',
      proofs: [
        'firstRegistryFirstProof',
        'firstRegistrySecondProof',
      ],
    },
    {
      label: 'Second Registry',
      address: '0x3bDa52c72Af90794168A37b0DB8Ee784E6507906',
      asset_manager_address: '0x3bDa52c72Af90794168A37b0DB8Ee784E6507906',
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
          registry: '0x3bDa52c72Af90794168A37b0DB8Ee784E6507906',
          token_id: '0x8416c0d06fae1a25dd11e6f0991f58816e0c2de1c755aa5a9ceee389f23ded3c',
        },
        {
          owner: 'Owner of second nft',
          registry: '0x3bDa52c72Af90794168A37b0DB8Ee784E6507906',
          token_id: '0x12',
        },
      ],
    },
    createdAt: new Date('2019-07-09T10:54:59.900Z'),
    attributes: {
      ['document_status']: {
        key:
            '0x9ed63b1df0c1b6dc14b777a767ccb0562b7a0adf6f51bf0d90476f6833005f9a',
        type: 'string',
        value: 'created',
      },
      ['nft_status']: {
        key:
            '0x9ed63b1df0c1b6dc14b777a767ccb0562b7a0adf6f51bf0d90476f6833005f9a',
        type: 'string',
        value: 'No NFT minted',
      },
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
    },
  };


  const onAsyncStart = jest.fn((message) => {
  });

  const onAsyncComplete = jest.fn((data) => {

  });

  const onAsyncError = jest.fn((error, title) => {

  });

  const onMintStart = jest.fn((error, title) => {

  });


  beforeEach(() => {
    onAsyncStart.mockReset();
    onAsyncComplete.mockReset();
    onAsyncError.mockReset();
    onMintStart.mockReset();
  });


  it('Should render a Datatable with 2 nfts and no mint action', () => {

    const component = mount(
      withAllProvidersAndContexts(
        <Nfts document={document}
              contacts={defaultContacts}
              onAsyncStart={onAsyncStart}
              onAsyncComplete={onAsyncComplete}
              onAsyncError={onAsyncError}
              onMintStart={onMintStart}
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
    // make sure the token_id gets converted to int
    expect(rows.at(0).find('th').at(0).text()).toBe('59745497403145064117625740497207663202436576057166382573054801816399596350780')
    expect(rows.at(1).find('th').at(0).text()).toBe('18')
    expect(component.find(Button).length).toEqual(0);
  });


  it('Should mint a nft successfully ', async () => {
      const component = mount(
          withAllProvidersAndContexts(
              <Nfts document={document}
                    contacts={defaultContacts}
                    onAsyncStart={onAsyncStart}
                    onAsyncComplete={onAsyncComplete}
                    onAsyncError={onAsyncError}
                    onMintStart={onMintStart}
                    viewMode={false}
                    user={defaultUser}
                    registries={registries}

              />),
      );

      httpClient.nfts.mint.mockImplementation(async () => {
        return {data: 'Custom Payload'};
      });

      const mintAction = component.find(Button).findWhere(node => node.key() === 'mint-nft');
      mintAction.simulate('click');
      const mintingForm = component.find(MintNftForm);
      await mintingForm.prop('onSubmit')(
          {registry: registries[0]},
      );
      expect(onMintStart).toHaveBeenCalledTimes(1);
      expect(onAsyncError).toHaveBeenCalledTimes(0);
      expect(onAsyncComplete).toHaveBeenCalledWith('Custom Payload');
  });

  it('Should fail to mint a nft ', async () => {
      const component = mount(
          withAllProvidersAndContexts(
              <Nfts document={document}
                    contacts={defaultContacts}
                    onAsyncStart={onAsyncStart}
                    onAsyncComplete={onAsyncComplete}
                    onAsyncError={onAsyncError}
                    onMintStart={onMintStart}
                    viewMode={false}
                    user={defaultUser}
                    registries={registries}

              />),
      );
      const error = new Error('Some Error');
      httpClient.nfts.mint.mockImplementation(async () => {
        throw error;
      });

      const mintAction = component.find(Button).findWhere(node => node.key() === 'mint-nft');
      mintAction.simulate('click');
      const mintingForm = component.find(MintNftForm);
      await mintingForm.prop('onSubmit')(
          {registry: registries[0]},
      );
      expect(onMintStart).toHaveBeenCalledTimes(1);
      expect(onAsyncComplete).toHaveBeenCalledTimes(0);
      expect(onAsyncError).toHaveBeenCalledWith(error, 'Failed to mint NFT');
  });
});
