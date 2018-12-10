import { Test, TestingModule } from '@nestjs/testing';
import { InvoicesController } from './invoices.controller';
import { Invoice } from '../../../src/common/models/dto/invoice';
import { SessionGuard } from '../auth/SessionGuard';
import { centrifugeClientFactory } from '../centrifuge-client/centrifuge.client';
import { tokens as clientTokens } from '../centrifuge-client/centrifuge.constants';
import { tokens as databaseTokens } from '../database/database.constants';
import { databaseConnectionFactory } from '../database/database.providers';

describe('InvoicesController', () => {
  let invoicesModule: TestingModule;

  const invoiceToCreate = new Invoice(
    999,
    'cinderella',
    'step mother',
    'in queue',
  );
  const fetchedInvoices = [new Invoice(100, 'pumpkin', 'godmother', 'done')];

  class DatabaseServiceMock {
    invoices = {
      create: jest.fn(val => val),
      find: jest.fn(() => fetchedInvoices),
    };
  }

  const databaseServiceMock = new DatabaseServiceMock();

  class CentrifugeClientMock {
    create = jest.fn(data => ({ data }));
  }

  const centrifugeClientMock = new CentrifugeClientMock();

  beforeEach(async () => {
    invoicesModule = await Test.createTestingModule({
      controllers: [InvoicesController],
      providers: [
        SessionGuard,
        centrifugeClientFactory,
        databaseConnectionFactory,
      ],
    })
      .overrideProvider(databaseTokens.databaseConnectionFactory)
      .useValue(databaseServiceMock)
      .overrideProvider(clientTokens.centrifugeClientFactory)
      .useValue(centrifugeClientMock)
      .compile();

    databaseServiceMock.invoices.create.mockClear();
    databaseServiceMock.invoices.find.mockClear();
  });

  describe('create', () => {
    it('should return the created invoice', async () => {
      const invoicesController = invoicesModule.get<InvoicesController>(
        InvoicesController,
      );

      const result = await invoicesController.create(invoiceToCreate);
      expect(result).toEqual({
        data: {
          invoice_number: invoiceToCreate.number.toString(),
          sender_name: invoiceToCreate.supplier,
          recipient_name: invoiceToCreate.customer,
          invoice_status: invoiceToCreate.status,
          currency: 'USD',
        },
      });

      expect(databaseServiceMock.invoices.create).toHaveBeenCalledTimes(1);
    });
  });

  describe('get', () => {
    it('should return a list of invoices', async () => {
      const invoicesController = invoicesModule.get<InvoicesController>(
        InvoicesController,
      );

      const result = await invoicesController.get();
      expect(result).toBe(fetchedInvoices);
      expect(databaseServiceMock.invoices.find).toHaveBeenCalledTimes(1);
    });
  });
});
