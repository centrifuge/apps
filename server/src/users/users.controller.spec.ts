import { UsersController } from './users.controller';
import { databaseServiceProvider } from '../database/database.providers';
import { User } from '../../../src/common/models/user';
import config from '../../../src/common/config';
import { Test, TestingModule } from '@nestjs/testing';
import { SessionGuard } from '../auth/SessionGuard';
import { CentrifugeService } from '../centrifuge-client/centrifuge.service';
import { DatabaseService } from '../database/database.service';
import { PERMISSIONS } from '../../../src/common/constants';
import { dateFormatter } from '../../../src/common/formaters';

describe('Users controller', () => {
  const userAccount = 'generated_identity_id';
  const centrifugeClientMock = ({
    accounts: {
      generateAccount: jest.fn(() => ({
        identity_id: userAccount,
      })),
    },
  } as any) as CentrifugeService;
  // TODO Mocking/Reimplementing all nedb moethods is error prone
  // Considering that nedb is local we can run it in the test with a different config
  // for storage and we will not need a DatabaseServiceMock
  // https://app.zenhub.com/workspaces/centrifuge-5ba350114b5806bc2be90978/issues/centrifuge/centrifuge-starter-kit/98
  let registeredUser: User;
  let userModule: TestingModule;
  let insertedUsers = {};

  class DatabaseServiceMock {
    users = {
      findOne: (user): User | undefined => {
        for (let key in insertedUsers) {
          if (insertedUsers[key].email === user.email) {
            return insertedUsers[key];
          }
        }
        return null;
      },
      updateById: (userId, user, upsert) => {
        insertedUsers[user._id] = user;
        return user;
      },
      insert: data => {
        return { ...data, _id: 'new_user_id' };
      },
    };
  }

  const databaseServiceMock = new DatabaseServiceMock();

  beforeAll(async () => {
    userModule = await Test.createTestingModule({
      controllers: [UsersController],
      providers: [
        SessionGuard,
        CentrifugeService,
        databaseServiceProvider,
      ],
    })
      .overrideProvider(DatabaseService)
      .useValue(databaseServiceMock)
      .overrideProvider(CentrifugeService)
      .useValue(centrifugeClientMock)
      .compile();

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
      registeredUser = {
        _id: 'user',
        name: 'username',
        email: 'test',
        date_added: dateFormatter(new Date()),
        account: '0x333',
        password: 'password',
        enabled: true,
        invited: false,
        permissions: [],
      };
      insertedUsers = {};
      insertedUsers[registeredUser._id] = registeredUser;
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
        await expect(usersController.invite(registeredUser)).rejects.toThrow(
          'User already invited!',
        );
      });
      it('should add user to the database with invite true and enabled false', async () => {

        const user: User = {
          ...new User(),
          _id: 'random' + Math.random(),
          name: 'new_user',
          password: 'password',
          email: 'test1',
          date_added: dateFormatter(new Date()),
        };

        const invite = await usersController.invite(user);
        expect(insertedUsers[user._id]).toEqual({
          ...user,
          password: undefined,
          invited: true,
          enabled: false,
          account: userAccount,
        });
      });


    });

    describe('register', () => {
      it('should throw if the username is taken and there is an enabled user', async () => {
        registeredUser.invited = true;
        registeredUser.enabled = true;
        await expect(usersController.register(registeredUser)).rejects.toThrow(
          'Email taken!',
        );
      });

      it('should throw if the user has not been invited', async () => {
        const notInvitedUser: User = {
          _id: 'some_user_id',
          name: 'new_user',
          email: 'test',
          account: '0x55',
          password: 'password',
          date_added: dateFormatter(new Date()),
          invited: false,
          enabled: true,
          permissions: [],
        };

        await expect(usersController.register(notInvitedUser)).rejects.toThrow(
          'Email taken!',
        );
      });

      it('should create the user if the email is not taken and the user has been invited', async () => {
        registeredUser.invited = true;
        registeredUser.enabled = false;
        const result = await usersController.register(registeredUser);

        expect(result).toEqual('user');
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
        registeredUser = {
          _id: 'user',
          name: 'username',
          password: 'password',
          account: '0x44',
          email: 'test',
          date_added: dateFormatter(new Date()),
          enabled: true,
          invited: false,
          permissions: [],
        };
        insertedUsers = {};
        insertedUsers[registeredUser._id] = registeredUser;

      });

      it('should return error if the email is taken', async () => {
        await expect(usersController.register(registeredUser)).rejects.toThrow(
          'Email taken!',
        );
      });

      it('should create the user if the username is not taken', async () => {
        const newUser = {
          _id: 'some_user_id',
          name: 'new_user',
          email: 'new_email',
          password: 'password',
          enabled: false,
          invited: false,
          permissions: [],
        };

        const result = await usersController.register(newUser);
        expect(result).toEqual('some_user_id');
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
          }),
        ).rejects.toThrow(
          'Password is mandatory',
        );

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
          }),
        ).rejects.toThrow(
          'Password is mandatory',
        );


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
          }),
        ).rejects.toThrow(
          'Password is mandatory',
        );

      });

    });

    describe('invite', () => {
      const usersController = new UsersController(
        ({} as any) as DatabaseService,
        centrifugeClientMock,
      );

      it('should throw error', async () => {
        await expect(
          usersController.invite({
            name: 'any_username',
            email: 'test',
            permissions: [PERMISSIONS.CAN_CREATE_INVOICES],
          }),
        ).rejects.toThrow('Invite functionality not enabled!');
      });
    });
  });
});
