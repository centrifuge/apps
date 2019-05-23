import { Test, TestingModule } from '@nestjs/testing';
import {
  documentTypes,
  eventTypes,
  WebhooksController,
} from './webhooks.controller';
import { databaseServiceProvider } from '../database/database.providers';
import {
  InvInvoiceResponse,
  PoPurchaseOrderResponse,
} from '../../../clients/centrifuge-node';
import config from '../../../src/common/config';
import { CentrifugeService } from '../centrifuge-client/centrifuge.service';
import { DatabaseService } from '../database/database.service';

describe('WebhooksController', () => {
  let webhooksModule: TestingModule;
  const databaseServiceMock = {
    invoices: {
      insert: jest.fn(data => data),
    },
    purchaseOrders: {
      insert: jest.fn(data => data),
    },
  };

  const documentId = '112233';

  const getResponse = {
    data: {},
    header: {
      document_id: documentId,
    },
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
      .overrideProvider(DatabaseService)
      .useValue(databaseServiceMock)
      .overrideProvider(CentrifugeService)
      .useValue(centrifugeClient)
      .compile();

    databaseServiceMock.invoices.insert.mockClear();
    centrifugeClient.invoices.get.mockClear();
  });

  describe('when it receives success invoice creation', function() {
    it('should fetch it from the node and persist it in the database', async function() {
      const webhooksController = webhooksModule.get<WebhooksController>(
        WebhooksController,
      );

      const result = await webhooksController.receiveMessage({
        event_type: eventTypes.success,
        document_type: documentTypes.invoice,
        document_id: documentId,
      });

      expect(result).toEqual('OK');
      expect(centrifugeClient.invoices.get).toHaveBeenCalledWith(
        documentId,
        config.admin.account,
      );
      expect(databaseServiceMock.invoices.insert).toHaveBeenCalledWith(
        getResponse,
      );
    });
  });

  describe('when it receives success purchase order creation', function() {
    it('should fetch it from the node and persist it in the database', async function() {
      const webhooksController = webhooksModule.get<WebhooksController>(
        WebhooksController,
      );

      const result = await webhooksController.receiveMessage({
        event_type: eventTypes.success,
        document_type: documentTypes.purchaseOrder,
        document_id: documentId,
      });

      expect(result).toEqual('OK');
      expect(centrifugeClient.purchaseOrders.get).toHaveBeenCalledWith(
        documentId,
        config.admin.account,
      );
      expect(databaseServiceMock.purchaseOrders.insert).toHaveBeenCalledWith(
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
      expect(databaseServiceMock.invoices.insert).not.toHaveBeenCalled();
    });
  });
});
