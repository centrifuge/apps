import { Module } from '@nestjs/common';
import { PurchaseOrdersController } from './purchase-orders.controller';
import { DatabaseModule } from '../database/database.module';
import { CentrifugeModule } from '../centrifuge-client/centrifuge.module';

@Module({
  controllers: [PurchaseOrdersController],
  imports: [DatabaseModule, CentrifugeModule],
})
export class PurchaseOrdersModule {}
