import { Test, TestingModule } from '@nestjs/testing';
import { InvoicesController } from './invoices.controller';
import { Invoice } from '../../../src/common/models/invoice';
import { SessionGuard } from '../auth/SessionGuard';
import { databaseServiceProvider } from '../database/database.providers';
import { Contact } from '../../../src/common/models/contact';
import { InvInvoiceData } from '../../../clients/centrifuge-node';

import { DatabaseService } from '../database/database.service';
import { CentrifugeService } from '../centrifuge-client/centrifuge.service';
import config from '../../../src/common/config';

describe('InvoicesController', () => {
  let centrifugeId;

  beforeAll(() => {
    centrifugeId = config.admin.account;
    config.admin.account = 'centrifuge_id';
  });

  afterAll(() => {
    config.admin.account = centrifugeId;
  });

  let invoicesModule: TestingModule;

  const invoice: Invoice = {
    number: '999',
    sender_company_name: 'cinderella',
    bill_to_company_name: 'step mother',
    collaborators: [],
  };
  let fetchedInvoices: Invoice[];

  const supplier = new Contact(
    'fast',
    '0xc111111111a4e539741ca11b590b9447b26a8057',
    'fairy_id',
  );

  class DatabaseServiceMock {
    invoices = {
      insert: jest.fn(val => val),
      find: jest.fn(() =>
        fetchedInvoices.map(
          (data: Invoice): InvInvoiceData => ({
            ...data,
          }),
        ),
      ),
      getCursor: jest.fn(() => {
        return {
          sort: jest.fn(() => {
            return {
              exec: jest.fn(() => {
                return fetchedInvoices.map(
                  (data: Invoice): InvInvoiceData => ({
                    ...data,
                  }),
                )
              },
              ),
            };
          }),
        };
      }),
      findOne: jest.fn((query) => ({
        data: invoice,
        header: {
          document_id: `document_${query._id}`,
        },
      })),
      updateById: jest.fn((id, value) => value),
    };
    contacts = {
      findOne: jest.fn(() => supplier),
    };
  }

  const databaseServiceMock = new DatabaseServiceMock();

  class CentrifugeClientMock {
    invoices = {
      create: jest.fn(data => {
       return {
         header: {
           job_id: 'some_job_id',
         },
         ...data,
       }
      }),
      update: jest.fn(data => {
        return {
          header: {
            job_id: 'some_job_id',
          },
          ...data,
        }
      }),
    };
    funding = {
      getList: jest.fn((documentId, auth) => {
        if (documentId === 'document_find_id') return { data: [{ funding_id: 'some_funding_id' }] };
        return { data: null };
      }),
    };

    pullForJobComplete = () => true;
  }

  const centrifugeClientMock = new CentrifugeClientMock();

  beforeEach(async () => {
    fetchedInvoices = [
      {
        number: '100',
        bill_to_company_name: 'pumpkin',
        sender_company_name: 'godmother',
        _id: 'fairy_id',
      },
    ];

    invoicesModule = await Test.createTestingModule({
      controllers: [InvoicesController],
      providers: [
        SessionGuard,
        CentrifugeService,
        databaseServiceProvider,
      ],
    })
      .overrideProvider(DatabaseService)
      .useValue(databaseServiceMock)
      .overrideProvider(CentrifugeService)
      .useValue(centrifugeClientMock)
      .compile();

    databaseServiceMock.invoices.insert.mockClear();
    databaseServiceMock.invoices.find.mockClear();
    databaseServiceMock.invoices.getCursor.mockClear();
    databaseServiceMock.contacts.findOne.mockClear();
  });

  describe('create', () => {
    it('should return the created invoice', async () => {
      const invoicesController = invoicesModule.get<InvoicesController>(
        InvoicesController,
      );

      const result = await invoicesController.create(
        { user: { _id: 'user_id' } },
        invoice,
      );
      expect(result).toEqual({
        data: {
          ...invoice,
        },
        write_access: {
          collaborators: [...invoice.collaborators],
        },
        header: {
          job_id: 'some_job_id',
        },
        ownerId: 'user_id',
      });

      expect(databaseServiceMock.invoices.insert).toHaveBeenCalledTimes(1);
    });
  });

  describe('get invoices', () => {

      it('should get the list of invoices from the database', async () => {
        const invoicesController = invoicesModule.get<InvoicesController>(
          InvoicesController,
        );

        const result = await invoicesController.get({
          user: { _id: 'user_id' },
        });

        expect(databaseServiceMock.invoices.getCursor).toHaveBeenCalledTimes(1);
      });

  });

  describe('update', function() {
    it('should update the specified invoice', async function() {
      const invoiceController = invoicesModule.get<InvoicesController>(
        InvoicesController,
      );

      const updatedInvoice: Invoice = {
        ...invoice,
        number: 'updated_number',
        collaborators: ['new_collaborator'],
      };

      const updateResult = await invoiceController.updateById(
        { id: 'id_to_update' },
        { user: { _id: 'user_id' } },
        { ...updatedInvoice },
      );

      expect(databaseServiceMock.invoices.findOne).toHaveBeenCalledWith({
        _id: 'id_to_update',
        ownerId: 'user_id',
      });
      expect(centrifugeClientMock.invoices.update).toHaveBeenCalledWith(
        'document_id_to_update',
        {
          data: { ...updatedInvoice },
          write_access: {
            collaborators: ['new_collaborator'],
          },

        },
        config.admin.account,
      );

      expect(databaseServiceMock.invoices.updateById).toHaveBeenCalledWith(
        'id_to_update',
        {
          ...updateResult,
        },
      );
    });
  });

  describe('get by id', function() {
    it('should return the invoice by id', async function() {
      const invoiceController = invoicesModule.get<InvoicesController>(
        InvoicesController,
      );

      const result = await invoiceController.getById(
        { id: 'some_id' },
        { user: { _id: 'user_id' } },
      );
      expect(databaseServiceMock.invoices.findOne).toHaveBeenCalledWith({
        _id: 'some_id',
        ownerId: 'user_id',
      });

      expect(result).toEqual({
        data: invoice,
        fundingAgreement: null,
        header: {
          document_id: 'document_some_id',
        },
      });
    });

    it('should return the invoice by id with a funding request', async function() {
      const invoiceController = invoicesModule.get<InvoicesController>(
        InvoicesController,
      );

      const result = await invoiceController.getById(
        { id: 'find_id' },
        { user: { _id: 'user_id' } },
      );
      expect(databaseServiceMock.invoices.findOne).toHaveBeenCalledWith({
        _id: 'find_id',
        ownerId: 'user_id',
      });

      expect(result).toEqual({
        data: invoice,
        fundingAgreement: {
          funding_id: 'some_funding_id',
        },
        header: {
          document_id: 'document_find_id',
        },
      });
    });
  });
});
