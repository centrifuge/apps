export let testingHelpers = {
  currentGeneratedAccount: null,
}

export class MockCentrifugeService {
  invoices = {
    getInvoice: jest.fn((auth, document_id) => {
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
      }
    }),
    createInvoice: jest.fn((auth, data) => {
      return {
        header: {
          job_id: 'some_job_id',
        },
        ...data,
      }
    }),
    updateInvoice: jest.fn((auth, documentId, data) => {
      return {
        header: {
          job_id: 'some_job_id',
        },
        ...data,
      }
    }),

    invoiceUnpaidNft: jest.fn((auth, payload) => {
      return new Promise((resolve, reject) => {
        resolve({
          header: {
            job_id: 'some_job_id',
          },
        })
      })
    }),
  }
  purchaseOrders = {
    createPurchaseOrder: jest.fn((auth, data) => data),
    getPurchaseOrder: jest.fn((auth, document_id) => {
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
      }
    }),
    updatePurchaseOrder: jest.fn((auth, id, data) => data),
  }
  funding = {
    createFundingAgreement: jest.fn((account, document_id, payload) => {
      return new Promise((resolve, reject) => {
        const result = {
          header: {
            job_id: 'some_job_id',
          },
          data: {
            funding: {
              agreement_id: 'e444',
              ...payload.data,
            },
          },
        }
        resolve(result)
      })
    }),

    getFundingAgreement: jest.fn((document_id, agreement_id, account) => {
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
      }
    }),
    signFundingAgreement: jest.fn((account, document_id, agreement_id) => {
      return new Promise((resolve, reject) => {
        const result = {
          header: {
            job_id: 'some_job_id',
            nfts: [
              {
                token_id: 'someToken',
                owner: account,
              },
            ],
          },
          data: {
            funding: {
              agreement_id,
            },
            signatures: ['signature_data_1'],
          },
        }
        resolve(result)
      })
    }),
  }
  transfer = {
    createTransferDetail: jest.fn((document_id, payload) => {
      return new Promise((resolve, reject) => {
        const result = {
          header: {
            job_id: 'some_job_id',
          },
          ...payload,
        }
        resolve(result)
      })
    }),
    updateTransferDetail: jest.fn((document_id, payload) => {
      return new Promise((resolve, reject) => {
        const result = {
          header: {
            job_id: 'some_job_id',
          },
          ...payload,
        }
        resolve(result)
      })
    }),
    listTransferDetails: jest.fn((document_id, payload) => {
      return new Promise((resolve, reject) => {
        const result = {
          header: {
            job_id: 'some_job_id',
          },
          ...payload,
        }
        resolve(result)
      })
    }),
  }

  nft = {
    mintNft: jest.fn((auth, registry, payload) => {
      return new Promise((resolve, reject) => {
        const result = {
          header: {
            job_id: 'some_job_id',
          },
          ...payload,
        }
        resolve(result)
      })
    }),
    transferNft: jest.fn((account, registry_address, token_id, body) => {
      return new Promise((resolve, reject) => {
        resolve({
          header: {
            job_id: 'some_job_id',
          },
          registry_address,
          token_id,
          to: body.to,
        })
      })
    }),
  }

  nftBeta = this.nft

  accounts = {
    generateAccount: jest.fn(() => {
      testingHelpers.currentGeneratedAccount = '0x' + new Date().getTime()
      return {
        identity_id: testingHelpers.currentGeneratedAccount,
      }
    }),
  }
  documents = {
    getCommittedDocument: jest.fn((account_id, document_id) => {
      return {
        header: {
          document_id: document_id,
          nfts: [{ owner: 'owner', token_id: 'token_id' }],
        },
        read_access: ['0x111'],
        write_access: ['0x222'],
        data: { currency: 'USD' },
        attributes: {
          animal_type: {
            type: 'string',
            value: 'iguana',
          },
          number_of_legs: {
            type: 'decimal',
            value: '4',
          },
          diet: {
            type: 'string',
            value: 'insects',
          },
        },
        scheme: 'iUSDF2ax31e',
        ownerId: 'user_id',
      }
    }),
    createDocumentV2: jest.fn((authid, data) => {
      return {
        header: {
          job_id: 'some_job_id',
        },
        ...data,
      }
    }),
    commitDocumentV2: jest.fn((authid, data) => {
      return {
        header: {
          job_id: 'some_job_id',
        },
        ...data,
      }
    }),
    updateDocument: jest.fn((authid, docid, data) => {
      return {
        header: {
          job_id: 'some_job_id',
        },
        ...data,
      }
    }),
    updateDocumentV2: jest.fn((authid, data, docid) => {
      return {
        header: {
          job_id: 'some_job_id',
        },
        ...data,
      }
    }),
  }
  pullForJobComplete = () => true
}
