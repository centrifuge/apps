import { Test, TestingModule } from '@nestjs/testing';
import { HttpException } from '@nestjs/common';
import { ContactsController } from './contacts.controller';
import { Contact } from '../../../src/common/models/contact';
import { SessionGuard } from '../auth/SessionGuard';
import { centrifugeServiceProvider } from '../centrifuge-client/centrifuge.provider';
import { databaseServiceProvider } from '../database/database.providers';
import { CentrifugeService } from '../centrifuge-client/centrifuge.service';
import { DatabaseService } from '../database/database.service';

describe('ContactsController', () => {
  let contactsModule: TestingModule;

  const contactToCreate = new Contact(
    'sarah',
    '0xc128924276e4e539111ca11b590b9447b26a8057',
  );
  const fetchedContacts = [
    new Contact('alberta', '0xc111111111a4e539741ca11b590b9447b26a8057'),
  ];

  class DatabaseServiceMock {
    contacts = {
      insert: jest.fn(val => val),
      update: jest.fn(val => val),
      find: jest.fn(() => fetchedContacts),
      updateByQuery: jest.fn(data => data),
    };
  }

  const databaseServiceMock = new DatabaseServiceMock();

  class CentrifugeClientMock {
    documents = {
      create: jest.fn(data => data),
    };
  }

  const centrifugeClientMock = new CentrifugeClientMock();

  beforeEach(async () => {
    contactsModule = await Test.createTestingModule({
      controllers: [ContactsController],
      providers: [
        SessionGuard,
        centrifugeServiceProvider,
        databaseServiceProvider,
      ],
    })
      .overrideProvider(DatabaseService)
      .useValue(databaseServiceMock)
      .overrideProvider(CentrifugeService)
      .useValue(centrifugeClientMock)
      .compile();

    databaseServiceMock.contacts.insert.mockClear();
    databaseServiceMock.contacts.find.mockClear();
  });

  describe('create', () => {
    it('should return the created contact', async () => {
      const contactsController = contactsModule.get<ContactsController>(
        ContactsController,
      );

      const userId = 'owner_id';

      const result = await contactsController.create(
        { user: { _id: userId } },
        contactToCreate,
      );

      expect(result).toEqual({
        ownerId: userId,
        name: contactToCreate.name,
        address: contactToCreate.address,
      });

      expect(databaseServiceMock.contacts.insert).toHaveBeenCalledTimes(1);
    });

    it('should throw error when no name specified', async function() {
      expect.assertions(3);
      const contactsController = contactsModule.get<ContactsController>(
        ContactsController,
      );

      const userId = 'owner_id';

      try {
        await contactsController.create({ user: { _id: userId } }, {
          address: '0xc111111111a4e539741ca11b590b9447b26a8057',
        } as Contact);
      } catch (err) {
        expect(err.message).toEqual('Contact name not specified');
        expect(err.status).toEqual(400);
        expect(err instanceof HttpException).toEqual(true);
      }
    });

    it('should throw error when no address specified', async function() {
      expect.assertions(3);
      const contactsController = contactsModule.get<ContactsController>(
        ContactsController,
      );

      const userId = 'owner_id';

      try {
        await contactsController.create({ user: { _id: userId } }, {
          name: 'Joe',
        } as Contact);
      } catch (err) {
        expect(err.message).toEqual('Contact address not specified');
        expect(err.status).toEqual(400);
        expect(err instanceof HttpException).toEqual(true);
      }
    });
  });

  describe('get', () => {
    it('should return a list of contacts', async () => {
      const contactsController = contactsModule.get<ContactsController>(
        ContactsController,
      );

      const result = await contactsController.get({
        user: { _id: 'some_user_id' },
      });
      expect(result).toBe(fetchedContacts);
      expect(databaseServiceMock.contacts.find).toHaveBeenCalledTimes(1);
    });
  });

  describe('update', function() {
    it('should call the database service', async function() {
      const contactsController = contactsModule.get<ContactsController>(
        ContactsController,
      );

      const updateContactObject = {
        name: 'Snow white',
        address: 'Dark forest',
        _id: 'snow_white_7',
      };

      const userId = 'some_user_id';

      await contactsController.updateById(
        { id: updateContactObject._id },
        updateContactObject,
        {
          user: { _id: userId },
        },
      );

      expect(databaseServiceMock.contacts.update).toHaveBeenCalledTimes(
        1,
      );
      expect(databaseServiceMock.contacts.update).toHaveBeenCalledWith(
        {
          _id: updateContactObject._id,
          ownerId: userId,
        },
        { ...updateContactObject, ownerId: userId },
      );
    });
  });
});
