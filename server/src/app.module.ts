import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { InvoicesModule } from './invoices/invoices.module';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { ContactsModule } from './contacts/contacts.module';

@Module({
  imports: [AppController, InvoicesModule, UsersModule, AuthModule, ContactsModule],
})
export class AppModule {}
