import { Body, Controller, Get, Inject, Post, UseGuards } from '@nestjs/common';
import { Invoice } from '../../../src/common/models/dto/invoice';
import { InvoicesService } from './invoices.service';
import { ROUTES } from '../../../src/common/constants';
import { SessionGuard } from '../auth/SessionGuard';
import { tokens } from '../centrifuge-client/centrifuge.constants';
import { DocumentServiceApi } from '../../../clients/centrifuge-node/generated-client';

@Controller(ROUTES.INVOICES)
@UseGuards(SessionGuard)
export class InvoicesController {
  constructor(
    private readonly invoicesService: InvoicesService,
    @Inject(tokens.centrifugeClientFactory)
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

    return await this.invoicesService.create(createResult.data);
  }

  @Get()
  async get() {
    return this.invoicesService.get();
  }
}
