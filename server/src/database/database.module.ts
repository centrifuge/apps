import { Module } from '@nestjs/common';
import { databaseConnectionFactory } from './database.providers';

@Module({
  providers: [databaseConnectionFactory],
  exports: [databaseConnectionFactory],
})
export class DatabaseModule {}