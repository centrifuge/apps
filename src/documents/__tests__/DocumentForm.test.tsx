import React from 'react';
import { mount } from 'enzyme';
import DocumentForm from '../DocumentForm';
import { BrowserRouter } from 'react-router-dom';

describe('DocumentForm', () => {

  const documents = [
    {
      _id: 'first_id',
      createdAt: '2019-07-09T10:54:59.900Z',
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
    },
    {
      _id: 'second_id',
      createdAt: '2019-07-09T10:54:59.900Z',
      header: {
        read_access: [
          '0x111',
          '0xNotInContacts',
        ],
        nfts: [
          {
            owner: '0xD77C534AED04D7Ce34Cd425073a033dB4FBe6a9d',
            registry: '0xD77C534AED04D7Ce34Cd425073a033dB4FBe6a9d',
            token_id: '0xD77C534AED04D7Ce34Cd425073a033dB4FBe6a9d',
          },
          {
            owner: '0xB3C8F41b2Ed5f46f0374Ff98F86e6ecD8B8Cd00F',
            registry: '0xB3C8F41b2Ed5f46f0374Ff98F86e6ecD8B8Cd00F',
            token_id: '0xB3C8F41b2Ed5f46f0374Ff98F86e6ecD8B8Cd00F',
          },
        ],
      },
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

        ['amount']: {
          key:
            '0x9ed63b1df0c1b6dc14b777a767ccb0562b7a0adf6f51bf0d90476f6833005f9a',
          type: 'decimal',
          value: '100',
        },
      },
    },
  ];


  const contacts = [
    {
      name: 'My Contact',
      address: '0x111',
    },
  ];


  const schemas = [
    {
      name: 'first_schema',
      registries: [],
      attributes: [
        {
          name: 'reference_id',
          label: 'Reference Id',
          type: 'string',
        },
        {
          name: 'amount',
          label: 'Amount',
          type: 'decimal',
          options: [1, 2, 3],
        },
        {
          name: 'index',
          label: 'Index',
          type: 'integer',
        },
        {
          name: 'percent',
          label: 'Percent',
          type: 'decimal',
        },
        {
          name: 'date',
          label: 'Some Date',
          type: 'timestamp',
        },
        {
          name: 'customer',
          label: 'Customer',
          type: 'string',
        },
      ],
    },
    {
      name: 'second_schema',
      registries: [],
      attributes: [
        {
          name: 'reference_id',
          label: 'Reference Id',
          type: 'string',
        },
        {
          name: 'amount',
          label: 'Amount',
          type: 'decimal',
        },
        {
          name: 'customer',
          label: 'Customer',
          type: 'string',
        },
      ],
    },
  ];


  const onSubmit = jest.fn(() => {
  });

  const onCancel = jest.fn(() => {
  });

  it('Should render the form just select form', () => {

    const documentForm = mount(
      <DocumentForm document={{}} schemas={schemas} onCancel={onCancel} onSubmit={onSubmit}/>,
    );
    expect(documentForm.html()).toMatchSnapshot();
  });

  it('Should render the form with default data', () => {
    const documentForm = mount(
      <DocumentForm document={documents[0]} selectedSchema={schemas[0]} schemas={schemas} onCancel={onCancel}
                    onSubmit={onSubmit}/>,
    );
    expect(documentForm.html()).toMatchSnapshot();
  });


  it('Should render the form with default data  for read access and nfts', () => {
    const documentForm = mount(
      <DocumentForm document={documents[1]} selectedSchema={schemas[0]} schemas={schemas} contacts={contacts}
                    onCancel={onCancel}
                    onSubmit={onSubmit}/>,
    );
    expect(documentForm.html()).toMatchSnapshot();
  });


  it('Should render the form in view mode', () => {
    const documentForm = mount(
      <DocumentForm document={documents[0]} selectedSchema={schemas[0]} mode={'view'} schemas={schemas}
                    onCancel={onCancel} onSubmit={onSubmit}/>,
    );
    expect(documentForm.html()).toMatchSnapshot();
  });

  it('Should render the form in edit mode', () => {
    const documentForm = mount(
      <DocumentForm document={documents[0]} selectedSchema={schemas[0]} mode={'view'} schemas={schemas}
                    onCancel={onCancel} onSubmit={onSubmit}/>,
    );
    expect(documentForm.html()).toMatchSnapshot();
  });


})
;
