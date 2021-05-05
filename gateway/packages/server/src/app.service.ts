import { Injectable } from '@nestjs/common';
import { PublicUser } from '@centrifuge/gateway-lib/models/user';

@Injectable()
export class AppService {
  preloadReduxStore(user: PublicUser): string {
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
