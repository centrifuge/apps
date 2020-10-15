import { Test, TestingModule } from '@nestjs/testing';
import { Document } from '../../../../lib/models/document';
import { SessionGuard } from '../../auth/SessionGuard';
import { databaseServiceProvider } from '../../database/database.providers';
import { DatabaseService } from '../../database/database.service';
import { DocumentsController } from '../documents.controller';
import { centrifugeServiceProvider } from '../../centrifuge-client/centrifuge.module';
import { CentrifugeService } from '../../centrifuge-client/centrifuge.service';
import {
  V2CreateDocumentRequest,
  V2SignedAttributeRequest,
} from '@centrifuge/gateway-lib/centrifuge-node-client';
import TypeEnum = V2SignedAttributeRequest.TypeEnum;
import { RegistriesErrors } from '@centrifuge/gateway-lib/models/schema';

describe('DocumentsController', () => {
  let documentsModule: TestingModule;
  const documentToCreate: Document = {
    header: {
      read_access: ['0x111'],
      write_access: ['0x222'],
    },
    attributes: {
      animal_type: {
        type: TypeEnum.String,
        value: 'iguana',
      },
      diet: {
        type: TypeEnum.String,
        value: 'insects',
      },
      schema: {
        type: TypeEnum.String,
        value: 'zoology',
      },
    },
  };

  const documentToInsert: Document = {
    header: {
      read_access: ['0x111'],
      write_access: ['0x222'],
    },
    attributes: {
      animal_type: {
        type: TypeEnum.String,
        value: 'iguana',
      },
      diet: {
        type: TypeEnum.String,
        value: 'insects',
      },
      schema: {
        type: TypeEnum.String,
        value: 'zoology',
      },
    },
  };

  const user = { _id: 'user_id', account: 'user_account' };

  const databaseSpies: any = {};
  const centApiSpies: any = {};
  let insertedDocument: any = {};

  beforeEach(async () => {
    documentsModule = await Test.createTestingModule({
      controllers: [DocumentsController],
      providers: [
        SessionGuard,
        centrifugeServiceProvider,
        databaseServiceProvider,
      ],
    }).compile();

    const databaseService = documentsModule.get<DatabaseService>(
      DatabaseService,
    );
    insertedDocument = await databaseService.documents.insert({
      header: {
        document_id: '0x39393939',
      },
      ...documentToInsert,
      organizationId: user.account,
      ownerId: user._id,
    });

    databaseSpies.spyFindOne = jest.spyOn(databaseService.documents, 'findOne');
    databaseSpies.spyInsert = jest.spyOn(databaseService.documents, 'insert');
    databaseSpies.spyUpdate = jest.spyOn(databaseService.documents, 'update');
    databaseSpies.spyGetAll = jest.spyOn(
      databaseService.documents,
      'getCursor',
    );
    databaseSpies.spyUpdateById = jest.spyOn(
      databaseService.documents,
      'updateById',
    );

    const centrifugeService = documentsModule.get<CentrifugeService>(
      CentrifugeService,
    );
    centApiSpies.spyGetDocument = jest.spyOn(
      centrifugeService.documents,
      'getDocument',
    );
  });

  describe('create', () => {
    it('should return the created document', async () => {
      const documentsController = documentsModule.get<DocumentsController>(
        DocumentsController,
      );

      const payload: V2CreateDocumentRequest = {
        ...documentToCreate,
      };

      const result = await documentsController.create({ user }, payload);

      expect(result).toMatchObject({
        ...documentToCreate,
        header: {
          job_id: 'some_job_id',
        },
        attributes: {
          ...documentToCreate.attributes,
          _createdBy: {
            type: 'bytes',
            value: 'user_account',
          },
        },
        ownerId: user._id,
        organizationId: user.account,
      });

      expect(databaseSpies.spyInsert).toHaveBeenCalledTimes(1);
    });
  });

  describe('get documents list', () => {
    it('should get the list of documents from the database', async () => {
      const documentsController = documentsModule.get<DocumentsController>(
        DocumentsController,
      );

      const payload: V2CreateDocumentRequest = {
        ...documentToCreate,
      };
      await documentsController.create({ user }, payload);

      payload.attributes = {};

      await documentsController.create({ user }, payload);

      const result = await documentsController.getList({
        user,
      });
      expect(result.length).toEqual(3);
      expect(databaseSpies.spyGetAll).toHaveBeenCalledTimes(1);
    });
  });

  describe('update', () => {
    it('should update the specified document', async () => {
      const documentsController = documentsModule.get<DocumentsController>(
        DocumentsController,
      );

      const updatedDocument: Document = {
        ...documentToCreate,
      };

      const updateResult = await documentsController.updateById(
        { id: insertedDocument._id },
        { user: { _id: 'user_id', account: '0x4441122' } },
        { ...updatedDocument },
      );

      expect(databaseSpies.spyFindOne).toHaveBeenCalledWith({
        _id: insertedDocument._id,
      });

      expect(databaseSpies.spyUpdateById).toHaveBeenCalled();
      expect(databaseSpies.spyUpdate).toHaveBeenCalledWith(
        { _id: insertedDocument._id },
        {
          $set: {
            attributes: {
              animal_type: { type: 'string', value: 'iguana' },
              diet: { type: 'string', value: 'insects' },
              schema: { type: 'string', value: 'zoology' },
            },

            header: { job_id: 'some_job_id' },
          },
        },
        { returnUpdatedDocs: true, upsert: false },
      );
      expect(updateResult!.attributes).toMatchObject({
        ...updatedDocument.attributes,
      });
    });

    it('should throw an error because the document does not exist', async () => {
      const documentsController = documentsModule.get<DocumentsController>(
        DocumentsController,
      );

      const updatedDocument: Document = {
        ...documentToCreate,
      };

      try {
        let a = await documentsController.updateById(
          { id: 'someID' },
          { user: { _id: 'user_id', account: '0x4441122' } },
          { ...updatedDocument },
        );
      } catch (err) {
        expect(err.message.message).toMatch(
          'Can not find document #someID in the database',
        );
        expect(err.status).toEqual(404);
      }
    });
  });

  describe('get by id', () => {
    it('should return the document by id', async () => {
      const documentsController = documentsModule.get<DocumentsController>(
        DocumentsController,
      );

      await documentsController.getById(
        { id: insertedDocument._id },
        { user: { _id: 'user_id', account: '0x4441' } },
      );

      expect(centApiSpies.spyGetDocument).toHaveBeenCalledWith(
        '0x4441',
        insertedDocument.header.document_id,
      );
    });
  });
});
