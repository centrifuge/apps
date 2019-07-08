import { FundingController } from './funding.controller';
import { databaseServiceProvider } from '../database/database.providers';
import { Test, TestingModule } from '@nestjs/testing';
import { SessionGuard } from '../auth/SessionGuard';
import { DatabaseService } from '../database/database.service';
import { Invoice } from '../../../src/common/models/invoice';
import { centrifugeServiceProvider } from "../centrifuge-client/centrifuge.module";


describe('Funding controller', () => {

  const invoice: Invoice = {
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
    insertedInvoice = await databaseService.invoices.insert({
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
        invoice_id: 'some_id',
        document_id: '0x39393939',
        funder: 'funder',
        agreement_id: 'agreement_id',
        amount: 0,
        invoice_amount: 0,
        days: 0,
        apr: 5,
        fee: 0,
        repayment_due_date: 'next week',
        repayment_amount: 0,
        currency: 'USD',
      };

      const fundingController = fundingModule.get<FundingController>(
        FundingController,
      );

      const result = await fundingController.create(
        fundingRequest,
        { user: { _id: 'user_id' } },
      );
      expect(result).toEqual({
        header: {
          job_id: 'some_job_id',
        },
        data: {
          'amount': '0',
          'apr': '5',
          'borrower_id': undefined,
          'funder_id': 'funder',
          'currency': 'USD',
          'days': '0',
          'fee': '0',
          'nft_address': 'token_id',
          'repayment_amount': '0',
          'repayment_due_date': 'next week',
        },

      });
    });
  });

  describe('sign', () => {
    it('should return the signed funding agreement', async () => {

      const fundingRequest = {
        document_id: '0x39393939',
        agreement_id: 'agreement_id',
        nft_address: 'token_id',
        borrower_id: 'owner',
      };

      const fundingController = fundingModule.get<FundingController>(
        FundingController,
      );

      const result = await fundingController.sign(
        fundingRequest,
        { user: { _id: 'user_id' } },
      );
      expect(result).toEqual({
        header: {
          job_id: 'some_job_id',
          nfts: [
            {
              token_id: 'token_id',
            },
          ],
        },
        data: {
          funding: {
            ...fundingRequest,
          },
          signatures: ['signature_data_1'],
        },
      });
    });
  });


  describe('settle', () => {
    it('should return nft transfer details', async () => {

      const payload = {
        document_id: '0x39393939',
        agreement_id: 'agreement_id',
      };

      const fundingController = fundingModule.get<FundingController>(
        FundingController,
      );

      const result = await fundingController.settle(
        payload,
        { user: { _id: 'user_id' } },
      );
      expect(result).toEqual({
        header: {
          job_id: 'some_job_id',

        },
        registry_address: '0xADDRESS',
        to: '0x2222',
        token_id: '0xNFT',
      });
    });
  });
});

