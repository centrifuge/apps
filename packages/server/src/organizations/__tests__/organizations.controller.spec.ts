import { Test, TestingModule } from '@nestjs/testing';
import { HttpException } from '@nestjs/common';
import { OrganizationsController } from '../organizations.controller';
import { SessionGuard } from '../../auth/SessionGuard';
import { databaseServiceProvider } from '../../database/database.providers';
import { DatabaseService } from '../../database/database.service';
import { Organization } from '@centrifuge/gateway-lib/models/organization';

// tslint:disable-next-line:no-var-requires
const delay = require('util').promisify(setTimeout);

describe('OrganizationController', () => {
  let organizationsModule: TestingModule;

  const organizationToCreate = new Organization(
    'SomeOrganisation',
    '0xc128924276e4e539111ca11b590b9447b26a8055',
  );

  const insertedOrganizations = [
    { name: 'FirstOrg', account: '0xc111111111a4e539741ca11b590b9447b26a8057' },
    {
      name: 'SecondOrg',
      account: '0xc112221111a4e539741ca11b590b9447b26a8056',
    },
  ];
  const databaseSpies: any = {};

  beforeEach(async () => {
    organizationsModule = await Test.createTestingModule({
      controllers: [OrganizationsController],
      providers: [SessionGuard, databaseServiceProvider],
    }).compile();

    const databaseService = organizationsModule.get<DatabaseService>(
      DatabaseService,
    );

    // make sure the table is empty and
    // add some default contacts to the database
    databaseService.organizations.remove({});
    for (const item of insertedOrganizations) {
      await delay(0);
      await databaseService.organizations.insert(item);
    }
    databaseSpies.spyInsert = jest.spyOn(
      databaseService.organizations,
      'insert',
    );
    databaseSpies.spyUpdate = jest.spyOn(
      databaseService.organizations,
      'update',
    );
    databaseSpies.spyGetCursor = jest.spyOn(
      databaseService.organizations,
      'getCursor',
    );
  });

  describe('create', () => {
    it('should return the created organization', async () => {
      const organizationsController = organizationsModule.get<
        OrganizationsController
      >(OrganizationsController);

      const result = await organizationsController.create(organizationToCreate);
      expect(result).toMatchObject({
        name: organizationToCreate.name,
        account: organizationToCreate.account,
      });

      expect(databaseSpies.spyInsert).toHaveBeenCalledTimes(1);
    });

    it('should throw error when no name specified', async () => {
      expect.assertions(3);
      const organizationsController = organizationsModule.get<
        OrganizationsController
      >(OrganizationsController);

      try {
        await organizationsController.create({
          account: '0xc111111111a4e539741ca11b590b9447b26a8050',
        } as Organization);
      } catch (err) {
        expect(err.message.message).toEqual('Organization name not specified');
        expect(err.status).toEqual(400);
        expect(err instanceof HttpException).toEqual(true);
      }
    });

    it('should throw error when no account specified', async () => {
      expect.assertions(3);
      const organizationsController = organizationsModule.get<
        OrganizationsController
      >(OrganizationsController);

      const userId = 'owner_id';

      try {
        await organizationsController.create({
          name: 'Joe',
        } as Organization);
      } catch (err) {
        expect(err.message.message).toEqual(
          'This method only supports 0x-prefixed hex strings but input was: undefined',
        );
        expect(err.status).toEqual(400);
        expect(err instanceof HttpException).toEqual(true);
      }
    });
  });

  describe('get', () => {
    it('should return a list of organizations', async () => {
      const organizationsController = organizationsModule.get<
        OrganizationsController
      >(OrganizationsController);

      const result = await organizationsController.get({});
      expect(result.length).toEqual(insertedOrganizations.length);
      // should get the inserted organizations from the beforeEach hook in reverse
      expect(result.reverse()).toMatchObject([...insertedOrganizations]);

      expect(databaseSpies.spyGetCursor).toHaveBeenCalledTimes(1);
    });
  });

  describe('update', () => {
    it('should call the database service', async () => {
      const organizationsController = organizationsModule.get<
        OrganizationsController
      >(OrganizationsController);

      const updateOrganizationObject = {
        name: 'Account',
        account: 'Dark forest',
        _id: 'snow_white_7',
      };

      await organizationsController.updateById(
        { id: updateOrganizationObject._id },
        updateOrganizationObject,
        {},
      );

      expect(databaseSpies.spyUpdate).toHaveBeenCalledTimes(1);
      expect(databaseSpies.spyUpdate).toHaveBeenCalledWith(
        {
          _id: updateOrganizationObject._id,
        },
        { ...updateOrganizationObject },
      );
    });
  });
});
