import { mount, shallow } from 'enzyme';
import React from 'react';
import { Spinner } from '@centrifuge/axis-spinner';
import { ViewDocument } from '../ViewDocument';
import { MemoryRouter } from 'react-router';
import { defaultContacts, defaultSchemas, defaultUser } from '../../test-utilities/default-data';
import { act } from 'react-dom/test-utils';
import { withAllProvidersAndContexts } from '../../test-utilities/test-providers';
import DocumentForm from '../DocumentForm';
import { Modal } from '@centrifuge/axis-modal';
import { Preloader } from '../../components/Preloader';
import { extendContactsWithUsers } from '@centrifuge/gateway-lib/utils/contact-utils';
import { PageError } from '../../components/PageError';
import { Nfts } from '../Nfts';
import { FundingAgreements } from '../FundingAgreements';

jest.mock('../../http-client');
const httpClient = require('../../http-client').httpClient;

const ViewDocumentDynamicProps: any = ViewDocument;

describe('View Document', () => {

  let location = '';

  const push = (path) => {
    location = path;
  };
  const document = {
    header: {
      write_access: [defaultUser.account],
    },
    attributes: {
      ['reference_id']: {
        key:
          '0x9ed63b1df0c1b6dc14b777a767ccb0562b7a0adf6f51bf0d90476f6833005f9a',
        type: 'string',
        value: 'My Document Title',
      },
      ['_schema']: {
        key:
          '0x9ed63b1df0c1b6dc14b777a767ccb0562b7a0adf6f51bf0d90476f6833005f9a',
        type: 'string',
        value: 'first_schema',
      },
    },
  };
  beforeEach(() => {
    httpClient.contacts.list.mockImplementation(async (data) => {
      return { data: defaultContacts };
    });

    httpClient.schemas.list.mockImplementation(async (data) => {
      return { data: defaultSchemas };
    });

    httpClient.documents.getById.mockImplementation(async (id) => {
      return {
        data: document,
      };
    });
  });

  it('Should render the preloader', async () => {

    await act(async () => {
      const component = mount(
        withAllProvidersAndContexts(
          <MemoryRouter>
            <ViewDocumentDynamicProps
              history={
                push
              }
              match={{
                params: {
                  id: '100',
                },
              }}/>
          </MemoryRouter>,
          {
            ...defaultUser,
            schemas: [defaultSchemas[0].name],
          },
        ),
      );

      const preloader = component.find(Preloader);
      // THe user has only one schema set
      expect(preloader.length).toEqual(1);
      expect(preloader.prop('message')).toEqual('Loading');
    });

  });

  it('Should load the data and render the page', async () => {

    await act(async () => {
      const component = mount(
        withAllProvidersAndContexts(
          <MemoryRouter>
            <ViewDocumentDynamicProps
              history={
                push
              }
              match={{
                params: {
                  id: '100',
                },
              }}/>
          </MemoryRouter>,
          {
            ...defaultUser,
            schemas: [defaultSchemas[0].name],
          },
        ),
      );

      //Wait for use effect and update the dom of the component
      await new Promise(r => setTimeout(r, 0));
      component.update();
      const documentForm = component.find(DocumentForm);

      const extendedContacts = extendContactsWithUsers(defaultContacts, [defaultUser]);
      // Edit does not filter schemas based on the user because
      // you should still edit a document you have even if you can not create a new one
      expect(documentForm.prop('schemas')).toEqual(defaultSchemas);
      expect(documentForm.prop('mode')).toEqual('view');
      expect(documentForm.prop('contacts')).toEqual(extendedContacts);
      expect(documentForm.prop('selectedSchema')).toEqual(defaultSchemas[0]);

      expect(documentForm.find(Nfts).prop('viewMode')).toBe(true);
      expect(documentForm.find(FundingAgreements).prop('viewMode')).toBe(true);

    });

  });

  it('Should not render funding agreements', async () => {

    httpClient.documents.getById.mockImplementation(async (id) => {
      return {
        data: {
          ...document,
          attributes: {
            ...document.attributes,
            ['_schema']: {
              key:
                '0x9ed63b1df0c1b6dc14b777a767ccb0562b7a0adf6f51bf0d90476f6833005f9a',
              type: 'string',
              value: 'second_schema',
            },
          },
        },
      };
    });

    await act(async () => {
      const component = mount(
        withAllProvidersAndContexts(
          <MemoryRouter>
            <ViewDocumentDynamicProps
              history={
                push
              }
              match={{
                params: {
                  id: '100',
                },
              }}/>
          </MemoryRouter>,
          {
            ...defaultUser,
            schemas: [defaultSchemas[1].name],
          },
        ),
      );

      //Wait for use effect and update the dom of the component
      await new Promise(r => setTimeout(r, 0));
      component.update();
      const documentForm = component.find(DocumentForm);
      expect(documentForm.find(FundingAgreements).length).toBe(0);
    });

  });


  it('Should render an error if it fails to load schemas', async () => {

    const error = new Error('Can not load lists');
    httpClient.schemas.list.mockImplementation(async (data) => {
      throw error;
    });

    await act(async () => {
      const component = mount(
        withAllProvidersAndContexts(
          <MemoryRouter>
            <ViewDocumentDynamicProps
              history={
                push
              }
              match={{
                params: {
                  id: '100',
                },
              }}/>
          </MemoryRouter>,
          {
            ...defaultUser,
            schemas: [defaultSchemas[0].name],
          },
        ),
      );

      //Wait for use effect and update the dom of the component
      await new Promise(r => setTimeout(r, 0));
      component.update();
      const pageError = component.find(PageError);
      // THe user has only one schema set
      expect(pageError.prop('error')).toEqual(error);
    });

  });

  it('Should render an error if it fails to load contacts', async () => {

    const error = new Error('Can not load contacts');
    httpClient.contacts.list.mockImplementation(async (data) => {
      throw error;
    });

    await act(async () => {
      const component = mount(
        withAllProvidersAndContexts(
          <MemoryRouter>
            <ViewDocumentDynamicProps
              history={
                push
              }
              match={{
                params: {
                  id: '100',
                },
              }}/>
          </MemoryRouter>,
          {
            ...defaultUser,
            schemas: [defaultSchemas[0].name],
          },
        ),
      );

      //Wait for use effect and update the dom of the component
      await new Promise(r => setTimeout(r, 0));
      component.update();
      const pageError = component.find(PageError);
      // THe user has only one schema set
      expect(pageError.prop('error')).toEqual(error);
    });

  });

  it('Should render an error if it fails to load the document', async () => {

    const error = new Error('Can not load document');
    httpClient.documents.getById.mockImplementation(async (data) => {
      throw error;
    });

    await act(async () => {
      const component = mount(
        withAllProvidersAndContexts(
          <MemoryRouter>
            <ViewDocumentDynamicProps
              history={
                push
              }
              match={{
                params: {
                  id: '100',
                },
              }}/>
          </MemoryRouter>,
          {
            ...defaultUser,
            schemas: [defaultSchemas[0].name],
          },
        ),
      );

      //Wait for use effect and update the dom of the component
      await new Promise(r => setTimeout(r, 0));
      component.update();
      const pageError = component.find(PageError);
      // THe user has only one schema set
      expect(pageError.prop('error')).toEqual(error);
    });

  });


});


