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

  const purchaseOrder: PurchaseOrder = {
    po_number: '999',
    order_name: 'cinderella',
    recipient_name: 'step mother',
    collaborators: ['new_collaborator'],
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
      findOne: jest.fn(() => ({
        data: purchaseOrder,
        header: {
          document_id: 'find_one_document_id',
        },
      })),
      updateById: jest.fn((id, value) => value),
    };
  }

  const databaseServiceMock = new DatabaseServiceMock();

  class CentrifugeClientMock {
    create_1 = jest.fn(data => data);
    update_4 = jest.fn((id, data) => data);
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

      const result = await purchaseOrdersController.create(purchaseOrder);

      expect(result).toEqual({
        collaborators: ['new_collaborator'],
        data: purchaseOrder,
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

  describe('update', function() {
    it('should update the specified purchase order', async function() {
      const purchaseOrdersController = purchaseOrdersModule.get<
        PurchaseOrdersController
      >(PurchaseOrdersController);

      const updatedOrder = { ...purchaseOrder, po_number: 'updated_number' };

      const updateResult = await purchaseOrdersController.update(
        { id: 'id_to_update' },
        { ...updatedOrder },
      );

      expect(databaseServiceMock.purchaseOrders.findOne).toHaveBeenCalledWith({
        _id: 'id_to_update',
      });
      expect(centrifugeClientMock.update_4).toHaveBeenCalledWith(
        'find_one_document_id',
        {
          data: {
            ...updatedOrder,
          },
          collaborators: ['new_collaborator'],
        },
      );

      expect(
        databaseServiceMock.purchaseOrders.updateById,
      ).toHaveBeenCalledWith('id_to_update', {
        ...updateResult
      });
    });
  });

  describe('get by id', function() {
    it('should return the purchase order by id', async function() {
      const purchaseOrdersController = purchaseOrdersModule.get<
        PurchaseOrdersController
      >(PurchaseOrdersController);

      const result = await purchaseOrdersController.getById({ id: 'some_id' });
      expect(databaseServiceMock.purchaseOrders.findOne).toHaveBeenCalledWith({
        _id: 'some_id',
      });

      expect(result).toEqual({
        data: purchaseOrder,
        header: {
          document_id: 'find_one_document_id',
        },
      });
    });
  });
});
