import {
  Body,
  Controller,
  Get,
  Inject,
  Param,
  Post,
  Put,
  UseGuards,
} from '@nestjs/common';
import { Invoice } from '../../../src/common/models/dto/invoice';
import { ROUTES } from '../../../src/common/constants';
import { SessionGuard } from '../auth/SessionGuard';
import { tokens as clientTokens } from '../centrifuge-client/centrifuge.constants';
import { tokens as databaseTokens } from '../database/database.constants';
import {
  DocumentServiceApi,
  InvoiceInvoiceData,
  InvoiceInvoiceResponse,
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
   * @return {Promise<InvoiceInvoiceResponse>} result
   */
  async create(@Body() invoice: Invoice) {
    const createResult = await this.centrifugeClient.create({
      data: {
        ...invoice,
      },
      collaborators: invoice.collaborators,
    });
    return await this.database.invoices.create(createResult);
  }

  @Get()
  /**
   * Get the list of all invoices
   * @async
   * @param {Promise<Invoice[]>} result
   */
  async get(): Promise<(Invoice & { supplier?: string })[]> {
    const invoices = (await this.database.invoices.find({})) as (Invoice)[];

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

  @Get(':id')
  async getById(@Param() params): Promise<Invoice | null> {
    return this.database.invoices.findOne({ _id: params.id });
  }

  @Put(':id')
  async updateById(@Param() params, @Body() updateInvoiceRequest: Invoice) {
    let id = params.id;
    const invoice: InvoiceInvoiceResponse = await this.database.invoices.findOne(
      { _id: id },
    );

    const updateResult = await this.centrifugeClient.update(
      invoice.header.document_id,
      updateInvoiceRequest,
    );

    return await this.database.invoices.updateById(id, updateResult);
  }
}
