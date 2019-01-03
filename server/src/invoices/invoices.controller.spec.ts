import { Test, TestingModule } from '@nestjs/testing';
import { InvoicesController } from './invoices.controller';
import { Invoice } from '../../../src/common/models/dto/invoice';
import { SessionGuard } from '../auth/SessionGuard';
import { centrifugeClientFactory } from '../centrifuge-client/centrifuge.client';
import { tokens as clientTokens } from '../centrifuge-client/centrifuge.constants';
import { tokens as databaseTokens } from '../database/database.constants';
import { databaseConnectionFactory } from '../database/database.providers';
import { Contact } from '../../../src/common/models/dto/contact';
import { InvoiceInvoiceData } from '../../../clients/centrifuge-node/generated-client';

describe('InvoicesController', () => {
  let invoicesModule: TestingModule;

  const invoiceToCreate = new Invoice(999, 'cinderella', 'step mother');
  let fetchedInvoices;

  const supplier = new Contact(
    'fast',
    '0xc111111111a4e539741ca11b590b9447b26a8057',
    'fairy_id',
  );

  class DatabaseServiceMock {
    invoices = {
      create: jest.fn(val => val),
      find: jest.fn(() =>
        fetchedInvoices.map(
          (data: Invoice): InvoiceInvoiceData => ({
            invoice_number: data.number.toString(),
            sender_name: data.supplier,
            recipient_name: data.customer,
            invoice_status: 'CREATED',
            currency: 'USD',
          }),
        ),
      ),
    };
    contacts = {
      findOne: jest.fn(() => supplier),
    };
  }

  const databaseServiceMock = new DatabaseServiceMock();

  class CentrifugeClientMock {
    create = jest.fn(data => data);
  }

  const centrifugeClientMock = new CentrifugeClientMock();

  beforeEach(async () => {
    fetchedInvoices = [
      new Invoice(100, 'pumpkin', 'godmother', [], 'fairy_id'),
    ];

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
    databaseServiceMock.contacts.findOne.mockClear();
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
          invoice_status: 'CREATED',
          currency: 'USD',
        },
      });

      expect(databaseServiceMock.invoices.create).toHaveBeenCalledTimes(1);
    });
  });

  describe('get', () => {
    describe('when supplier has been set', async () => {
      it('should add the supplier to the response', async () => {
        const invoicesController = invoicesModule.get<InvoicesController>(
          InvoicesController,
        );

        const result = await invoicesController.get();
        expect(result[0].supplier).toBe(supplier);
        expect(databaseServiceMock.invoices.find).toHaveBeenCalledTimes(1);
      });
    });

    describe('when supplier id is invalid', async () => {
      beforeEach(() => {
        databaseServiceMock.contacts.findOne = jest.fn(() => undefined);
      });

      it('should not add the supplier to the response', async () => {
        const invoicesController = invoicesModule.get<InvoicesController>(
          InvoicesController,
        );

        const result = await invoicesController.get();
        expect(result[0].supplier).toBe(undefined);
        expect(databaseServiceMock.invoices.find).toHaveBeenCalledTimes(1);
      });
    });
  });
});
