import { Module, NestModule } from '@nestjs/common';
import { AppController } from './app.controller';
import { InvoicesModule } from './invoices/invoices.module';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';

@Module({
  imports: [AppController, InvoicesModule, UsersModule, AuthModule],
})
export class AppModule {}
