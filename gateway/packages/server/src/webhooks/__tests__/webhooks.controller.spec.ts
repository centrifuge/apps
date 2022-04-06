import { Test, TestingModule } from '@nestjs/testing'
import { NotificationMessage } from '../../../../lib/centrifuge-node-client'
import { User } from '../../../../lib/src/models/user'
import { centrifugeServiceProvider } from '../../centrifuge-client/centrifuge.module'
import { CentrifugeService } from '../../centrifuge-client/centrifuge.service'
import { databaseServiceProvider } from '../../database/database.providers'
import { DatabaseService } from '../../database/database.service'
import { WebhooksController } from '../webhooks.controller'
import EventTypeEnum = NotificationMessage.EventTypeEnum

describe('WebhooksController', () => {
  let webhooksModule: TestingModule
  const user = new User()
  user._id = 'id01'
  user.account = '0x1111'
  const document_id = '112233'
  const documentSpies: any = {}
  const centrifugeSpies: any = {}

  beforeEach(async () => {
    webhooksModule = await Test.createTestingModule({
      controllers: [WebhooksController],
      providers: [databaseServiceProvider, centrifugeServiceProvider],
    }).compile()

    const databaseService = webhooksModule.get<DatabaseService>(DatabaseService)
    const centrifugeService = webhooksModule.get<CentrifugeService>(CentrifugeService)

    // insert a user
    databaseService.users.insert(user)

    documentSpies.spyInsert = jest.spyOn(databaseService.documents, 'insert')
    documentSpies.spyUpdate = jest.spyOn(databaseService.documents, 'update')
    centrifugeSpies.spyDocGet = jest.spyOn(centrifugeService.documents, 'getCommittedDocument')
  })

  describe('when it receives  an document', function () {
    it.skip('should fetch it from the node and persist it in the database', async function () {
      const webhooksController = webhooksModule.get<WebhooksController>(WebhooksController)

      const result = await webhooksController.receiveMessage({
        eventType: EventTypeEnum.Document,
        document: {
          id: document_id,
          from: '0xRandomId',
          to: user.account,
        },
      })

      expect(result).toEqual('OK')
      expect(centrifugeSpies.spyDocGet).toHaveBeenCalledWith(document_id, user.account)

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
            document_status: 'Created',
            fromId: '0xRandomId',
            scheme: 'iUSDF2ax31e',
            attributes: {
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
            read_access: ['0x111'],
            write_access: ['0x222'],
          },
        },
        { multi: true, upsert: true, returnUpdatedDocs: true }
      )
    })

    it('Should fail when it does not find the user', async function () {
      const webhooksController = webhooksModule.get<WebhooksController>(WebhooksController)
      try {
        const result = await webhooksController.receiveMessage({
          eventType: 1,
          document: {
            id: document_id,
            to: '0x4444',
          },
        })
      } catch (e) {
        expect(e.message).toEqual('Webhook Error: User is not present in database')
      }
    })
  })

  describe('when it receives invalid message', function () {
    it('should do nothing', async function () {
      const webhooksController = webhooksModule.get<WebhooksController>(WebhooksController)

      const result = await webhooksController.receiveMessage({})
      expect(result).toBe('OK')
      expect(documentSpies.spyInsert).not.toHaveBeenCalled()
    })
  })
})
