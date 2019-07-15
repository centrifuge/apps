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
    create: jest.fn(data => {
      return {
        header: {
          job_id: 'some_job_id',
        },
        ...data,
      };
    }),
    update: jest.fn((documentId, data) => {
      return {
        header: {
          job_id: 'some_job_id',
        },
        ...data,
      };
    }),
  };
  purchaseOrders = {
    create: jest.fn(data => data),
    get: jest.fn((id, data) => data),
    update: jest.fn((id, data) => data),
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

    get: jest.fn((document_id, agreement_id, account) => {
      return {
        header: {
          nfts: [
            {
              token_id: '0xNFT',
              owner: '0x1111',
              registry: '0xADDRESS',
            },
          ],
        },
        data: {
          funding: {
            nft_address: '0xNFT',
            funder_id: '0x1111',
            borrower_id: '0x2222',
          },
        },
      };

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
    transferNft: (account, registry_address, token_id, body) => {
      return new Promise((resolve, reject) => {
        resolve({
            header: {
              job_id: 'some_job_id',
            },
            registry_address,
            token_id,
            to: body.to,
          },
        );
      });
    },
  };
  accounts = {
    generateAccount: jest.fn(() => ({
      identity_id: 'generated_identity_id',
    })),
  };
  documents = {
    get: jest.fn(document_id => {
      return {
        header: { document_id: '0x39393939' },
        read_access: [ '0x111' ],
        write_access: [ '0x222' ],
        attributes:
          { animal_type: 'iguana',
            number_of_legs: 4,
            diet: 'insects',
            'this is a random field': 'random'
          },
        schema_id: 'iUSDF2ax31e',
        ownerId: 'user_id',
      };
    }),
    createDocument: jest.fn( (authid, data) => {
      return {
        header: {
          job_id: 'some_job_id',
        },
        ...data,
      };
    }),
    updateDocument: jest.fn((authid, docid, data) => {
      return {
        header: {
          job_id: 'some_job_id',
        },
        ...data,
      };
    }),
  };
  pullForJobComplete = () => true;
}
