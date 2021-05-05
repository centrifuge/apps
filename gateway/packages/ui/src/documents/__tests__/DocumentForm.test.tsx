import React from 'react';
import { mount } from 'enzyme';
import DocumentForm from '../DocumentForm';
import { BrowserRouter } from 'react-router-dom';
import { AttrTypes } from '@centrifuge/gateway-lib/models/schema';
import { SearchSelect } from '@centrifuge/axis-search-select';
import { Section } from '../../components/Section';
import Attributes from '../Attributes';
import { ViewModeFormContainer } from '../../components/ViewModeFormContainer';
import { SelectContainer } from 'grommet/components/Select/SelectContainer';
import Comments from '../Comments';
import { withAllProvidersAndContexts } from '../../test-utilities/test-providers';
import { defaultSchemas } from '../../test-utilities/default-data';

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




  const onSubmit = jest.fn(() => {
  });


  it('Should render the Document details and the Collaborators', () => {

    const documentForm = mount(
      withAllProvidersAndContexts(
        <DocumentForm document={{}}
                      schemas={defaultSchemas}
                      onSubmit={onSubmit}/>,
      ),
    );

    const defaultSections = documentForm.find(Section);
    expect(defaultSections.length).toEqual(2);
    expect(defaultSections.at(0).prop('title')).toEqual('Document Details');
    expect(defaultSections.at(1).prop('title')).toEqual('Collaborators');
  });

  it('Should render the form with a selected schema and attributes', () => {
    const documentForm = mount(
      withAllProvidersAndContexts(
        <DocumentForm document={documents[0]}
                      selectedSchema={defaultSchemas[0]}
                      schemas={defaultSchemas}
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
                      schemas={defaultSchemas}
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
                      selectedSchema={defaultSchemas[0]}
                      mode={'view'}
                      schemas={defaultSchemas}
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
                      selectedSchema={defaultSchemas[0]}
                      mode={'edit'}
                      schemas={defaultSchemas}
                      onSubmit={onSubmit}/>,
      ),
    );
    expect(documentForm.find(Section).first().find(SearchSelect).prop('disabled')).not.toBeUndefined();

  });

  it('Should render attributes section if document has a _schema attribute defined', () => {

    const documentForm = mount(
      withAllProvidersAndContexts(
        <DocumentForm document={documents[0]}
                      schemas={defaultSchemas}
                      onSubmit={onSubmit}/>,
      ),
    );
    expect(documentForm.find(Attributes).length).toEqual(1);

  });


  it('Should select a schema and render schema attributes when selecting a schema', () => {

    const documentForm = mount(
      withAllProvidersAndContexts(
        <DocumentForm document={documents[1]}
                      schemas={defaultSchemas}
                      onSubmit={onSubmit}/>,
      ),
    );
    expect(documentForm.find(Attributes).length).toEqual(0);
    documentForm.find(Section).first().find(SearchSelect).simulate('click');
    documentForm.find(SelectContainer).first().find('button').first().simulate('click');
    expect(documentForm.find(Attributes).length).toEqual(1);

  });


  it('Should render comments', () => {
    const documentForm = mount(
      withAllProvidersAndContexts(
        <DocumentForm document={documents[0]}
                      selectedSchema={{
                        ...defaultSchemas[0],
                        formFeatures: {
                          comments: true,
                        },

                      }}
                      schemas={defaultSchemas}
                      onSubmit={onSubmit}/>,
      ),
    );
    expect(documentForm.find(Comments).length).toEqual(1);

  });

})
;
