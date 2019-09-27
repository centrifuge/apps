import { mount, shallow } from 'enzyme';
import React from 'react';
import { Spinner } from '@centrifuge/axis-spinner';
import CreateDocument from '../CreateDocument';
import { MemoryRouter,Router } from 'react-router';
import { defaultContacts, defaultSchemas, defaultUser } from '../../test-utilities/default-data';
import { act } from 'react-dom/test-utils';
import { withAllProvidersAndContexts } from '../../test-utilities/test-providers';
import DocumentForm from '../DocumentForm';
import { Preloader } from '../../components/Preloader';
import { PageError } from '../../components/PageError';
import { createMemoryHistory } from 'history';
import {Modal} from '@centrifuge/axis-modal';
import routes from '../routes';
import { Heading, Paragraph } from 'grommet';
import { Nfts } from '../Nfts';
import { FundingAgreements } from '../FundingAgreements';

jest.mock('../../http-client');
const httpClient = require('../../http-client').httpClient;

describe('Create Document', () => {

  beforeEach(() => {
    httpClient.contacts.list.mockImplementation(async (data) => {
      return { data: defaultContacts };
    });

    httpClient.schemas.list.mockImplementation(async (data) => {
      return { data: defaultSchemas };
    });
  });

  it('Should render the preloader', async () => {

    await act(async () => {
      const component = mount(
        withAllProvidersAndContexts(
          <MemoryRouter>
            <CreateDocument/>
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
            <CreateDocument/>
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
      // THe user has only one schema set
      expect(documentForm.prop('schemas')).toEqual([defaultSchemas[0]]);
      expect(documentForm.prop('mode')).toEqual('create');
      expect(documentForm.prop('contacts')).toEqual(defaultContacts);

      expect(documentForm.find(Nfts).length).toBe(0);
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
            <CreateDocument/>
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
            <CreateDocument/>
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


  it('Should create a document', async () => {
    const history = createMemoryHistory();

    httpClient.documents.create.mockImplementation(async (data) => {
      return { data: {_id:'new_document' }};
    });

    await act(async () => {
      const component = mount(
        withAllProvidersAndContexts(
          <Router history={history}>
            <CreateDocument/>
          </Router>,
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
      await documentForm.prop('onSubmit')({
        attributes: {},
      });
      component.update();
      expect(component.find(Preloader).prop('message')).toEqual('Saving document');
      expect(history.location.pathname).toBe(routes.view.replace(':id', 'new_document'));

    });
  });


  it('Should fail to create a document', async () => {
    const history = createMemoryHistory();
    //this has to conform to an Axios Error format
    // Also the ui expects that all http request return a json message
    const error = {
      response: {
        data: {
          message:'Document creation failed',
        },
      },

    };
    httpClient.documents.create.mockImplementation(async (data) => {
      throw error;
    });

    await act(async () => {
      const component = mount(
        withAllProvidersAndContexts(
          <Router history={history}>
            <CreateDocument/>
          </Router>,
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
      await documentForm.prop('onSubmit')({
        attributes: {},
      });
      component.update();
      const alert = component.find(Modal);
      expect(alert.find(Heading).text()).toBe('Failed to save document');
      expect(alert.find(Paragraph).text()).toBe('Document creation failed');


    });
  });


});


