import { Module } from '@nestjs/common';
import { CentrifugeModule } from '../centrifuge-client/centrifuge.module';
import { DatabaseModule } from '../database/database.module';
import { WebhooksController } from './webhooks.controller';

@Module({
  controllers: [WebhooksController],
  imports: [DatabaseModule, CentrifugeModule],
})
export class WebhooksModule {}
