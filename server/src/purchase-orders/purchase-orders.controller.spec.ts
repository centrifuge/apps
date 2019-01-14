import { Test, TestingModule } from '@nestjs/testing';
import { PurchaseOrdersController } from './purchase-orders.controller';
import { SessionGuard } from '../auth/SessionGuard';
import { centrifugeClientFactory } from '../centrifuge-client/centrifuge.client';
import { tokens as clientTokens } from '../centrifuge-client/centrifuge.constants';
import { tokens as databaseTokens } from '../database/database.constants';
import { databaseConnectionFactory } from '../database/database.providers';
import { PurchaseOrder } from '../../../src/common/models/dto/purchase-order';

describe('PurchaseOrdersController', () => {
  let purchaseOrdersModule: TestingModule;

  const purchaseOrderToCreate: PurchaseOrder = {
    po_number: '999',
    order_name: 'cinderella',
    recipient_name: 'step mother',
  };

  const fetchedPurchaseOrders: PurchaseOrder[] = [
    {
      order_name: 'alberta',
      order: '0xc111111111a4e539741ca11b590b9447b26a8057',
    },
  ];

  class DatabaseServiceMock {
    purchaseOrders = {
      create: jest.fn(val => val),
      find: jest.fn(() => fetchedPurchaseOrders),
    };
  }

  const databaseServiceMock = new DatabaseServiceMock();

  class CentrifugeClientMock {
    create_1 = jest.fn(data => data);
  }

  const centrifugeClientMock = new CentrifugeClientMock();

  beforeEach(async () => {
    purchaseOrdersModule = await Test.createTestingModule({
      controllers: [PurchaseOrdersController],
      providers: [
        SessionGuard,
        centrifugeClientFactory,
        databaseConnectionFactory,
      ],
    })
      .overrideProvider(databaseTokens.databaseConnectionFactory)
      .useValue(databaseServiceMock)
      .overrideProvider(clientTokens.centrifugeClientFactory)
      .useValue(centrifugeClientMock)
      .compile();

    databaseServiceMock.purchaseOrders.create.mockClear();
    databaseServiceMock.purchaseOrders.find.mockClear();
    centrifugeClientMock.create_1.mockClear();
  });

  describe('create', () => {
    it('should return the created purchase order', async () => {
      const purchaseOrdersController = purchaseOrdersModule.get<
        PurchaseOrdersController
      >(PurchaseOrdersController);

      const result = await purchaseOrdersController.create(
        purchaseOrderToCreate,
      );

      expect(result).toEqual({
        collaborators: undefined,
        data: purchaseOrderToCreate,
      });

      expect(databaseServiceMock.purchaseOrders.create).toHaveBeenCalledTimes(
        1,
      );
    });
  });

  describe('get', () => {
    it('should return a list of contacts', async () => {
      const purchaseOrdersController = purchaseOrdersModule.get<
        PurchaseOrdersController
      >(PurchaseOrdersController);

      const result = await purchaseOrdersController.get({
        user: { id: 'some_user_id' },
      });
      expect(result).toBe(fetchedPurchaseOrders);
      expect(databaseServiceMock.purchaseOrders.find).toHaveBeenCalledTimes(1);
    });
  });
});
