import { Module } from '@nestjs/common';
import { InvoicesModule } from './invoices/invoices.module';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { ContactsModule } from './contacts/contacts.module';
import { WebhooksModule } from './webhooks/webhooks.module';
import { PurchaseOrdersModule } from './purchase-orders/purchase-orders.module';

@Module({
  imports: [
    InvoicesModule,
    UsersModule,
    AuthModule,
    ContactsModule,
    PurchaseOrdersModule,
    WebhooksModule,
  ],
})
export class AppModule {}
