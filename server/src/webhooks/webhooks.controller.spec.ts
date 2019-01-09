import { Test, TestingModule } from '@nestjs/testing';
import { documentTypes, eventTypes, WebhooksController } from './webhooks.controller';
import { centrifugeClientFactory } from '../centrifuge-client/centrifuge.client';
import { tokens as clientTokens } from '../centrifuge-client/centrifuge.constants';
import { tokens as databaseTokens } from '../database/database.constants';
import { databaseConnectionFactory } from '../database/database.providers';
import { InvoiceInvoiceResponse } from '../../../clients/centrifuge-node/generated-client';

describe('WebhooksController', () => {
  let webhooksModule: TestingModule;
  const databaseServiceMock = {
    invoices: {
      create: jest.fn(data => data),
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
    get: jest.fn((): InvoiceInvoiceResponse => getResponse),
  };

  beforeEach(async () => {
    webhooksModule = await Test.createTestingModule({
      controllers: [WebhooksController],
      providers: [databaseConnectionFactory, centrifugeClientFactory],
    })
      .overrideProvider(databaseTokens.databaseConnectionFactory)
      .useValue(databaseServiceMock)
      .overrideProvider(clientTokens.centrifugeClientFactory)
      .useValue(centrifugeClient)
      .compile();

    databaseServiceMock.invoices.create.mockClear();
    centrifugeClient.get.mockClear();
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
      expect(centrifugeClient.get).toHaveBeenCalledWith(documentId);
      expect(databaseServiceMock.invoices.create).toHaveBeenCalledWith(
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
      expect(centrifugeClient.get).not.toHaveBeenCalled();
      expect(databaseServiceMock.invoices.create).not.toHaveBeenCalled();
    });
  });
});
