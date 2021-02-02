import { FundingController } from '../funding.controller';
import { databaseServiceProvider } from '../../database/database.providers';
import { Test, TestingModule } from '@nestjs/testing';
import { SessionGuard } from '../../auth/SessionGuard';
import { DatabaseService } from '../../database/database.service';
import { centrifugeServiceProvider } from '../../centrifuge-client/centrifuge.module';

describe('Funding controller', () => {

  const invoice: any = {
    sender: '0x111',
    recipient: '0x112',
    currency: 'USD',
    number: '999',
    sender_company_name: 'cinderella',
    bill_to_company_name: 'step mother',
  };
  let insertedInvoice: any = {};

  let fundingModule: TestingModule;

  beforeEach(async () => {
    fundingModule = await Test.createTestingModule({
      controllers: [FundingController],
      providers: [
        SessionGuard,
        centrifugeServiceProvider,
        databaseServiceProvider,
      ],
    })
      .compile();

    const databaseService = fundingModule.get<DatabaseService>(DatabaseService);
    insertedInvoice = await databaseService.documents.insert({
      header: {
        document_id: '0x39393939',
      },
      data: { ...invoice },
      ownerId: 'user_id',
    });

  });

  describe('create', () => {
    it('should return the created funding agreement', async () => {

      const fundingRequest = {
        document_id: '0x39393939',
        funder_id: 'funder',
        agreement_id: 'agreement_id',
        amount: '0',
        invoice_amount: '0',
        days: '0',
        apr: '5',
        fee: '0',
        repayment_due_date: 'next week',
        repayment_amount: '0',
        currency: 'USD',
        nft_address: '0xe444',
      };

      const fundingController = fundingModule.get<FundingController>(
        FundingController,
      );

      const result = await fundingController.create(
        fundingRequest,
        { user: { _id: 'user_id', account: '0xCentrifugeId' } },
      );

      expect(result).toEqual({
        header: {
          job_id: 'some_job_id',
          nfts: [
            {
              token_id: 'someToken',
              owner: '0xCentrifugeId',
            },
          ],
        },
        data: {
          funding: {
            agreement_id: 'e444',
          },
          signatures: ['signature_data_1'],
        },

      });
    });
  });

  describe('sign', () => {
    it('should return the signed funding agreement', async () => {

      const fundingRequest = {
        document_id: '0x39393939',
        agreement_id: 'agreement_id',
      };

      const fundingController = fundingModule.get<FundingController>(
        FundingController,
      );

      const result = await fundingController.sign(
        fundingRequest,
        { user: { _id: 'user_id', account: '0xCentrifugeId' } },
      );
      expect(result).toEqual({
        header: {
          job_id: 'some_job_id',
          nfts: [
            {
              token_id: 'someToken',
              owner: '0xCentrifugeId',
            },
          ],
        },
        data: {
          funding: {
            agreement_id: fundingRequest.agreement_id,
          },
          signatures: ['signature_data_1'],
        },
      });
    });
  });
});
