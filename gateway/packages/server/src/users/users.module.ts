import { ROUTES } from '@centrifuge/gateway-lib/src/utils/constants'
import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common'
import * as passport from 'passport'
import { AuthModule } from '../auth/auth.module'
import { CentrifugeModule } from '../centrifuge-client/centrifuge.module'
import { DatabaseModule } from '../database/database.module'
import { UsersController } from './users.controller'
@Module({
  controllers: [UsersController],
  providers: [],
  imports: [DatabaseModule, AuthModule, CentrifugeModule],
})
export class UsersModule implements NestModule {
  configure(consumer: MiddlewareConsumer): MiddlewareConsumer | void {
    consumer.apply(passport.authenticate('local', { session: false })).forRoutes(`${ROUTES.USERS.loginTentative}`)

    consumer
      .apply(passport.authenticate(process.env.NODE_ENV === 'development' ? 'local' : '2fa', { session: false }))
      .forRoutes(`${ROUTES.USERS.login}`)
  }
}
