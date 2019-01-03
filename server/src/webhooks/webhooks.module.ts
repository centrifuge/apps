import { Module } from '@nestjs/common';

import { WebhooksController } from './webhooks.controller';
import { databaseConnectionFactory } from '../database/database.providers';
import { DatabaseModule } from '../database/database.module';
import { CentrifugeModule } from '../centrifuge-client/centrifuge.module';

@Module({
  controllers: [WebhooksController],
  providers: [databaseConnectionFactory],
  imports: [DatabaseModule, CentrifugeModule],
})
export class WebhooksModule {}
