import { Test, TestingModule } from '@nestjs/testing';
import { documentTypes, eventTypes, WebhooksController } from './webhooks.controller';
import { databaseServiceProvider } from '../database/database.providers';
import { CentrifugeService } from '../centrifuge-client/centrifuge.service';
import { DatabaseService } from '../database/database.service';
import { User } from '../../../src/common/models/user';
import { centrifugeServiceProvider } from '../centrifuge-client/centrifuge.module';

describe('WebhooksController', () => {
  let webhooksModule: TestingModule;
  const user = new User();
  user._id = 'id01';
  user.account = '0x1111';
  const documentId = '112233';
  const invoiceSpies: any = {};
  const poSpies: any = {};
  let centrifugeSpies: any = {};

  beforeEach(async () => {
    webhooksModule = await Test.createTestingModule({
      controllers: [WebhooksController],
      providers: [
        databaseServiceProvider,
        centrifugeServiceProvider,
      ],
    })
      .compile();


    const databaseService = webhooksModule.get<DatabaseService>(DatabaseService);
    const centrifugeService = webhooksModule.get<CentrifugeService>(CentrifugeService);

    // insert a user
    databaseService.users.insert(user);

    invoiceSpies.spyInsert = jest.spyOn(databaseService.invoices, 'insert');
    invoiceSpies.spyUpdate = jest.spyOn(databaseService.invoices, 'update');
    poSpies.spyInsert = jest.spyOn(databaseService.purchaseOrders, 'insert');
    poSpies.spyUpdate = jest.spyOn(databaseService.purchaseOrders, 'update');

    centrifugeSpies.spyInvGet = jest.spyOn(centrifugeService.invoices, 'get');
    centrifugeSpies.spyPOGet = jest.spyOn(centrifugeService.invoices, 'get');

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
      expect(centrifugeSpies.spyInvGet).toHaveBeenCalledWith(
        documentId, user.account,
      );

      expect(invoiceSpies.spyUpdate).toHaveBeenCalledWith(
        { 'header.document_id': '112233', 'ownerId': 'id01' },
        {
          'data': { 'currency': 'USD' },
          'header': { 'document_id': '112233', 'nfts': [{ 'owner': 'owner', 'token_id': 'token_id' }] },
          'ownerId': 'id01',
        },
        { upsert: true },
      );
    });
  });

  describe('when it receives successful invoice creation', function() {
    it('Should fail when it does not find the user', async function() {
      const webhooksController = webhooksModule.get<WebhooksController>(
        WebhooksController,
      );
      try {
        const result = await webhooksController.receiveMessage({
          event_type: eventTypes.DOCUMENT,
          document_type: documentTypes.invoice,
          document_id: documentId,
          to_id: '0x4444',
        });
      } catch (e) {
        expect(e.message).toEqual('Webhook Error: User is not present in database');
      }
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
      expect(centrifugeSpies.spyPOGet).toHaveBeenCalledWith(
        documentId,
        user.account,
      );
      expect(poSpies.spyInsert).toHaveBeenCalledWith(
        user.account,
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
      expect(invoiceSpies.spyInsert).not.toHaveBeenCalled();
      expect(poSpies.spyInsert).not.toHaveBeenCalled();
    });
  });
});
