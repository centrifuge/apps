import { Test, TestingModule } from '@nestjs/testing';
import { InvoicesController } from './invoices.controller';
import { InvoicesService } from './invoices.service';
import { CreateInvoiceDto } from './dto/create-invoice.dto';

describe('InvoicesController', () => {
  let invoicesModule: TestingModule;

  const invoiceToCreate = new CreateInvoiceDto(999, 'cinderella');
  const fetchedInvoices = [new CreateInvoiceDto(100, 'pumpkin')];

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
