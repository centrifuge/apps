import {
  Body,
  Controller,
  Get, HttpException, HttpStatus,
  Inject,
  Param,
  Post,
  Put,
  Req,
  UseGuards,
} from '@nestjs/common';
import { Invoice } from '../../../src/common/models/invoice';
import { ROUTES } from '../../../src/common/constants';
import { SessionGuard } from '../auth/SessionGuard';
import {
  InvInvoiceData,
  InvInvoiceResponse,
} from '../../../clients/centrifuge-node';
import { DatabaseService } from '../database/database.service';
import { InvoiceData } from '../../../src/common/interfaces';
import config from '../config';
import { CentrifugeService } from '../centrifuge-client/centrifuge.service';

@Controller(ROUTES.INVOICES)
@UseGuards(SessionGuard)
export class InvoicesController {
  constructor(
    private readonly database: DatabaseService,
    private readonly centrifugeService: CentrifugeService,
  ) {}

  @Post()
  /**
   * Create an invoice and save in the centrifuge node and the local database
   * @async
   * @param request - the http request
   * @param {Invoice} invoice - the body of the request
   * @return {Promise<InvInvoiceResponse>} result
   */
  async create(@Req() request, @Body() invoice: Invoice) {
    const collaborators =  [invoice!.sender, invoice!.recipient].filter(item => item );
    try {
      const createResult = await this.centrifugeService.invoices.create(
        {
          data: {
            ...invoice,
          },
          write_access: {
            collaborators,
          },
        },
        config.admin.account,
      );
      return await this.database.invoices.insert({
        ...createResult,
        ownerId: request.user._id,
      });
    } catch (error) {
      throw new HttpException( await error.json(), error.status);
    }
  }

  @Get()
  /**
   * Get the list of all invoices
   * @async
   * @return {Promise<Invoice[]>} result
   */
  async get(@Req() request): Promise<InvoiceData[]> {
    const invoices = (await this.database.invoices.find({
      ownerId: request.user._id,
    })) as (InvInvoiceData & { _id: string })[];

    return await Promise.all(
      invoices.map(async invoice => {
        const supplier = await this.database.contacts.findOne({
          _id: invoice.sender_company_name,
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
  /**
   * Get a specific invoice by id
   * @async
   * @param params - the request parameters
   * @param request - the http request
   * @return {Promise<Invoice|null>} result
   */
  async getById(@Param() params, @Req() request): Promise<Invoice | null> {
    return this.database.invoices.findOne({
      _id: params.id,
      ownerId: request.user._id,
    });
  }

  /**
   * Updates an invoice and saves in the centrifuge node and local database
   * @async
   * @param {Param} params - the query params
   * @param {Param} request - the http request
   * @param {PurchaseOrder} updateInvoiceRequest - the updated invoice
   * @return {Promise<PurchaseOrder>} result
   */
  @Put(':id')
  async updateById(
    @Param() params,
    @Req() request,
    @Body() updateInvoiceRequest: Invoice,
  ) {
    const invoice: InvInvoiceResponse = await this.database.invoices.findOne(
      { _id:  params.id, ownerId: request.user._id },
    );

    const updateResult = await this.centrifugeService.invoices.update(
      invoice.header.document_id,
      {
        data: { ...updateInvoiceRequest },
        write_access: {
          collaborators: updateInvoiceRequest.collaborators,
        },
      },
      config.admin.account,
    );

    return await this.database.invoices.updateById( params.id, {
      ...updateResult,
      ownerId: request.user._id,
    });
  }
}
