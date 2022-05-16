import { MailerModule } from '@nestjs-modules/mailer'
import { HandlebarsAdapter } from '@nestjs-modules/mailer/dist/adapters/handlebars.adapter'
import { Module } from '@nestjs/common'
import { APP_FILTER } from '@nestjs/core'
import { AppController } from './app.controller'
import { AppService } from './app.service'
import { AuthModule } from './auth/auth.module'
import config from './config'
import { ContactsModule } from './contacts/contacts.module'
import { DocumentsModule } from './documents/documents.module'
import { AllExceptionFilter } from './exceptions/all-exception.filter'
import { NftsModule } from './nfts/nfts.module'
import { OrganizationsModule } from './organizations/organizations.module'
import { SchemasModule } from './schemas/schemas.module'
import { UsersModule } from './users/users.module'
import { WebhooksModule } from './webhooks/webhooks.module'

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
    UsersModule,
    WebhooksModule,
    SchemasModule,
    DocumentsModule,
    NftsModule,
    OrganizationsModule,
    MailerModule.forRoot({
      transport: {
        host: config.email.host,
        port: config.email.port,
        secure: config.email.secure,
        auth: {
          user: config.email.user,
          pass: config.email.password,
        },
      },
      defaults: {
        from: config.email.from,
      },
      template: {
        dir: process.cwd() + '/email-templates/',
        adapter: new HandlebarsAdapter(), // or new PugAdapter()
        options: {
          strict: true,
        },
      },
    }),
  ],
})
export class AppModule {}
