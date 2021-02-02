import { Module } from '@nestjs/common';

import { WebhooksController } from './webhooks.controller';
import { DatabaseModule } from '../database/database.module';
import { CentrifugeModule } from '../centrifuge-client/centrifuge.module';

@Module({
  controllers: [WebhooksController],
  imports: [DatabaseModule, CentrifugeModule],
})
export class WebhooksModule {}
