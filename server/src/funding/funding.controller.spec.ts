import { FundingController } from './funding.controller';
import { databaseServiceProvider } from '../database/database.providers';
import { User } from '../../../src/common/models/user';
import { Test, TestingModule } from '@nestjs/testing';
import { SessionGuard } from '../auth/SessionGuard';
import { CentrifugeService } from '../centrifuge-client/centrifuge.service';
import { DatabaseService } from '../database/database.service';


describe('Funding controller', () => {

  class CentrifugeClientMock {
    invoices = {
      get: jest.fn(data => {
        return {
          header: {
            nfts: [
              {
                token_id: '0x11111',
              },
            ],
          },
          data: {
            attributes: {
              'funding[0].test': true,
            },
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
    };
    nft = {
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
    pullForJobComplete = () => true;

  }


  const centrifugeClientMock = new CentrifugeClientMock();
  // TODO Mocking/Reimplementing all nedb moethods is error prone
  // Considering that nedb is local we can run it in the test with a different config
  // for storage and we will not need a DatabaseServiceMock
  // https://app.zenhub.com/workspaces/centrifuge-5ba350114b5806bc2be90978/issues/centrifuge/centrifuge-starter-kit/98
  let registeredUser: User;
  let fundingModule: TestingModule;
  let insertedUsers = {};

  class DatabaseServiceMock {
    invoices = {
      update: jest.fn((id, value) => value),
    };
  }

  const databaseServiceMock = new DatabaseServiceMock();

  beforeAll(async () => {
    fundingModule = await Test.createTestingModule({
      controllers: [FundingController],
      providers: [
        SessionGuard,
        CentrifugeService,
        databaseServiceProvider,
      ],
    })
      .overrideProvider(DatabaseService)
      .useValue(databaseServiceMock)
      .overrideProvider(CentrifugeService)
      .useValue(centrifugeClientMock)
      .compile();

  });


  describe('create', () => {
    it('should return the created invoice', async () => {

      const fundingRequest = {
        invoice_id: 'some_id',
        document_id: 'document_id',
        funder: 'funder',
        wallet_address: 'wallet_address',
        funding_id: 'funder_id',
        amount: 0,
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
        'write_access': { 'collaborators': [fundingRequest.funder] },
        header: {
          job_id: 'some_job_id',
        },
        data: {
          'amount': '0',
          'apr': '5',
          'currency': 'USD',
          'days': '0',
          'fee': '0',
          'nft_address': '0x11111',
          'repayment_amount': '0',
          'repayment_due_date': 'next week',
        },

      });
    });
  });


});

