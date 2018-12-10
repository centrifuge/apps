import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { UsersController } from './users.controller';
import { databaseConnectionFactory } from '../database/database.providers';
import { DatabaseModule } from '../database/database.module';
import * as passport from 'passport';
import { ROUTES } from '../../../src/common/constants';

@Module({
  controllers: [UsersController],
  providers: [databaseConnectionFactory],
  imports: [DatabaseModule],
})
export class UsersModule implements NestModule {
  configure(consumer: MiddlewareConsumer): MiddlewareConsumer | void {
    consumer
      .apply(passport.authenticate('local'))
      .forRoutes(`${ROUTES.USERS.login}`);
  }
}
