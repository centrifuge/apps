import { Module } from '@nestjs/common';
import { DatabaseModule } from '../database/database.module';
import { SchemasController } from './schemas.controllers';

@Module({
  controllers: [SchemasController],
  imports: [DatabaseModule],

})
export class SchemasModule {}
