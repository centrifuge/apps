import { Module } from '@nestjs/common';
import { databaseServiceProvider } from './database.providers';

@Module({
  providers: [databaseServiceProvider],
  exports: [databaseServiceProvider],
})
export class DatabaseModule {}
