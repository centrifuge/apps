import { Test, TestingModule } from '@nestjs/testing';
import { ContactsController } from './contacts.controller';
import { ContactsService } from './contacts.service';
import { Contact } from '../../../src/common/models/dto/contact';
import { SessionGuard } from '../auth/SessionGuard';
import { centrifugeClientFactory } from '../centrifuge-client/centrifuge.client';
import { tokens } from '../centrifuge-client/centrifuge.constants';

describe('ContactsController', () => {
  let contactsModule: TestingModule;

  const contactToCreate = new Contact('sarah', '0xsarah_address');
  const fetchedContacts = [new Contact('alberta', '0xalberta_address')];

  class ContactsServiceMock {
    create = jest.fn(val => val);
    get = jest.fn(() => fetchedContacts);
  }

  const contactServiceMock = new ContactsServiceMock();

  class CentrifugeClientMock {
    create = jest.fn(data => data);
  }

  const centrifugeClientMock = new CentrifugeClientMock();

  beforeEach(async () => {
    contactsModule = await Test.createTestingModule({
      controllers: [ContactsController],
      providers: [SessionGuard, centrifugeClientFactory],
    })
      .overrideProvider(ContactsService)
      .useValue(contactServiceMock)
      .overrideProvider(tokens.centrifugeClientFactory)
      .useValue(centrifugeClientMock)
      .compile();

    contactServiceMock.create.mockClear();
    contactServiceMock.get.mockClear();
  });

  describe('create', () => {
    it('should return the created contact', async () => {
      const contactsController = contactsModule.get<ContactsController>(
        ContactsController,
      );

      const userId = 'owner_id';

      const result = await contactsController.create(
        { user: { id: userId } },
        contactToCreate,
      );
      expect(result).toEqual({
        ownerId: userId,
        name: contactToCreate.name,
        address: contactToCreate.address,
      });

      expect(contactServiceMock.create).toHaveBeenCalledTimes(1);
    });
  });

  describe('get', () => {
    it('should return a list of contacts', async () => {
      const contactsController = contactsModule.get<ContactsController>(
        ContactsController,
      );

      const result = await contactsController.get({
        user: { id: 'some_user_id' },
      });
      expect(result).toBe(fetchedContacts);
      expect(contactServiceMock.get).toHaveBeenCalledTimes(1);
    });
  });
});
