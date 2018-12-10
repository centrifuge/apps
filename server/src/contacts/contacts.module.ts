import { Module } from '@nestjs/common';
import { ContactsController } from './contacts.controller';
import { databaseConnectionFactory } from '../database/database.providers';

@Module({
  controllers: [ContactsController],
  providers: [databaseConnectionFactory],
})
export class ContactsModule {}
