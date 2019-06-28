import {
  Test,
  TestingModule
} from "@nestjs/testing";
import { databaseServiceProvider } from "../database/database.providers";
import { DatabaseService } from "../database/database.service";
import { Invoice } from "../../../src/common/models/invoice";
import { SessionGuard } from "../auth/SessionGuard";
import { CentrifugeService } from "../centrifuge-client/centrifuge.service";
import { TransferDetailsController } from "./transfer-details.controller";
import { MockCentrifugeService } from "../centrifuge-client/centrifuge-client.mock";

describe('Transfer controller', () => {

  const invoice: Invoice = {
    sender: '0x111',
    recipient: '0x999',
    currency: 'EUR',
    number: '1337',
    sender_company_name: 'hot hot heat',
    bill_to_company_name: 'ice cold water',
  };

  let insertedInvoice: any = {};
  let transferModule: TestingModule;

  const mockCentrifugeService = new MockCentrifugeService()
  const centrifugeServiceProvider = {
    provide: CentrifugeService,
    useValue: mockCentrifugeService
  }

  beforeEach(async () => {
    transferModule = await Test.createTestingModule({
      controllers: [TransferDetailsController],
      providers: [
        SessionGuard,
        centrifugeServiceProvider,
        databaseServiceProvider,
      ],
    })
    .compile();

    const databaseService = transferModule.get<DatabaseService>(DatabaseService);

    insertedInvoice = await databaseService.invoices.insert({
      header: {
        document_id: '0x39393939',
      },
      data: { ...invoice },
      ownerId: 'user_id',
    });
  })

  describe('create', () => {
    it('should return the created transfer detail', async () => {

      const transferRequest = {
        document_id: '0x39393939',
        sender_id: 'sender',
        recipient_id: 'recipient',
        amount: '100',
        currency: 'USD',
        scheduled_date: 'today',
        settlement_reference: '0x000000',
        status: 'open',
        settlement_date: '3 days from now',
        transfer_type: 'nft_escrow',
      };

      const transferController = transferModule.get<TransferDetailsController>(
          TransferDetailsController,
      );

      const result = await transferController.create(
          transferRequest,
          { user: { _id: 'user_id' } },
      );
      expect(result).toEqual({
        header: {
          job_id: 'some_job_id',
        },
        document_id: "0x39393939",
        data: {
          'sender_id': 'sender',
          'recipient_id': 'recipient',
          'amount': '100',
          'currency': 'USD',
          'scheduled_date': 'today',
          'settlement_reference': '0x000000',
          'status': 'open',
          'transfer_type': 'nft_escrow',
          'settlement_date': '3 days from now'
        },
      });
    });
  });

  describe('update', () => {
    it('should return the updated transfer detail', async () => {

      const transferRequest = {
        transfer_id: '0x11111111',
        document_id: '0x39393939',
        sender_id: 'sender',
        recipient_id: 'recipient',
        amount: '100',
        currency: 'USD',
        scheduled_date: 'today',
        settlement_reference: '0x000000',
        status: 'settled',
        settlement_date: '3 days from now',
        transfer_type: 'nft_escrow',
      };

      const transferController = transferModule.get<TransferDetailsController>(
          TransferDetailsController,
      );

      const result = await transferController.update(
          transferRequest,
          { user: { _id: 'user_id' } },
      );
      expect(result).toEqual({
        header: {
          job_id: 'some_job_id',
        },
        document_id: "0x39393939",
        data: {
          'transfer_id': '0x11111111',
          'sender_id': 'sender',
          'recipient_id': 'recipient',
          'amount': '100',
          'currency': 'USD',
          'scheduled_date': 'today',
          'settlement_reference': '0x000000',
          'status': 'settled',
          'transfer_type': 'nft_escrow',
          'settlement_date': '3 days from now'
        },
      });
    });
  })
});