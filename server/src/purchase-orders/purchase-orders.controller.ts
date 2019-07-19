import { Body, Controller, Get, Param, Post, Put, Req, UseGuards } from '@nestjs/common';
import { SessionGuard } from '../auth/SessionGuard';
import { ROUTES } from '../../../src/common/constants';
import { DatabaseService } from '../database/database.service';
import { PurchaseOrder } from '../../../src/common/models/purchase-order';
import { UserapiPurchaseOrderResponse } from '../../../clients/centrifuge-node';
import { CentrifugeService } from '../centrifuge-client/centrifuge.service';
import config from '../../../src/common/config';

@Controller(ROUTES.PURCHASE_ORDERS)
@UseGuards(SessionGuard)
export class PurchaseOrdersController {
  constructor(
    private readonly databaseService: DatabaseService,
    readonly centrifugeService: CentrifugeService,
  ) {
  }

  @Post()
  /**
   * Create a purchase order and save in the centrifuge node and local database
   * @async
   * @param {Request} request - the http request
   * @param {PurchaseOrder} purchaseOrder - the body of the request
   * @return {Promise<PurchaseOrder>} result
   */
  async create(@Req() request, @Body() purchaseOrder: PurchaseOrder) {

    const collaborators = purchaseOrder.collaborators
      ? [...purchaseOrder.collaborators]
      : [];
    const createResult: UserapiPurchaseOrderResponse = await this.centrifugeService.purchaseOrders.createPurchaseOrder(
      config.admin.account,
      {
        data: {
          ...purchaseOrder,
        },
        write_access: collaborators,

      },
    );

    return await this.databaseService.purchaseOrders.insert({
      ...createResult,
      ownerId: request.user._id,
    });

  }

  /**
   * Updates a purchase order and saves in the centrifuge node and local database
   * @async
   * @param {Param} params - the query params
   * @param {Param} request - the http request
   * @param {PurchaseOrder} purchaseOrder - the updated purchase order
   * @return {Promise<PurchaseOrder>} result
   */
  @Put(':id')
  async update(
    @Param() params,
    @Req() request,
    @Body() purchaseOrder: PurchaseOrder,
  ) {

    const id = params.id;
    const dbPurchaseOrder: UserapiPurchaseOrderResponse = await this.databaseService.purchaseOrders.findOne(
      { _id: id, ownerId: request.user._id },
    );
    const updateResult = await this.centrifugeService.purchaseOrders.updatePurchaseOrder(
      config.admin.account,
      dbPurchaseOrder.header.document_id,
      {
        data: {
          ...purchaseOrder,
        },
        write_access: purchaseOrder.collaborators,
      },
    );

    return await this.databaseService.purchaseOrders.updateById(id, {
      ...updateResult,
      ownerId: request.user._id,
    });

  }

  @Get()
  /**
   * Get the list of all purchase orders
   * @async
   * @return {Promise<PurchaseOrder[]>} result
   */
  async get(@Req() request) {
    return await this.databaseService.purchaseOrders.find({
      ownerId: request.user._id,
    });
  }

  @Get(':id')
  /**
   * Get a specific purchase order by id
   * @param params - the request parameters
   * @param request - the http request
   * @async
   * @return {Promise<PurchaseOrder|null>} result
   */
  async getById(@Param() params, @Req() request) {
    return await this.databaseService.purchaseOrders.findOne({
      _id: params.id,
      ownerId: request.user._id,
    });
  }
}
