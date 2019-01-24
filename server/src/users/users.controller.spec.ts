import { UsersController } from './users.controller';
import { DatabaseProvider } from '../database/database.providers';
import { User } from '../../../src/common/models/dto/user';

describe('Users controller', function() {
  describe('logout', function() {
    it('should call request logout', async function() {
      const usersController = new UsersController({} as DatabaseProvider);
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

  describe('register', function() {
    const registeredUser = {
      _id: 'user',
      username: 'username',
      password: 'password',
    };

    const dbMock = ({
      users: {
        findOne: (user): User | undefined =>
          user.username === registeredUser.username
            ? registeredUser
            : undefined,
        create: data => ({ ...data, _id: 'new_user_id' }),
      },
    } as any) as DatabaseProvider;

    const usersController = new UsersController(dbMock);

    beforeEach(() => {
      jest.resetAllMocks();
    });

    it('should return error if the username is taken', async function() {
      await expect(usersController.register(registeredUser)).rejects.toThrow(
        'Username taken!',
      );
    });

    it('should create the user if the username is not taken', async function() {
      const newUser = {
        _id: 'some_user_id',
        username: 'new_user',
        password: 'password',
      };
      const result = await usersController.register(newUser);

      expect(result).toEqual({ id: 'new_user_id' });
    });
  });
});
