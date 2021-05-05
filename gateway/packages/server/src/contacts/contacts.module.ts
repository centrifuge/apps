import { Module } from '@nestjs/common';
import { ContactsController } from './contacts.controller';
import { DatabaseModule } from '../database/database.module';

@Module({
  controllers: [ContactsController],
  imports: [DatabaseModule],

})
export class ContactsModule {}
