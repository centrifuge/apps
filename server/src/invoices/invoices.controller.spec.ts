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
    _id: 'invoice_id',
    currency: 'USD',
    number: '999',
    sender_company_name: 'cinderella',
    bill_to_company_name: 'step mother',
    collaborators: [],
  };

  let fetchedInvoices: Invoice[];

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
      findOne: jest.fn((query) => {
        const found = fetchedInvoices.find(i => i._id === query._id);
        return found ? {
          data: found,
          header: {
            document_id: `document_${query._id}`,
          },
        } : null;
      }),
      updateById: jest.fn((id, value) => value),
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

    pullForJobComplete = () => true;
  }

  const centrifugeClientMock = new CentrifugeClientMock();

  beforeEach(async () => {
    fetchedInvoices = [invoice];

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
        { id: invoice._id },
        { user: { _id: 'user_id' } },
        { ...updatedInvoice },
      );

      expect(databaseServiceMock.invoices.findOne).toHaveBeenCalledWith({
        _id: invoice._id,
        ownerId: 'user_id',
      });
      expect(centrifugeClientMock.invoices.update).toHaveBeenCalledWith(
        'document_invoice_id',
        {
          data: { ...updatedInvoice },
          write_access: {
            collaborators: ['new_collaborator'],
          },

        },
        config.admin.account,
      );

      expect(databaseServiceMock.invoices.updateById).toHaveBeenCalledWith(
        'invoice_id',
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
        { id: invoice._id },
        { user: { _id: 'user_id' } },
      );
      expect(databaseServiceMock.invoices.findOne).toHaveBeenCalledWith({
        _id: invoice._id,
        ownerId: 'user_id',
      });

      expect(result).toEqual({
        data: invoice,
        header: {
          document_id: `document_${invoice._id}`,
        },
      });
    });

  });
});
