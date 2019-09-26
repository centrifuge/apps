import React from 'react';
import { mount } from 'enzyme';
import DocumentForm from '../DocumentForm';
import { BrowserRouter } from 'react-router-dom';
import { AttrTypes } from '@centrifuge/gateway-lib/models/schema';
import { SearchSelect } from '@centrifuge/axis-search-select';
import { Section } from '../../components/Section';
import Attributes from '../Attributes';
import { ViewModeFormContainer } from '../../components/ViewModeFormContainer';
import { SelectOption } from 'grommet/components/Select/SelectOption';
import Comments from '../Comments';
import { withAllProvidersAndContexts } from '../../test-utilities/test-providers';

describe('DocumentForm', () => {

  const documents = [
    {
      _id: 'first_id',
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
    },
    {
      _id: 'second_id',
      createdAt: new Date('2019-07-09T10:54:59.900Z'),
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
          type: AttrTypes.STRING,
        },
        {
          name: 'amount',
          label: 'Amount',
          type: AttrTypes.DECIMAL,
          options: ['1', '2', '3'],
        },
        {
          name: 'index',
          label: 'Index',
          type: AttrTypes.INTEGER,
        },
        {
          name: 'percent',
          label: 'Percent',
          type: AttrTypes.PERCENT,
        },
        {
          name: 'date',
          label: 'Some Date',
          type: AttrTypes.TIMESTAMP,
        },
        {
          name: 'customer',
          label: 'Customer',
          type: AttrTypes.STRING,
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
          type: AttrTypes.STRING,
        },
        {
          name: 'amount',
          label: 'Amount',
          type: AttrTypes.DECIMAL,
        },
        {
          name: 'customer',
          label: 'Customer',
          type: AttrTypes.STRING,
        },
      ],
    },
  ];


  const onSubmit = jest.fn(() => {
  });


  it('Should render just the details section', () => {

    const documentForm = mount(
      withAllProvidersAndContexts(
        <DocumentForm document={{}}
                      schemas={schemas}
                      onSubmit={onSubmit}/>,
      ),
    );
    expect(documentForm.find(Section).length).toEqual(1);
  });

  it('Should render the form with a selected schema and attributes', () => {
    const documentForm = mount(
      withAllProvidersAndContexts(
        <DocumentForm document={documents[0]}
                      selectedSchema={schemas[0]}
                      schemas={schemas}
                      onSubmit={onSubmit}/>,
      ),
    );
    expect(documentForm.find(Attributes).length).toEqual(1);
  });


  it('Should render a header and child sections', () => {

    const MyCustomHeader = () => {
      return <div>My Custom header</div>;
    };

    const MyCustomSection = () => {
      return <div>My Custom Section</div>;
    };

    const documentForm = mount(
      withAllProvidersAndContexts(
        <DocumentForm document={{}}
                      schemas={schemas}
                      renderHeader={() => <MyCustomHeader/>}
                      onSubmit={onSubmit}>
          <MyCustomSection/>
          <MyCustomSection/>
          <MyCustomSection/>
        </DocumentForm>,
      ),
    );
    expect(documentForm.find(MyCustomHeader).length).toEqual(1);
    expect(documentForm.find(MyCustomSection).length).toEqual(3);
  });


  it('Should have schema select disabled and have form in view mode', () => {
    const documentForm = mount(
      withAllProvidersAndContexts(
        <DocumentForm document={documents[0]}
                      selectedSchema={schemas[0]}
                      mode={'view'}
                      schemas={schemas}
                      onSubmit={onSubmit}/>,
      ),
    );
    expect(documentForm.find(ViewModeFormContainer).prop('isViewMode')).toEqual(true);
    expect(documentForm.find(Section).first().find(SearchSelect).prop('disabled')).not.toBeUndefined();

  });


  it('Should have schema select disabled in edit mode', () => {
    const documentForm = mount(
      withAllProvidersAndContexts(
        <DocumentForm document={documents[0]}
                      selectedSchema={schemas[0]}
                      mode={'edit'}
                      schemas={schemas}
                      onSubmit={onSubmit}/>,
      ),
    );
    expect(documentForm.find(Section).first().find(SearchSelect).prop('disabled')).not.toBeUndefined();
    ;
  });


  it('Should select a schema and render schema attributes', () => {
    const documentForm = mount(
      withAllProvidersAndContexts(
        <DocumentForm document={documents[0]}
                      schemas={schemas}
                      onSubmit={onSubmit}/>,
      ),
    );
    expect(documentForm.find(Attributes).length).toEqual(0);
    documentForm.find(Section).first().find(SearchSelect).simulate('click');
    documentForm.find(SelectOption).first().find('button').first().simulate('click');
    expect(documentForm.find(Attributes).length).toEqual(1);

  });


  it('Should render comments', () => {
    const documentForm = mount(
      withAllProvidersAndContexts(
        <DocumentForm document={documents[0]}
                      selectedSchema={{
                        ...schemas[0],
                        formFeatures: {
                          comments: true,
                        },

                      }}
                      schemas={schemas}
                      onSubmit={onSubmit}/>,
      ),
    );
    expect(documentForm.find(Comments).length).toEqual(1);

  });

})
;
