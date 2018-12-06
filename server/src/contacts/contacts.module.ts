import { Module } from '@nestjs/common';
import { ContactsController } from './contacts.controller';
import { ContactsService } from './contacts.service';
import { databaseConnectionFactory } from '../database/database.providers';
import { contactsProviderFactory } from './contacts.providers';
import { contactsRepository } from './contacts.repository';

@Module({
  controllers: [ContactsController],
  providers: [
    ContactsService,
    databaseConnectionFactory,
    contactsProviderFactory,
    contactsRepository,
  ],
})
export class ContactsModule {}
