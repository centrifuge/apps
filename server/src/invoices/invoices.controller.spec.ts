import { Test, TestingModule } from '@nestjs/testing';
import { InvoicesController } from './invoices.controller';
import { SessionGuard } from '../auth/SessionGuard';
import { databaseServiceProvider } from '../database/database.providers';
import { DatabaseService } from '../database/database.service';
import { CentrifugeService } from '../centrifuge-client/centrifuge.service';
import config from '../../../src/common/config';
import { Invoice } from '../../../src/common/models/invoice';
import { centrifugeServiceProvider } from "../centrifuge-client/centrifuge.module";

describe('InvoicesController', () => {
  let centrifugeId;
  let invoiceSpies: any = {};

  beforeAll(() => {
    centrifugeId = config.admin.account;
    config.admin.account = 'centrifuge_id';
  });

  afterAll(() => {
    config.admin.account = centrifugeId;
  });

  let invoicesModule: TestingModule;

  const invoice: Invoice = {
    sender: '0x111',
    recipient: '0x112',
    currency: 'USD',
    number: '999',
    sender_company_name: 'cinderella',
    bill_to_company_name: 'step mother',
  };
  let insertedInvoice: any = {};
  const databaseSpies: any = {};

  beforeEach(async () => {
    invoicesModule = await Test.createTestingModule({
      controllers: [InvoicesController],
      providers: [
        SessionGuard,
        centrifugeServiceProvider,
        databaseServiceProvider,
      ],
    })
      .compile();

    const databaseService = invoicesModule.get<DatabaseService>(DatabaseService);
    insertedInvoice = await databaseService.invoices.insert({
      header: {
        document_id: '0x39393939',
      },
      data: { ...invoice },
      ownerId: 'user_id',
    });
    const centrifugeService = invoicesModule.get<CentrifugeService>(CentrifugeService);

    databaseSpies.spyInsert = jest.spyOn(databaseService.invoices, 'insert');
    databaseSpies.spyUpdate = jest.spyOn(databaseService.invoices, 'update');
    databaseSpies.spyFind = jest.spyOn(databaseService.invoices, 'find');
    databaseSpies.spyFindOne = jest.spyOn(databaseService.invoices, 'findOne');
    databaseSpies.spyGetCursor = jest.spyOn(databaseService.invoices, 'getCursor');
    databaseSpies.spyUpdateById = jest.spyOn(databaseService.invoices, 'updateById');

    invoiceSpies.spyUpdate = jest.spyOn(centrifugeService.invoices, 'updateInvoice');
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
      expect(result).toMatchObject({
        data: {
          ...invoice,
        },
        write_access: [invoice.sender, invoice.recipient],
        header: {
          job_id: 'some_job_id',
        },
        ownerId: 'user_id',
      });

      expect(databaseSpies.spyInsert).toHaveBeenCalledTimes(1);
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

      expect(databaseSpies.spyGetCursor).toHaveBeenCalledTimes(1);
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
        sender: '0x444',
        recipient: '0x9999',
      };

      const updateResult = await invoiceController.updateById(
        { id: insertedInvoice._id },
        { user: { _id: 'user_id', account: '0x4441122' } },
        { ...updatedInvoice },
      );

      expect(databaseSpies.spyFindOne).toHaveBeenCalledWith({
        _id: insertedInvoice._id,
        ownerId: 'user_id',
      });
      expect(invoiceSpies.spyUpdate).toHaveBeenCalledWith(
        '0x4441122',
        '0x39393939',
        {
          data: { ...updatedInvoice },
          write_access: [updatedInvoice.sender, updatedInvoice.recipient],
        },
      );

      expect(updateResult).toMatchObject({
        data: {
          ...updatedInvoice,
        },
        write_access: [updatedInvoice.sender, updatedInvoice.recipient],
      });
    });
  });

  describe('get by id', function() {
    it('should return the invoice by id', async function() {
      const invoiceController = invoicesModule.get<InvoicesController>(
        InvoicesController,
      );

      const result = await invoiceController.getById(
        { id: insertedInvoice._id },
        { user: { _id: 'user_id' } },
      );
      expect(databaseSpies.spyFindOne).toHaveBeenCalledWith({
        _id: insertedInvoice._id,
        ownerId: 'user_id',
      });

      expect(result).toMatchObject({
        data: invoice,
        header: {
          document_id: '0x39393939',
        },
      });
    });

  });
});
