import { UsersController } from '../users.controller';
import { databaseServiceProvider } from '../../database/database.providers';
import { User, UserWithOrg } from '../../../../lib/models/user';
import config from '../../config';
import { Test, TestingModule } from '@nestjs/testing';
import { SessionGuard } from '../../auth/SessionGuard';
import { DatabaseService } from '../../database/database.service';
import { PERMISSIONS } from '../../../../lib/utils/constants';
import { centrifugeServiceProvider } from '../../centrifuge-client/centrifuge.module';
import { testingHelpers } from '../../mocks/centrifuge-client.mock';
import { MailerService } from '@nestjs-modules/mailer';
import { MailerServiceMock } from '../../mocks/mailer-service.mock';

describe('Users controller', () => {
  let invitedUser: User;
  let enabledUser: User;
  let userModule: TestingModule;

  beforeAll(async () => {
    userModule = await Test.createTestingModule({
      controllers: [UsersController],
      providers: [
        SessionGuard,
        centrifugeServiceProvider,
        databaseServiceProvider,
        {
          provide: MailerService,
          useValue: new MailerServiceMock(),
        },
      ],
    }).compile();

    const databaseService = userModule.get<DatabaseService>(DatabaseService);

    invitedUser = await databaseService.users.insert({
      ...new User(),
      name: 'username',
      email: 'test1',
      account: '0x333',
      chain: {
        centrifuge_chain_account: {
          id: 'test',
          secret: 'test',
          ss_58_address: 'test',
        },
      },
      password: 'Passw0rd!',
      enabled: false,
      invited: true,
      schemas: ['some_schema'],
      permissions: [PERMISSIONS.CAN_MANAGE_DOCUMENTS],
    });

    enabledUser = await databaseService.users.insert({
      ...new User(),
      name: 'username',
      email: 'test2',
      account: '0x333',
      chain: {
        centrifuge_chain_account: {
          id: 'test',
          secret: 'test',
          ss_58_address: 'test',
        },
      },
      password: 'Passw0rd!2',
      enabled: true,
      invited: false,
      schemas: ['some_schema'],
      permissions: [PERMISSIONS.CAN_MANAGE_DOCUMENTS],
    });
  });

  describe('logout', () => {
    it('should call request logout', async () => {
      const usersController = userModule.get<UsersController>(UsersController);

      const request = {
        logout: jest.fn(),
      };

      const response = {
        redirect: jest.fn(),
      };
      await usersController.logout(request, response);
      expect(request.logout).toHaveBeenCalledTimes(1);
      expect(response.redirect).toHaveBeenCalledWith('/');
    });
  });

  describe('when in invite mode', () => {
    beforeEach(() => {
      jest.clearAllMocks();
    });

    let inviteOnly;
    let usersController;

    beforeAll(() => {
      usersController = userModule.get<UsersController>(UsersController);
      inviteOnly = config.inviteOnly;
      config.inviteOnly = true;
    });

    afterAll(() => {
      config.inviteOnly = inviteOnly;
    });

    describe('invite', () => {
      it('should fail if the user exists', async () => {
        await expect(usersController.invite(invitedUser)).rejects.toMatchObject(
          {
            message: {
              message: 'User already invited!',
            },
          },
        );
      });
      it('should add user to the database with invite true and enabled false', async () => {
        const user: UserWithOrg = {
          ...new User(),
          name: 'new_user',
          password: 'password',
          account: '0x4838394',
          email: 'test1' + Math.random(),
        };
        try {
          const invited = await usersController.invite(user);
          expect(invited).toMatchObject({
            ...user,
            password: undefined,
            invited: true,
            enabled: false,
          });
        } catch (e) {
          console.log(e);
        }
      });

      it(' Create create a new user and org', async () => {
        const databaseService = userModule.get<DatabaseService>(
          DatabaseService,
        );

        const organizationName = 'Some org';
        const user: User = {
          ...new User(),
          name: 'new_user',
          password: 'password',
          email: 'test1' + Math.random(),
        };
        try {
          const invited = await usersController.invite({
            ...user,
            organizationName,
          });
          expect(invited).toMatchObject({
            ...user,
            password: undefined,
            invited: true,
            enabled: false,
            account: testingHelpers.currentGeneratedAccount,
          });

          const org = await databaseService.organizations.findOne({
            account: testingHelpers.currentGeneratedAccount,
          });

          expect(org).toMatchObject({
            name: organizationName,
            account: testingHelpers.currentGeneratedAccount,
          });
        } catch (e) {
          console.log(e);
        }
      });
    });

    describe('register', () => {
      it('should throw if the username is taken and there is an enabled user', async () => {
        await expect(
          usersController.register(enabledUser),
        ).rejects.toMatchObject({
          message: {
            message: 'Email taken!',
          },
        });
      });

      it('should throw password has wrong format', async () => {
        await expect(
          usersController.register({
            ...invitedUser,
            password: 'wrongFormat',
          }),
        ).rejects.toMatchObject({
          message: {
            message: 'Password format is not valid',
          },
        });
      });

      it('should throw if the user has not been invited', async () => {
        const notInvitedUser: User = {
          ...new User(),
          _id: 'some_user_id',
          name: 'new_user',
          email: 'test',
          account: '0x55',
          password: 'Passw0rd!',
          invited: false,
          enabled: true,
          permissions: [],
        };

        await expect(
          usersController.register(notInvitedUser),
        ).rejects.toMatchObject({
          message: {
            message: 'Email taken!',
          },
        });
      });

      it('should create the user if the user has been invited', async () => {
        const user: any = {
          ...invitedUser,
        };

        const result = await usersController.register(invitedUser);
        // password is tested in auth.service.spec.ts
        delete user.password;
        // field mutation owned by nedb. Irrelevant for test
        delete user.updatedAt;
        expect(result).toMatchObject({
          ...user,
          enabled: true,
        });
      });
    });

    describe('update', () => {
      it('Should update the user', async () => {
        const updated = await usersController.update({
          ...enabledUser,
          name: 'changed name',
          permissions: [PERMISSIONS.CAN_MANAGE_DOCUMENTS],
        });

        expect(updated.name).toEqual('changed name');
      });

      it('Should not update the user because the email is taken', async () => {
        await expect(
          usersController.update({
            ...enabledUser,
            name: 'changed name 2',
            email: 'test1',
            permissions: [PERMISSIONS.CAN_MANAGE_DOCUMENTS],
          }),
        ).rejects.toMatchObject({
          message: {
            message: 'Email taken!',
          },
        });
      });
    });
  });

  describe('when not in invite mode', () => {
    let inviteOnly;
    let usersController;
    beforeAll(() => {
      usersController = userModule.get<UsersController>(UsersController);
      inviteOnly = config.inviteOnly;
      config.inviteOnly = false;
    });

    afterAll(() => {
      config.inviteOnly = inviteOnly;
    });

    describe('register', () => {
      beforeEach(() => {
        jest.clearAllMocks();
      });

      it('should return error if the email is taken', async () => {
        await expect(
          usersController.register(invitedUser),
        ).rejects.toMatchObject({
          message: {
            message: 'Email taken!',
          },
        });
      });

      it('should create the user if the username is not taken', async () => {
        const newUser: UserWithOrg = {
          ...new UserWithOrg(),
          name: 'new_user',
          email: 'new_email',
          enabled: false,
          invited: false,
          password: 'SomePassW0rd!',
          account: '0x39282833',
          permissions: [],
        };

        const result = await usersController.register(newUser);
        expect(result).toMatchObject({
          ...newUser,
          password: result.password,
          enabled: true,
        });
      });
      it('should not create the user if the password is empty or not set', async () => {
        await expect(
          usersController.register({
            _id: 'undefinedPassword',
            name: 'new_user',
            email: 'new_email',
            password: undefined,
            account: '0x444',
            enabled: false,
            invited: false,
            permissions: [],
            schemas: [],
          }),
        ).rejects.toMatchObject({
          message: {
            message: 'Password is mandatory',
          },
        });

        await expect(
          usersController.register({
            _id: 'undefinedPassword',
            name: 'new_user',
            email: 'new_email',
            account: '0x444',
            password: null,
            enabled: false,
            invited: false,
            permissions: [],
            schemas: [],
          }),
        ).rejects.toMatchObject({
          message: {
            message: 'Password is mandatory',
          },
        });

        await expect(
          usersController.register({
            _id: 'undefinedPassword',
            name: 'new_user',
            email: 'new_email',
            account: '0x444',
            password: '  ',
            enabled: false,
            invited: false,
            permissions: [],
            schemas: [],
          }),
        ).rejects.toMatchObject({
          message: {
            message: 'Password is mandatory',
          },
        });
      });
    });

    describe('invite', () => {
      it('should throw error', async () => {
        await expect(
          usersController.invite({
            name: 'any_username',
            email: 'test',
            permissions: [PERMISSIONS.CAN_MANAGE_DOCUMENTS],
          }),
        ).rejects.toMatchObject({
          message: {
            message: 'Invite functionality not enabled!',
          },
        });
      });
    });
  });

  it('should remove an existing user', async () => {
    const usersController = userModule.get<UsersController>(UsersController);
    const newUser: UserWithOrg = {
      ...new UserWithOrg(),
      name: 'new_user',
      email: 'test@remove.com',
      enabled: false,
      invited: false,
      password: 'SomePassW0rd!',
      account: '0x39282833',
      permissions: [],
    };

    const insertedUser = await usersController.invite(newUser);
    const result = await usersController.remove(
      { id: insertedUser._id }
    );
    expect(result).toBe(1);
  });
});
