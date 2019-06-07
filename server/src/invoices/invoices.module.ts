import { Module } from '@nestjs/common';

import { InvoicesController } from './invoices.controller';
import { DatabaseModule } from '../database/database.module';
import { AuthModule } from '../auth/auth.module';
import { CentrifugeModule } from '../centrifuge-client/centrifuge.module';

@Module({
  controllers: [InvoicesController],
  imports: [DatabaseModule, AuthModule, CentrifugeModule],
})
export class InvoicesModule {}
