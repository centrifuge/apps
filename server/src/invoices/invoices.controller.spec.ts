import { Test, TestingModule } from '@nestjs/testing';
import { InvoicesController } from './invoices.controller';
import { InvoicesService } from './invoices.service';
import { Invoice } from '../../../src/common/models/dto/invoice';

describe('InvoicesController', () => {
  let invoicesModule: TestingModule;

  const invoiceToCreate = new Invoice(
    999,
    'cinderella',
    'step mother',
    'in queue',
  );
  const fetchedInvoices = [new Invoice(100, 'pumpkin', 'godmother', 'done')];

  class InvoicesServiceMock {
    create = jest.fn(val => val);
    get = jest.fn(() => fetchedInvoices);
  }

  const invoiceServiceMock = new InvoicesServiceMock();

  beforeAll(async () => {
    invoicesModule = await Test.createTestingModule({
      controllers: [InvoicesController],
    })
      .overrideProvider(InvoicesService)
      .useValue(invoiceServiceMock)
      .compile();

    invoiceServiceMock.create.mockClear();
    invoiceServiceMock.get.mockClear();
  });

  describe('create', () => {
    it('should return the created invoice', async () => {
      const invoicesController = invoicesModule.get<InvoicesController>(
        InvoicesController,
      );

      const result = await invoicesController.create(invoiceToCreate);
      expect(result).toBe(invoiceToCreate);
      expect(invoiceServiceMock.create).toHaveBeenCalledTimes(1);
    });
  });

  describe('get', () => {
    it('should return a list of invoices', async () => {
      const invoicesController = invoicesModule.get<InvoicesController>(
        InvoicesController,
      );

      const result = await invoicesController.get();
      expect(result).toBe(fetchedInvoices);
      expect(invoiceServiceMock.get).toHaveBeenCalledTimes(1);
    });
  });
});
