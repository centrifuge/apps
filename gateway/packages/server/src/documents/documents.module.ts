import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { CentrifugeModule } from '../centrifuge-client/centrifuge.module';
import { DatabaseModule } from '../database/database.module';
import { DocumentsController } from './documents.controller';

@Module({
  controllers: [DocumentsController],
  providers: [],
  imports: [DatabaseModule, AuthModule, CentrifugeModule],
})
export class DocumentsModule {}
