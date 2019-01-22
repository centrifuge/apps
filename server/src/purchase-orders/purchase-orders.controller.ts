import {
  Body,
  Controller,
  Get,
  Inject,
  Param,
  Post,
  Put,
  Req,
  UseGuards,
} from '@nestjs/common';
import { SessionGuard } from '../auth/SessionGuard';
import { ROUTES } from '../../../src/common/constants';
import { DatabaseProvider } from '../database/database.providers';
import { tokens as databaseTokens } from '../database/database.constants';
import { PurchaseOrder } from '../../../src/common/models/dto/purchase-order';
import { tokens as clientTokens } from '../centrifuge-client/centrifuge.constants';
import {
  DocumentServiceApi,
  PurchaseorderPurchaseOrderResponse,
} from '../../../clients/centrifuge-node/generated-client';

@Controller(ROUTES.PURCHASE_ORDERS)
@UseGuards(SessionGuard)
export class PurchaseOrdersController {
  constructor(
    @Inject(databaseTokens.databaseConnectionFactory)
    private readonly database: DatabaseProvider,
    @Inject(clientTokens.centrifugeClientFactory)
    readonly centrifugeClient: DocumentServiceApi,
  ) {}

  @Post()
  /**
   * Create a purchase order and save in the centrifuge node and local database
   * @async
   * @param {Request} request - the http request
   * @param {PurchaseOrder} purchaseOrder - the body of the request
   * @return {Promise<PurchaseOrder>} result
   */
  async create(@Body() purchaseOrder: PurchaseOrder) {
    const createResult = await this.centrifugeClient.create_1({
      data: {
        ...purchaseOrder,
      },
      collaborators: purchaseOrder.collaborators,
    });

    return await this.database.purchaseOrders.create(createResult);
  }

  /**
   * Updates a purchase order and saves in the centrifuge node and local database
   * @async
   * @param {Param} params - the query params
   * @param {PurchaseOrder} purchaseOrder - the updated purchase order
   * @return {Promise<PurchaseOrder>} result
   */
  @Put(':id')
  async update(@Param() params, @Body() purchaseOrder: PurchaseOrder) {
    const id = params.id;
    const dbPurchaseOrder: PurchaseorderPurchaseOrderResponse = await this.database.purchaseOrders.findOne(
      { _id: id },
    );
    const updateResult = await this.centrifugeClient.update_4(
      dbPurchaseOrder.header.document_id,
      {
        data: {
          ...purchaseOrder,
        },
        collaborators: purchaseOrder.collaborators,
      },
    );

    return await this.database.purchaseOrders.updateById(id, updateResult);
  }

  @Get()
  /**
   * Get the list of all purchase orders
   * @async
   * @param {Promise<PurchaseOrder[]>} result
   */
  async get(@Req() request) {
    return await this.database.purchaseOrders.find({});
  }

  @Get(':id')
  /**
   * Get a specific purchase order by id
   * @async
   * @param {Promise<PurchaseOrder|null>} result
   */
  async getById(@Param() params) {
    return await this.database.purchaseOrders.findOne({ _id: params.id });
  }
}
