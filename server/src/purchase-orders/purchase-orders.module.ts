import { Module } from '@nestjs/common';
import { PurchaseOrdersController } from './purchase-orders.controller';
import { databaseConnectionFactory } from '../database/database.providers';
import { centrifugeClientFactory } from '../centrifuge-client/centrifuge.client';

@Module({
  controllers: [PurchaseOrdersController],
  providers: [databaseConnectionFactory, centrifugeClientFactory],
})
export class PurchaseOrdersModule {}
