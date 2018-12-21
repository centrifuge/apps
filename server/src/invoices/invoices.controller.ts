import { Body, Controller, Get, Inject, Post, UseGuards } from '@nestjs/common';
import { Invoice } from '../../../src/common/models/dto/invoice';
import { ROUTES } from '../../../src/common/constants';
import { SessionGuard } from '../auth/SessionGuard';
import { tokens as clientTokens } from '../centrifuge-client/centrifuge.constants';
import { tokens as databaseTokens } from '../database/database.constants';
import {
  DocumentServiceApi,
  InvoiceInvoiceData,
} from '../../../clients/centrifuge-node/generated-client';
import { DatabaseProvider } from '../database/database.providers';
import { InvoiceData } from '../../../src/interfaces';

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
  /**
   * Create an invoice and save in the centrifuge node and the local database
   * @async
   * @param {Invoice} invoice - the body of the request
   * @return {Promise<Invoice>} result
   */
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
  /**
   * Get the list of all invoices
   * @async
   * @param {Promise<Invoice[]>} result
   */
  async get(): Promise<InvoiceData[]> {
    const invoices = (await this.database.invoices.find(
      {},
    )) as (InvoiceInvoiceData & { _id: string })[];

    return await Promise.all(
      invoices.map(async invoice => {
        const supplier = await this.database.contacts.findOne({
          _id: invoice.sender_name,
        });

        if (supplier) {
          return Object.assign({}, invoice, {
            supplier,
          });
        }

        return invoice;
      }),
    );
  }
}
