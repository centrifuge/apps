import { Test, TestingModule } from '@nestjs/testing';
import { PurchaseOrdersController } from './purchase-orders.controller';
import { SessionGuard } from '../auth/SessionGuard';
import { databaseServiceProvider } from '../database/database.providers';
import { PurchaseOrder } from '../../../src/common/models/purchase-order';
import config from '../../../src/common/config';
import { DatabaseService } from '../database/database.service';
import { centrifugeServiceProvider } from "../centrifuge-client/centrifuge.module";
import { CentrifugeService } from "../centrifuge-client/centrifuge.service";

describe('PurchaseOrdersController', () => {
  let centrifugeId;
  let poSpies: any = {};
  let databaseSpies: any = {};
  let insertedPO: any = {};

  beforeAll(() => {
    centrifugeId = config.admin.account;
    config.admin.account = 'centrifuge_id';
  });

  afterAll(() => {
    config.admin.account = centrifugeId;
  });

  let purchaseOrdersModule: TestingModule;

  const purchaseOrder: PurchaseOrder = {
    number: '999',
    requester_name: 'cinderella',
    ship_to_company_name: 'step mother',
  };

  beforeEach(async () => {
    purchaseOrdersModule = await Test.createTestingModule({
      controllers: [PurchaseOrdersController],
      providers: [
        SessionGuard,
        centrifugeServiceProvider,
        databaseServiceProvider,
      ],
    })
        .compile();

    const databaseService = purchaseOrdersModule.get<DatabaseService>(DatabaseService);
    insertedPO = await databaseService.purchaseOrders.insert({
      header: {
        document_id: '0x39393939',
      },
      data: {...purchaseOrder},
      ownerId: 'user_id',
    });

    const centrifugeService = purchaseOrdersModule.get<CentrifugeService>(CentrifugeService);
    poSpies.spyUpdate = jest.spyOn(centrifugeService.purchaseOrders, 'updatePurchaseOrder');

    databaseSpies.spyInsert = jest.spyOn(databaseService.purchaseOrders, 'insert');
    databaseSpies.spyUpdate = jest.spyOn(databaseService.purchaseOrders, 'update');
    databaseSpies.spyFind = jest.spyOn(databaseService.purchaseOrders, 'find');
    databaseSpies.spyFindOne = jest.spyOn(databaseService.purchaseOrders, 'findOne');
    databaseSpies.spyUpdateById = jest.spyOn(databaseService.purchaseOrders, 'updateById');
  });

  describe('create', () => {
    it('should return the created purchase order', async () => {
      const purchaseOrdersController = purchaseOrdersModule.get<PurchaseOrdersController>(PurchaseOrdersController);
      const result = await purchaseOrdersController.create(
        { user: { _id: 'user_id' } },
        purchaseOrder,
      );

      expect(result).toMatchObject({
        data: {
          ...purchaseOrder,
        },
        write_access: [],
        ownerId: 'user_id',
      });

      expect(databaseSpies.spyInsert).toHaveBeenCalledTimes(
        1,
      );
    });
  });

  describe('get', () => {
    it('should return a list of purchase orders', async () => {
      const purchaseOrdersController = purchaseOrdersModule.get<PurchaseOrdersController>(PurchaseOrdersController);

      const result = await purchaseOrdersController.get({
        user: { _id: 'user_id' },
      });
      expect(databaseSpies.spyFind).toHaveBeenCalledTimes(1);
      expect(result[0].data).toEqual(purchaseOrder)
    });
  });

  describe('update', function() {
    it('should update the specified purchase order', async function() {
      const purchaseOrdersController = purchaseOrdersModule.get<PurchaseOrdersController>(PurchaseOrdersController);

      const updatedOrder = { ...purchaseOrder, number: 'updated_number' };

      const updateResult = await purchaseOrdersController.update(
        { id: insertedPO._id },
        { user: { _id: 'user_id' } },
        { ...updatedOrder },
      );

      expect(databaseSpies.spyFindOne).toHaveBeenCalledWith({
        _id: insertedPO._id,
        ownerId: 'user_id',
      });
      expect(poSpies.spyUpdate).toHaveBeenCalledWith(
        config.admin.account,
        '0x39393939',
        {
          data: {
            ...updatedOrder,
          },
        },
      );
      expect(updateResult).toMatchObject({
        data: {
          ...updatedOrder,
        },
      });
    });
  });

  describe('get by id', function() {
    it('should return the purchase order by id', async function() {
      const purchaseOrdersController = purchaseOrdersModule.get<PurchaseOrdersController>(PurchaseOrdersController);

      const result = await purchaseOrdersController.getById(
        { id: insertedPO._id },
        { user: { _id: 'user_id' } },
      );
      expect(databaseSpies.spyFindOne).toHaveBeenCalledWith({
        _id: insertedPO._id,
        ownerId: 'user_id',
      });
      expect(result).toMatchObject({
        data: purchaseOrder,
        header: {
          document_id: '0x39393939',
        },
      });
    });
  });
});
