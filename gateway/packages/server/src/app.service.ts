import { PublicUser } from '@centrifuge/gateway-lib/models/user'
import { Injectable } from '@nestjs/common'

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
    })
  }
}
