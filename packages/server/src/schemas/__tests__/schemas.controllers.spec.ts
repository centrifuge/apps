import { Test, TestingModule } from '@nestjs/testing';
import { HttpException } from '@nestjs/common';
import { AttributesErrors, AttrTypes, DiffErrors, RegistriesErrors, Schema } from '../../../../lib/models/schema';
import { SessionGuard } from '../../auth/SessionGuard';
import { databaseServiceProvider } from '../../database/database.providers';
import { DatabaseService } from '../../database/database.service';
import { SchemasController } from '../schemas.controllers';

const delay = require('util').promisify(setTimeout);

describe('SchemasController', () => {
  let schemaModule: TestingModule;

  const getSchemaData = () => ({
    name: 'bestAnimals',
    attributes: [
      {
        name: 'reference_id',
        label: 'ReferenceId',
        type: AttrTypes.STRING,
      },
      {
        name: 'animal_wingspan',
        label: 'wingspans',
        type: AttrTypes.STRING,
      },
      {
        name: 'animal_reference_id',
        label: 'reference_id',
        type: AttrTypes.STRING,
      },
    ]
    ,
    registries: [
      {
        label: 'BEST_ANIMALS_NFT',
        address: '0x3Ba4280217e78a0EaEA612c1502FC2e92A7FE5D7',
        asset_manager_address: '0x3Ba4280217e78a0EaEA612c1502FC2e92A7FE5D7',
        proofs: [
          'attributes.animals.wingspans',
          'header.document_id',
        ],
      },
    ],
    template: '',
    collaborators: [],
  });
  let schemaToCreate;

  const databaseSpies: any = {};

  beforeEach(async () => {
    const schemaData = getSchemaData();
    schemaToCreate = new Schema(
      schemaData.name,
      schemaData.attributes,
      schemaData.registries,
      schemaData.collaborators,
    );

    schemaModule = await Test.createTestingModule({
      controllers: [SchemasController],
      providers: [
        SessionGuard,
        databaseServiceProvider,
      ],
    }).compile();

    const databaseService = schemaModule.get<DatabaseService>(DatabaseService);

    databaseSpies.spyInsert = jest.spyOn(databaseService.schemas, 'insert');
    databaseSpies.spyUpdate = jest.spyOn(databaseService.schemas, 'update');
    databaseSpies.spyGetCursor = jest.spyOn(databaseService.schemas, 'getCursor');
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
        registries: schemaToCreate.registries,
      });

      expect(databaseSpies.spyInsert).toHaveBeenCalledTimes(1);
      try {
        await schemasController.create(schemaToCreate)
      } catch (err) {
        expect(err.message.message).toMatch(`Schema with name ${schemaToCreate.name} exists in the database`)
      }
    });

    it('should throw error when registry address is of the wrong format', async () => {
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
            },
          ],
          registries: [
            {
              label: 'test registry',
              address: '0x111',
              asset_manager_address: '0x3Ba4280217e78a0EaEA612c1502FC2e92A7FE5D7',
            },
          ],
        } as Schema);
      } catch (err) {
        expect(err.message.message).toMatch(RegistriesErrors.ADDRESS_FORMAT);
        expect(err.status).toEqual(400);
        expect(err instanceof HttpException).toEqual(true);
      }
    });

    it('should throw error when there is no reference id attribute', async () => {
      expect.assertions(3);
      const schemasController = schemaModule.get<SchemasController>(
        SchemasController,
      );

      try {
        await schemasController.create({
          name: Math.random().toString(),
          attributes: [
            {
              name: 'document_qualities',
              label: 'catlike_qualities',
              type: AttrTypes.STRING,
            },
          ],
          registries: [
            {
              address: '0x3Ba4280217e78a0EaEA612c1502FC2e92A7FE5D7',
              asset_manager_address: '0x3Ba4280217e78a0EaEA612c1502FC2e92A7FE5D7',
              label: 'sdsds',
              proofs: ['sss', 'saaass'],
            },
          ],
        } as Schema);
      } catch (err) {
        expect(err.message.message).toEqual(AttributesErrors.REFERENCE_ID_MISSING);
        expect(err.status).toEqual(400);
        expect(err instanceof HttpException).toEqual(true);
      }
    });
    it('should throw error when attributes are nested', async function() {
      expect.assertions(4);
      const schemasController = schemaModule.get<SchemasController>(
        SchemasController,
      );

      try {
        await schemasController.create({
          name: Math.random().toString(),
          attributes: [
            {
              name: 'document.qualities',
              label: 'catlike_qualities',
              type: AttrTypes.STRING,
            },
          ],
          registries: [
            {
              address: '0x3Ba4280217e78a0EaEA612c1502FC2e92A7FE5D7',
              asset_manager_address: '0x3Ba4280217e78a0EaEA612c1502FC2e92A7FE5D7',
              label: 'sdsds',
              proofs: ['sss', 'saaass'],
            },
          ],
        } as Schema);
      } catch (err) {
        expect(err.message.message).toMatch(AttributesErrors.NESTED_ATTRIBUTES_NOT_SUPPORTED);
        expect(err.message.message).toMatch('document.qualities');
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

      for (let i = 0; i < 5; i++) {
        await delay(0);
        const newSchema = getSchemaData();
        newSchema.registries[0].label = `increment_${i}`;
        newSchema.name = `increment_${i}`;
        await schemasController.create(newSchema);
      }

      const result = await schemasController.get();
      expect(result.length).toEqual(5);
      expect(databaseSpies.spyGetCursor).toHaveBeenCalledTimes(1);
    });

    it('should return a filtered list of schemas', async () => {
      const schemasController = schemaModule.get<SchemasController>(
        SchemasController,
      );

      for (let i = 0; i < 5; i++) {
        await delay(0);
        const newSchema = getSchemaData();
        newSchema.registries[0].label = `increment_${i}`;
        newSchema.name = `increment_${i}`;
        await schemasController.create(newSchema);
      }

      const find1 = await schemasController.get({ 'name': 'increment_0', 'registries.0.label': 'increment_0' });
      expect(find1.length).toEqual(1);

      const find2 = await schemasController.get({
        'name': { $in: ['increment_0', 'increment_1'] },
        'registries.0.label': { $in: ['increment_0', 'increment_1'] },
      });
      expect(find2.length).toEqual(2);

      expect(databaseSpies.spyGetCursor).toHaveBeenCalledTimes(2);
    });
  });

  describe('archive', () => {
    it('should archive a schema', async () => {
      const schemasController = schemaModule.get<SchemasController>(
        SchemasController,
      );

      const newSchema = await schemasController.create({
        ...schemaToCreate,
        name: Math.random().toString(),
      });
      const result: Schema = await schemasController.archive({ id: newSchema._id });
      expect(result.archived).toEqual(true);
    });

    it('should restore a schema', async () => {
      const schemasController = schemaModule.get<SchemasController>(
        SchemasController,
      );

      const newSchema = await schemasController.create({
        ...schemaToCreate,
        archived: true,
        name: Math.random().toString(),
      });
      const result: Schema = await schemasController.restore({ id: newSchema._id });
      expect(result.archived).toEqual(false);
    });
  });

  describe('update', () => {
    it('should update the schema in the database', async () => {
      const schemasController = schemaModule.get<SchemasController>(
        SchemasController,
      );

      const result = await schemasController.create(
        schemaToCreate,
      );

      const updateSchemaObject = {
        ...result,
        registries: [
          {
            label: 'animal_registry',
            address: '0x87c574FB2DF0EaA2dAf5fc4a8A16dd3Ce39011B1',
            asset_manager_address: '0x3Ba4280217e78a0EaEA612c1502FC2e92A7FE5D7',
            proofs: ['attributes.wingspan'],
          },
        ],
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
          $set: {
            formFeatures: undefined,
            attributes: [{ label: 'ReferenceId', name: 'reference_id', type: 'string' }, {
              label: 'wingspans',
              type: 'string',
              name: 'animal_wingspan',
            }, { name: 'animal_reference_id', label: 'reference_id', type: 'string' }],
            name: 'bestAnimals',
            registries: [{
              address: '0x87c574FB2DF0EaA2dAf5fc4a8A16dd3Ce39011B1',
              asset_manager_address: '0x3Ba4280217e78a0EaEA612c1502FC2e92A7FE5D7',
              label: 'animal_registry',
              proofs: ['attributes.wingspan'],
            }],
          },
        },
        {
          returnUpdatedDocs: true,
          upsert: false,
        },
      );

      const updated = await schemasController.getById({ id: result._id });
      expect(updated!.registries[0].address).toEqual(updateSchemaObject.registries[0].address);

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
        );
      } catch (err) {
        expect(err.message.message).toEqual(DiffErrors.NAME_CHANGE_FORBIDEN);
        expect(err.status).toEqual(400);
        expect(err instanceof HttpException).toEqual(true);
      }
    });
  });
});
