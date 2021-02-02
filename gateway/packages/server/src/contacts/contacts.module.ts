import { Module } from '@nestjs/common';
import { DatabaseModule } from '../database/database.module';
import { ContactsController } from './contacts.controller';

@Module({
  controllers: [ContactsController],
  imports: [DatabaseModule],
})
export class ContactsModule {}
