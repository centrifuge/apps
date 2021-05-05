import React from 'react';
import { mount } from 'enzyme';
import { Link } from 'react-router-dom';
import { Anchor, DataTable, Select } from 'grommet';
import { withAllProvidersAndContexts } from '../../test-utilities/test-providers';
import { PageError } from '../../components/PageError';
import { act } from 'react-dom/test-utils';
import { defaultSchemas, defaultUser } from '../../test-utilities/default-data';
import { ListDocuments } from '../ListDocuments';
import documentRoutes from '../routes';
import { MemoryRouter } from 'react-router';
import {createMemoryHistory} from "history";

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
        ['document_status']: {
          key:
              '0x9ed63b1df0c1b6dc14b777a767ccb0562b7a0adf6f51bf0d90476f6833005f9a',
          type: 'string',
          value: 'Created',
        },
        ['nft_status']: {
          key:
              '0x9ed63b1df0c1b6dc14b777a767ccb0562b7a0adf6f51bf0d90476f6833005f9a',
          type: 'string',
          value: 'Minted',
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
    httpClient.schemas.list.mockImplementation(async (data) => {
      return { data: defaultSchemas };
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
      // The first button is used to open the select so Received will be the 4th
      // Keep in mind that the fromId must be a valid eth address. If it is not it will show up
      // as sent
      const dataTable = component.find(DataTable);
      const rows = dataTable.find('tbody tr');
      expect(rows.length).toBe(2);
    });
  });


  it('Should open document when clicking on row', async () => {
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
      rows.at(0).simulate('click');
      expect(push).toHaveBeenCalledWith(documentRoutes.view.replace(':id', '1'));
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

