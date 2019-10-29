import React from 'react';
import { mount } from 'enzyme';
import { BrowserRouter, Link } from 'react-router-dom';
import { SearchSelect } from '@centrifuge/axis-search-select';
import { Anchor, DataTable, Select } from 'grommet';
import { withAllProvidersAndContexts } from '../../test-utilities/test-providers';
import { Modal } from '@centrifuge/axis-modal';
import { PageError } from '../../components/PageError';
import { act } from 'react-dom/test-utils';
import { defaultUser } from '../../test-utilities/default-data';
import { ListDocuments } from '../ListDocuments';
import documentRoutes from '../routes';
import { MemoryRouter } from 'react-router';

jest.mock('../../http-client');
const httpClient = require('../../http-client').httpClient;


describe('List Documents', () => {


  const documents = [

    {
      _id: '1',
      header: {
        write_access: [defaultUser.account],
      },
      createdAt: '2019-10-09T11:55:37.284Z',
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
      fromId: '0xFaC5A4BA4CF34D82C7CA0c8004A8421be1679B71',
    },
    {
      _id: '2',
      header: {
        write_access: [],
      },
      createdAt: '2019-10-09T11:55:37.284Z',
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
          value: 'second_schema',
        },
      },
    },


  ];

  const push = jest.fn((path) => {
  });

  beforeEach(() => {
    push.mockClear();
    httpClient.documents.list.mockImplementation(async (data) => {
      return { data: documents };
    });
  });


  it('should display a page Error', async () => {
    await act(async () => {
      const error = new Error('Failed to load!');
      httpClient.documents.list.mockImplementation(async (data) => {
        throw error;
      });

      const component = mount(
        withAllProvidersAndContexts(
          <MemoryRouter>
            <ListDocuments
              history={{ push } as any}
            />
          </MemoryRouter>
          ,
        ),
      );

      await new Promise(r => setTimeout(r, 0));
      component.update();
      expect(component.find(PageError).prop('error')).toMatchObject(error);
    });
  });

  it('Should render 2 documents with the proper actions', async () => {
    await act(async () => {
      const component = mount(
        withAllProvidersAndContexts(
          <MemoryRouter>
            <ListDocuments
              history={{ push } as any}
            />
          </MemoryRouter>
          ,
        ),
      );

      await new Promise(r => setTimeout(r, 0));
      component.update();

      const dataTable = component.find(DataTable);
      expect(dataTable.length).toEqual(1);
      const rows = dataTable.find('tbody tr');
      expect(rows.length).toBe(2);
      const fistRowactions = rows.at(0).find(Anchor);
      const secondRowactions = rows.at(1).find(Anchor);
      expect(fistRowactions.length).toBe(2);
      expect(fistRowactions.at(0).text()).toEqual('View');
      expect(fistRowactions.at(1).text()).toEqual('Edit');
      expect(secondRowactions.length).toBe(1);
      expect(secondRowactions.at(0).text()).toEqual('View');
    });

  });

  it('Should render the received documents', async () => {
    await act(async () => {
      const component = mount(
        withAllProvidersAndContexts(
          <MemoryRouter>
            <ListDocuments
              history={{ push } as any}
            />
          </MemoryRouter>
          ,
        ),
      );

      await new Promise(r => setTimeout(r, 0));
      component.update();
      component.find(Select).simulate('click');
      // The first button is used to open the select so Received will be the 4th
      // Keep in mind that the fromId must be a valid eth address. If it is not it will show up
      // as sent
      component.find(Select).find('button').at(3).simulate('click');
      const dataTable = component.find(DataTable);
      const rows = dataTable.find('tbody tr');
      expect(rows.length).toBe(1);

    });

  });


  it('Should open document when clicking View', async () => {
    await act(async () => {
      const component = mount(
        withAllProvidersAndContexts(
          <MemoryRouter>
            <ListDocuments
              history={{ push } as any}
            />
          </MemoryRouter>
          ,
        ),
      );

      await new Promise(r => setTimeout(r, 0));
      component.update();

      const dataTable = component.find(DataTable);
      expect(dataTable.length).toEqual(1);
      const rows = dataTable.find('tbody tr');
      const actions = rows.at(0).find(Anchor);
      actions.at(0).simulate('click');
      expect(push).toHaveBeenCalledWith(documentRoutes.view.replace(':id', '1'));
    });

  });

  it('Should edit document when clicking Edit', async () => {
    await act(async () => {
      const component = mount(
        withAllProvidersAndContexts(
          <MemoryRouter>
            <ListDocuments
              history={{ push } as any}
            />
          </MemoryRouter>
          ,
        ),
      );

      await new Promise(r => setTimeout(r, 0));
      component.update();

      const dataTable = component.find(DataTable);
      expect(dataTable.length).toEqual(1);
      const rows = dataTable.find('tbody tr');
      const actions = rows.at(0).find(Anchor);
      actions.at(1).simulate('click');
      expect(push).toHaveBeenCalledWith(documentRoutes.edit.replace(':id', '1'));
    });

  });

  it('Should create document when clicking create button', async () => {
    await act(async () => {
      const component = mount(
        withAllProvidersAndContexts(
          <MemoryRouter>
            <ListDocuments
              history={{ push } as any}
            />
          </MemoryRouter>
          ,
        ),
      );

      await new Promise(r => setTimeout(r, 0));
      component.update();
      expect(component.find(Link).prop('to')).toBe(documentRoutes.new);
    });

  });


});

