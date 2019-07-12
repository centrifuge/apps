import {Test, TestingModule} from '@nestjs/testing';
import {HttpException} from '@nestjs/common';
import {AttrTypes, Schema} from '../../../src/common/models/schema';
import {SessionGuard} from '../auth/SessionGuard';
import {databaseServiceProvider} from '../database/database.providers';
import {DatabaseService} from '../database/database.service';
import {SchemasController} from "./schemas.controllers";

const delay = require('util').promisify(setTimeout);

describe('SchemasController', () => {
  let schemaModule: TestingModule;
  const schemaToCreate = new Schema(
      'bestAnimals',
      [
        {
          name: 'reference_id',
          label: 'ReferenceId',
          type: AttrTypes.STRING,
        },
        {
          name: 'animal.wingspan',
          label: 'wingspans',
          type: AttrTypes.STRING,
        },
        {
          name: 'animal.reference_id',
          label: 'reference_id',
          type: AttrTypes.STRING,
        }
      ]
      ,
      [
        {
          label: 'BEST_ANIMALS_NFT',
          address: '0x3Ba4280217e78a0EaEA612c1502FC2e92A7FE5D7',
          proofs: [
            'attributes.animals.wingspans',
            'header.document_id'
          ]
        }
      ],
  );

  const databaseSpies: any = {};

  beforeEach(async () => {
    schemaModule = await Test.createTestingModule({
      controllers: [SchemasController],
      providers: [
        SessionGuard,
        databaseServiceProvider,
      ],
    })
      .compile();

    const databaseService = schemaModule.get<DatabaseService>(DatabaseService);

    databaseSpies.spyInsert = jest.spyOn(databaseService.schemas, 'insert');
    databaseSpies.spyUpdate = jest.spyOn(databaseService.schemas, 'update');
    databaseSpies.spyGetAll = jest.spyOn(databaseService.schemas, 'find');
  });

  describe('create', () => {
    it('should return the created schema', async () => {
      const schemasController = schemaModule.get<SchemasController>(
          SchemasController,
      );

      const result = await schemasController.create(
          schemaToCreate,
      );

      expect(result).toMatchObject({
        name: schemaToCreate.name,
        attributes: schemaToCreate.attributes,
        registries: schemaToCreate.registries
      });

      expect(databaseSpies.spyInsert).toHaveBeenCalledTimes(1);
    });

    it('should throw error when registry address is of the wrong format', async function() {
      expect.assertions(3);
      const schemasController = schemaModule.get<SchemasController>(
          SchemasController,
      );

      try {
        await schemasController.create({
          name: 'bestAnimals',
          attributes: [
            {
              name: 'document.qualities',
              label: 'catlike_qualities',
              type: AttrTypes.STRING,
            }
          ],
          registries: [
            {
              address: '0x111'
            }
          ]} as Schema);
      } catch (err) {
        expect(err.message).toEqual('0x111 is not a valid registry address');
        expect(err.status).toEqual(400);
        expect(err instanceof HttpException).toEqual(true);
      }
    });

    it('should throw error when there is no reference id attribute', async function() {
      expect.assertions(3);
      const schemasController = schemaModule.get<SchemasController>(
          SchemasController,
      );

      try {
        await schemasController.create({
          name: 'bestAnimals',
          attributes: [
            {
              name: 'document.qualities',
              label: 'catlike_qualities',
              type: AttrTypes.STRING,
            }
          ],
          registries: [
            {
              address: '0x3Ba4280217e78a0EaEA612c1502FC2e92A7FE5D7',
            }
          ]} as Schema);
      } catch (err) {
        expect(err.message).toEqual('Attributes do not contain a reference ID');
        expect(err.status).toEqual(400);
        expect(err instanceof HttpException).toEqual(true);
      }
    });
  });

  describe('get', () => {
    it('should return a list of schemas', async () => {
      const schemasController = schemaModule.get<SchemasController>(
          SchemasController,
      );

      for (let i = 0; i < 5; i ++) {
        await delay(0);
        schemaToCreate.registries[0].label = `increment_${i}` ;
        await schemasController.create(schemaToCreate);
      }

      const result = await schemasController.get();
      expect(result.length).toEqual(5);
      expect(databaseSpies.spyGetAll).toHaveBeenCalledTimes(1);
    });
  });

  describe('update', function() {
    it('should update the schema in the database', async function() {
      const schemasController = schemaModule.get<SchemasController>(
          SchemasController,
      );

      const result = await schemasController.create(
          schemaToCreate,
      );

      const updateSchemaObject = {
        _id: result._id,
        registries: [
          {
            label: 'animal_registry',
            address:'0x87c574FB2DF0EaA2dAf5fc4a8A16dd3Ce39011B1',
            proofs:['attributes.wingspan']
          }
        ]
      } as Schema;

      await schemasController.update(
          { id: result._id },
          updateSchemaObject,
      );

      expect(databaseSpies.spyUpdate).toHaveBeenCalledTimes(1);
      expect(databaseSpies.spyUpdate).toHaveBeenCalledWith(
          {
            _id: result._id,
          },
          {
            '_id': result._id,
            'attributes': [{"label": "ReferenceId", "name": "reference_id", "type": "string"}, {"label": "wingspans", "type": "string", "name": "animal.wingspan"}, {"name": "animal.reference_id", "label": "reference_id", "type":"string"}],
            "name": "bestAnimals",
            "registries": [{
              "address": "0x87c574FB2DF0EaA2dAf5fc4a8A16dd3Ce39011B1",
              "label": "animal_registry",
              "proofs": ["attributes.wingspan"]
            }]
          },
          {
            returnUpdatedDocs: true,
            upsert: false,
          }
      );

      const updated = await schemasController.getById({id: result._id});
      expect(updated!.registries[0].address).toEqual(updateSchemaObject.registries[0].address)

      const updateSchemaObject2 = {
        _id: result._id,
        name: 'wrongupdate',
        attributes: result.attributes,
        registries: result.registries,
      } as Schema;

      try {
        await schemasController.update(
            { id: result._id },
            updateSchemaObject2,
        )
      } catch (err) {
        expect(err.message).toEqual('Updating a schema name or attributes is not allowed');
        expect(err.status).toEqual(400);
        expect(err instanceof HttpException).toEqual(true);
      }
    });
  });
});
