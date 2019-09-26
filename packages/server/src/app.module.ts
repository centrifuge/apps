import { Module } from '@nestjs/common';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { ContactsModule } from './contacts/contacts.module';
import { WebhooksModule } from './webhooks/webhooks.module';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { APP_FILTER } from '@nestjs/core';
import { FundingModule } from './funding/funding.module';
import { AllExceptionFilter } from './exceptions/all-exception.filter';
import { SchemasModule } from './schemas/schemas.module';
import { DocumentsModule } from './documents/documents.module';

@Module({
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_FILTER,
      useClass: AllExceptionFilter,
    },
  ],
  imports: [
    AuthModule,
    ContactsModule,
    FundingModule,
    UsersModule,
    WebhooksModule,
    SchemasModule,
    DocumentsModule,
  ],
})
export class AppModule {
}
