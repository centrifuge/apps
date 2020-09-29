import { Test, TestingModule } from '@nestjs/testing';
import { HttpException } from '@nestjs/common';
import { ContactsController } from '../contacts.controller';
import { Contact } from '../../../../lib/models/contact';
import { SessionGuard } from '../../auth/SessionGuard';
import { databaseServiceProvider } from '../../database/database.providers';
import { DatabaseService } from '../../database/database.service';

const delay = require('util').promisify(setTimeout);

describe('ContactsController', () => {
  let contactsModule: TestingModule;

  const contactToCreate = new Contact(
    'sarah',
    '0xc128924276e4e539111ca11b590b9447b26a8057',
  );

  const ownerId = 'some_user_id';
  const insertedContacts = [
    { name: 'alberta', address: '0xc111111111a4e539741ca11b590b9447b26a8057', ownerId },
    { name: 'Alice', address: '0xc112221111a4e539741ca11b590b9447b26a8057', ownerId },
  ];
  const databaseSpies: any = {};

  beforeEach(async () => {
    contactsModule = await Test.createTestingModule({
      controllers: [ContactsController],
      providers: [
        SessionGuard,
        databaseServiceProvider,
      ],
    })
      .compile();

    const databaseService = contactsModule.get<DatabaseService>(DatabaseService);

    // add some default contacts to the database
    for (let i = 0; i < insertedContacts.length; i++) {
      await delay(0);
      await databaseService.contacts.insert(insertedContacts[i]);
    }
    databaseSpies.spyInsert = jest.spyOn(databaseService.contacts, 'insert');
    databaseSpies.spyUpdate = jest.spyOn(databaseService.contacts, 'update');
    databaseSpies.spyGetCursor = jest.spyOn(databaseService.contacts, 'getCursor');
  });

  describe('create', () => {
    it('should return the created contact', async () => {
      const contactsController = contactsModule.get<ContactsController>(
        ContactsController,
      );

      const result = await contactsController.create(
        { user: { _id: ownerId } },
        contactToCreate,
      );

      expect(result).toMatchObject({
        ownerId,
        name: contactToCreate.name,
        address: contactToCreate.address,
      });

      expect(databaseSpies.spyInsert).toHaveBeenCalledTimes(1);
    });

    it('should throw error when no name specified', async function() {
      expect.assertions(3);
      const contactsController = contactsModule.get<ContactsController>(
        ContactsController,
      );

      try {
        await contactsController.create({ user: { _id: ownerId } }, {
          address: '0xc111111111a4e539741ca11b590b9447b26a8057',
        } as Contact);
      } catch (err) {
        expect(err.message.message).toEqual('Contact name not specified');
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
        expect(err.message.message).toEqual('This method only supports 0x-prefixed hex strings but input was: undefined');
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
        user: { _id: 'some_user_id', name: 'Test User', account: '0x333' },
      });
      expect(result.length).toEqual(insertedContacts.length );
      // should get the inserted contracts from the beforeEach hook in reverse
      expect(result.reverse()).toMatchObject(
        [
          ...insertedContacts,
        ],
      );

      expect(databaseSpies.spyGetCursor).toHaveBeenCalledTimes(1);
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

      await contactsController.updateById(
        { id: updateContactObject._id },
        updateContactObject,
        {
          user: { _id: ownerId },
        },
      );

      expect(databaseSpies.spyUpdate).toHaveBeenCalledTimes(
        1,
      );
      expect(databaseSpies.spyUpdate).toHaveBeenCalledWith(
        {
          _id: updateContactObject._id,
          ownerId,
        },
        { ...updateContactObject, ownerId },
      );
    });
  });
});
