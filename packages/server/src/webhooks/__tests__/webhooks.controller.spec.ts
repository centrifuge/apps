import { Test, TestingModule } from '@nestjs/testing';
import { DocumentTypes, EventTypes, WebhooksController } from '../webhooks.controller';
import { databaseServiceProvider } from '../../database/database.providers';
import { CentrifugeService } from '../../centrifuge-client/centrifuge.service';
import { DatabaseService } from '../../database/database.service';
import { User } from '../../../../lib/models/user';
import { centrifugeServiceProvider } from '../../centrifuge-client/centrifuge.module';

describe('WebhooksController', () => {
  let webhooksModule: TestingModule;
  const user = new User();
  user._id = 'id01';
  user.account = '0x1111';
  const document_id = '112233';
  const documentSpies: any = {};
  const centrifugeSpies: any = {};

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

    documentSpies.spyInsert = jest.spyOn(databaseService.documents, 'insert');
    documentSpies.spyUpdate = jest.spyOn(databaseService.documents, 'update');
    centrifugeSpies.spyDocGet = jest.spyOn(centrifugeService.documents, 'getDocument');

  });

  describe('when it receives  an document', function() {
    it('should fetch it from the node and persist it in the database', async function() {
      const webhooksController = webhooksModule.get<WebhooksController>(
        WebhooksController,
      );

      const result = await webhooksController.receiveMessage({
        event_type: EventTypes.DOCUMENT,
        document_type: DocumentTypes.GENERIC_DOCUMENT,
        document_id,
        to_id: user.account,
        from_id: '0xRandomId',
      });

      expect(result).toEqual('OK');
      expect(centrifugeSpies.spyDocGet).toHaveBeenCalledWith(
        user.account,
        document_id,
      );

      expect(documentSpies.spyUpdate).toHaveBeenCalledWith(
        { 'header.document_id': document_id, organizationId: user.account },
        {
          $set: {
            ownerId: user._id,
            organizationId: user.account,
            header: {
              document_id,
              nfts: [{ owner: 'owner', token_id: 'token_id' }],
            },
            data: { currency: 'USD' },
            fromId: '0xRandomId',
            scheme: 'iUSDF2ax31e',
            attributes:
              {
                animal_type: {
                  type: 'string',
                  value: 'iguana',
                },
                number_of_legs: {
                  type: 'decimal',
                  value: '4',
                },
                diet: {
                  type: 'string',
                  value: 'insects',
                },
              },
          },

        },
        { upsert: true },
      );
    });

    it('Should fail when it does not find the user', async function() {
      const webhooksController = webhooksModule.get<WebhooksController>(
        WebhooksController,
      );
      try {
        const result = await webhooksController.receiveMessage({
          event_type: EventTypes.DOCUMENT,
          document_type: DocumentTypes.GENERIC_DOCUMENT,
          document_id,
          to_id: '0x4444',
        });
      } catch (e) {
        expect(e.message).toEqual('Webhook Error: User is not present in database');
      }
    });
  });

  describe('when it receives invalid message', function() {
    it('should do nothing', async function() {
      const webhooksController = webhooksModule.get<WebhooksController>(
        WebhooksController,
      );

      const result = await webhooksController.receiveMessage({});
      expect(result).toBe('OK');
      expect(documentSpies.spyInsert).not.toHaveBeenCalled();
    });
  });
});
