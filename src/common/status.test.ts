import { getInvoiceFundingStatus, STATUS } from './status';


describe('Funding Status', () => {

  it('Should return NO_STATUS', function() {
    const invoice = {};
    expect(getInvoiceFundingStatus(invoice)).toBe(STATUS.NO_STATUS);
  });

  it('Should return PENDING', function() {
    const invoice = {
      fundingAgreement: {},
    };
    expect(getInvoiceFundingStatus(invoice)).toBe(STATUS.PENDING);
  });

  it('Should return ACCEPTED', function() {
    const invoice = {
      fundingAgreement: {
        signatures: [{}],
      },
    };
    expect(getInvoiceFundingStatus(invoice)).toBe(STATUS.ACCEPTED);
  });

  it('Should return SENDING_FUNDING', function() {
    const invoice = {
      fundingAgreement: {
        signatures: [{}],
      },
      transferDetails: [
        { status: 'opened' }
      ],
    };
    expect(getInvoiceFundingStatus(invoice)).toBe(STATUS.SENDING_FUNDING);
  });

  it('Should return FUNDED', function() {
    const invoice = {
      fundingAgreement: {
        signatures: [{}],
      },
      transferDetails: [
        { status: 'settled' }
      ],
    };
    expect(getInvoiceFundingStatus(invoice)).toBe(STATUS.FUNDED);
  });


  it('Should return REPAYING_FUNDING', function() {
    const invoice = {
      fundingAgreement: {
        signatures: [{}],
      },
      transferDetails: [
        { status: 'settled' },
        { status: 'opened' },
      ],
    };
    expect(getInvoiceFundingStatus(invoice)).toBe(STATUS.REPAYING_FUNDING);
  });

  it('Should return REPAID', function() {
    const invoice = {
      fundingAgreement: {
        signatures: [{}],
      },
      transferDetails: [
        { status: 'settled' },
        { status: 'settled' },
      ],
    };
    expect(getInvoiceFundingStatus(invoice)).toBe(STATUS.REPAID);
  });

  it('Should return UNKNOWN', function() {
    const invoice = {
      fundingAgreement: {
        signatures: [{}],
      },
      transferDetails: [
        { status: 'UNKNOWN' },
        { status: 'UNKNOWN' },
      ],
    };
    expect(getInvoiceFundingStatus(invoice)).toBe(STATUS.UNKNOWN);
  });

});
