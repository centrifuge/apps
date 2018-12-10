import { Body, Controller, Get, Inject, Post, UseGuards } from '@nestjs/common';
import { Invoice } from '../../../src/common/models/dto/invoice';
import { ROUTES } from '../../../src/common/constants';
import { SessionGuard } from '../auth/SessionGuard';
import { tokens as clientTokens } from '../centrifuge-client/centrifuge.constants';
import { tokens as databaseTokens } from '../database/database.constants';
import { DocumentServiceApi } from '../../../clients/centrifuge-node/generated-client';
import { DatabaseProvider } from '../database/database.providers';

@Controller(ROUTES.INVOICES)
@UseGuards(SessionGuard)
export class InvoicesController {
  constructor(
    @Inject(databaseTokens.databaseConnectionFactory)
    private readonly database: DatabaseProvider,
    @Inject(clientTokens.centrifugeClientFactory)
    private readonly centrifugeClient: DocumentServiceApi,
  ) {}

  @Post()
  async create(@Body() invoice: Invoice) {
    const createResult = await this.centrifugeClient.create({
      data: {
        invoice_number: invoice.number.toString(),
        sender_name: invoice.supplier,
        recipient_name: invoice.customer,
        invoice_status: invoice.status,
        currency: 'USD', // TODO: add enum for different currencies
      },
    });

    return await this.database.invoices.create(createResult.data);
  }

  @Get()
  async get() {
    return this.database.invoices.find({});
  }
}
