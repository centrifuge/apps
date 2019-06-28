export class MockCentrifugeService {
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
  transfer = {
    createTransferDetail: jest.fn((document_id, payload) => {
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
    updateTransferDetail: jest.fn((document_id, payload) => {
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
    listTransferDetails: jest.fn((document_id, payload) => {
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
  }
  pullForJobComplete = () => true;
}