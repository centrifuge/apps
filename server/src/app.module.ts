import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { InvoicesModule } from './invoices/invoices.module';

@Module({
  imports: [AppController, InvoicesModule],
})
export class AppModule {}
