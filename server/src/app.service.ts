import { Injectable } from '@nestjs/common';
import { User } from '../../src/common/models/user';

@Injectable()
export class AppService {
  preloadReduxStore(user: User): string {
    // TODO this can be extended and we can also inject the default homePage for a specific user
    return JSON.stringify({
      user: {
        auth: {
          loggedInUser: user || null,
        },
      },
    });
  }
}
