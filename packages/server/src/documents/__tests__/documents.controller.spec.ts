import { Test, TestingModule } from '@nestjs/testing';
import { Document } from '../../../../lib/models/document';
import { SessionGuard } from '../../auth/SessionGuard';
import { databaseServiceProvider } from '../../database/database.providers';
import { DatabaseService } from '../../database/database.service';
import { DocumentsController } from '../documents.controller';
import { centrifugeServiceProvider } from '../../centrifuge-client/centrifuge.module';
import { CoreapiCreateDocumentRequest } from '../../../../lib/centrifuge-node-client';
import { CentrifugeService } from '../../centrifuge-client/centrifuge.service';

describe('DocumentsController', () => {
  let documentsModule: TestingModule;
  const documentToCreate: Document = {
    header: {
      readAccess: ['0x111'],
      writeAccess: ['0x222'],
    },
    attributes: {
      animal_type: {
        type: 'string',
        value: 'iguana',
      },
      diet: {
        type: 'string',
        value: 'insects',
      },
      schema: {
        type: 'string',
        value: 'zoology',
      },
    },
  };

  const documentToInsert: Document = {
    header: {
      readAccess: ['0x111'],
      writeAccess: ['0x222'],
    },
    attributes: {
      animal_type: {
        type: 'string',
        value: 'iguana',
      },
      diet: {
        type: 'string',
        value: 'insects',
      },
      schema: {
        type: 'string',
        value: 'zoology',
      },
    },
  };

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

    const databaseService = documentsModule.get<DatabaseService>(DatabaseService);
    insertedDocument = await databaseService.documents.insert({
      header: {
        documentId: '0x39393939',
      },
      ...documentToInsert,
      ownerId: 'user_id',
    });

    databaseSpies.spyFindOne = jest.spyOn(databaseService.documents, 'findOne');
    databaseSpies.spyInsert = jest.spyOn(databaseService.documents, 'insert');
    databaseSpies.spyUpdate = jest.spyOn(databaseService.documents, 'update');
    databaseSpies.spyGetAll = jest.spyOn(databaseService.documents, 'getCursor');
    databaseSpies.spyUpdateById = jest.spyOn(databaseService.documents, 'updateById');

    const centrifugeService = documentsModule.get<CentrifugeService>(CentrifugeService);
    centApiSpies.spyGetDocument = jest.spyOn(centrifugeService.documents, 'getDocument');
  });

  // describe('create', () => {
  //   it('should return the created document', async () => {
  //     const documentsController = documentsModule.get<DocumentsController>(
  //       DocumentsController,
  //     );
  //
  //     const payload: CoreapiCreateDocumentRequest = {
  //       ...documentToCreate,
  //     };
  //     const result = await documentsController.create(
  //       { user: { _id: 'user_id', account: 'user_account' } },
  //       payload,
  //     );
  //
  //     expect(result).toMatchObject({
  //       ...documentToCreate,
  //       header: {
  //         job_id: 'some_job_id',
  //       },
  //       attributes: {
  //         ...documentToCreate.attributes,
  //         _createdBy: {
  //           type: 'bytes',
  //           value: 'user_account',
  //         },
  //       },
  //       ownerId: 'user_id',
  //     });
  //
  //     expect(databaseSpies.spyInsert).toHaveBeenCalledTimes(1);
  //   });
  // });
  //
  // describe('get documents list', () => {
  //
  //   it('should get the list of documents from the database', async () => {
  //     const documentsController = documentsModule.get<DocumentsController>(
  //       DocumentsController,
  //     );
  //
  //     const payload: CoreapiCreateDocumentRequest = {
  //       ...documentToCreate,
  //     };
  //
  //     await documentsController.create(
  //       { user: { _id: 'user_id' } },
  //       payload,
  //     );
  //
  //     payload.attributes = {};
  //
  //     await documentsController.create(
  //       { user: { _id: 'user_id' } },
  //       payload,
  //     );
  //
  //     const result = await documentsController.getList({
  //       user: { _id: 'user_id' },
  //     });
  //     expect(result.length).toEqual(3);
  //     expect(databaseSpies.spyGetAll).toHaveBeenCalledTimes(1);
  //   });
  // });

  describe('update', function() {
    it('should update the specified document', async function() {
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
          $set:
            {
              attributes:
                {
                  animal_type:
                    { type: 'string', value: 'iguana' },
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

    it('should throw and error because the document does not exist', async function() {
      const documentsController = documentsModule.get<DocumentsController>(
        DocumentsController,
      );

      const updatedDocument: Document = {
        ...documentToCreate,
      };
      await expect(
        documentsController.updateById(
          { id: 'someID' },
          { user: { _id: 'user_id', account: '0x4441122' } },
          { ...updatedDocument },
        ),
      ).rejects.toMatchObject({
        message: {
          message: `Can not find document #someID in the database`,
        },
      });
    });
  });

  describe('get by id', function() {
    it('should return the document by id', async function() {
      const documentsController = documentsModule.get<DocumentsController>(
        DocumentsController,
      );

      const result = await documentsController.getById(
        { id: insertedDocument._id },
        { user: { _id: 'user_id', account: '0x4441' } },
      );
      expect(databaseSpies.spyFindOne).toHaveBeenCalledWith({
        _id: insertedDocument._id,
        ownerId: 'user_id',
      });

      expect(centApiSpies.spyGetDocument).toHaveBeenCalledWith(
        '0x4441',
        insertedDocument.header.document_id,
      );

    });
  });
});
