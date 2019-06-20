import { FundingController } from './funding.controller';
import { databaseServiceProvider } from '../database/database.providers';
import { Test, TestingModule } from '@nestjs/testing';
import { SessionGuard } from '../auth/SessionGuard';
import { CentrifugeService } from '../centrifuge-client/centrifuge.service';
import { DatabaseService } from '../database/database.service';
import { Invoice } from '../../../src/common/models/invoice';


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

  class CentrifugeClientMock {
    invoices = {
      get: jest.fn(document_id => {
        return {
          header: {
            document_id,
            nfts: [
              {
                token_id: 'token_id',
                owner: 'owner',
              },
            ],
          },
          data: {
            currency: 'USD',
          },

          attributes: {
            'funding[0].test': true,
          },
        };
      }),
    };
    funding = {
      create: jest.fn((document_id, payload, account) => {
        return new Promise((resolve, reject) => {
          const result = {
            header: {
              job_id: 'some_job_id',
            },
            ...payload,
          };
          resolve(result);
        });
      }),
      sign: jest.fn((document_id, agreement_id, payload, account) => {
        return new Promise((resolve, reject) => {
          const result = {
            header: {
              job_id: 'some_job_id',
              nfts: [
                {
                  token_id: payload.nft_address,
                  owner: account,
                },
              ],
            },
            data: {
              funding: {
                ...payload,
              },
              signatures: ['signature_data_1'],
            },
          };
          resolve(result);
        });
      }),
    };
    invoiceUnpaid = {
      mintInvoiceUnpaidNFT: () => {
        return new Promise((resolve, reject) => {
          resolve({
              header: {
                job_id: 'some_job_id',
              },
            },
          );
        });
      },
    };
    nft = {
      transferNft: () => {
        return new Promise((resolve, reject) => {
          resolve({
              header: {
                job_id: 'some_job_id',
              },
            },
          );
        });
      },
    };
    pullForJobComplete = () => true;

  }


  const centrifugeClientMock = new CentrifugeClientMock();
  // TODO Mocking/Reimplementing all nedb moethods is error prone
  // Considering that nedb is local we can run it in the test with a different config
  // for storage and we will not need a DatabaseServiceMock
  // https://app.zenhub.com/workspaces/centrifuge-5ba350114b5806bc2be90978/issues/centrifuge/centrifuge-starter-kit/98
  let fundingModule: TestingModule;


  beforeEach(async () => {
    fundingModule = await Test.createTestingModule({
      controllers: [FundingController],
      providers: [
        SessionGuard,
        CentrifugeService,
        databaseServiceProvider,
      ],
    })
      .overrideProvider(CentrifugeService)
      .useValue(centrifugeClientMock)
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
        invoice_amount:0,
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
});

