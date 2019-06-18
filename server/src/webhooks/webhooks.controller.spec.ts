import { Test, TestingModule } from '@nestjs/testing';
import { documentTypes, eventTypes, WebhooksController } from './webhooks.controller';
import { databaseServiceProvider } from '../database/database.providers';
import { InvInvoiceResponse, PoPurchaseOrderResponse } from '../../../clients/centrifuge-node';
import { CentrifugeService } from '../centrifuge-client/centrifuge.service';
import { DatabaseService } from '../database/database.service';
import { User } from '../../../src/common/models/user';

describe('WebhooksController', () => {
  let webhooksModule: TestingModule;
  const user = new User();
  user._id = 'id01';
  user.account = '0x1111';
  const documentId = '112233';
  const invoiceSpies: any = {};
  const poSpies: any = {};

  const getResponse = {
    data: {},
    header: {
      document_id: documentId,
    },
    ownerId: user._id,
  };

  const centrifugeClient = {
    invoices: {
      get: jest.fn((): InvInvoiceResponse => getResponse),

    },
    purchaseOrders: {
      get: jest.fn((): PoPurchaseOrderResponse => getResponse),
    },
  };

  beforeEach(async () => {
    webhooksModule = await Test.createTestingModule({
      controllers: [WebhooksController],
      providers: [databaseServiceProvider, CentrifugeService],
    })

      .overrideProvider(CentrifugeService)
      .useValue(centrifugeClient)
      .compile();


    const databaseService = webhooksModule.get<DatabaseService>(DatabaseService);

    // insert a user
    databaseService.users.insert(user);

    invoiceSpies.spyInsert = jest.spyOn(databaseService.invoices, 'insert');
    invoiceSpies.spyUpdate = jest.spyOn(databaseService.invoices, 'update');
    poSpies.spyInsert = jest.spyOn(databaseService.purchaseOrders, 'insert');
    poSpies.spyUpdate = jest.spyOn(databaseService.purchaseOrders, 'update');
    centrifugeClient.invoices.get.mockClear();
  });

  describe('when it receives success invoice creation', function() {
    it('should fetch it from the node and persist it in the database', async function() {
      const webhooksController = webhooksModule.get<WebhooksController>(
        WebhooksController,
      );

      const result = await webhooksController.receiveMessage({
        event_type: eventTypes.DOCUMENT,
        document_type: documentTypes.invoice,
        document_id: documentId,
        to_id: user.account,
      });

      expect(result).toEqual('OK');
      expect(centrifugeClient.invoices.get).toHaveBeenCalledWith(
        documentId,
        user.account,
      );

      expect(invoiceSpies.spyUpdate).toHaveBeenCalledWith(
        {
          'header.document_id': getResponse.header.document_id,
          'ownerId': user._id,
        },
        getResponse,
        { upsert: true },
      );
    });
  });

  describe('when it receives success invoice creation', function() {
    it('should fetch it from the node and persist it in the database', async function() {
      const webhooksController = webhooksModule.get<WebhooksController>(
        WebhooksController,
      );

      const result = await webhooksController.receiveMessage({
        event_type: eventTypes.DOCUMENT,
        document_type: documentTypes.invoice,
        document_id: documentId,
      });

      expect(result).toEqual('User is not present in database');
    });
  });

  describe('when it receives success purchase order creation', function() {
    it('should fetch it from the node and persist it in the database', async function() {
      const webhooksController = webhooksModule.get<WebhooksController>(
        WebhooksController,
      );

      const result = await webhooksController.receiveMessage({
        event_type: eventTypes.DOCUMENT,
        document_type: documentTypes.purchaseOrder,
        document_id: documentId,
        to_id: user.account,
      });

      expect(result).toEqual('OK');
      expect(centrifugeClient.purchaseOrders.get).toHaveBeenCalledWith(
        documentId,
        user.account,
      );
      expect(poSpies.spyInsert).toHaveBeenCalledWith(
        getResponse,
      );
    });
  });

  describe('when it receives invalid message', function() {
    it('should do nothing', async function() {
      const webhooksController = webhooksModule.get<WebhooksController>(
        WebhooksController,
      );

      const result = await webhooksController.receiveMessage({});
      expect(result).toBe('OK');
      expect(centrifugeClient.invoices.get).not.toHaveBeenCalled();
      expect(poSpies.spyInsert).not.toHaveBeenCalled();
    });
  });
});
