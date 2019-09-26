import { FUNDING_STATUS, getFundingStatus } from '../status';


describe('Funding Status', () => {

  it('Should return NO_STATUS', function() {
    const fundingAgreement = {};
    expect(getFundingStatus(fundingAgreement)).toBe(FUNDING_STATUS.NO_STATUS);
  });

  it('Should return PENDING', function() {
    const fundingAgreement = {
      funder_id: {
        value: '0xddddd',
      },
    };
    expect(getFundingStatus(fundingAgreement)).toBe(FUNDING_STATUS.PENDING);
  });

  it('Should return ACCEPTED', function() {
    const fundingAgreement = {
      funder_id: {
        value: '0x44444',
      },
      signatures: [{
        value: '0x44444',
      }],
    };
    expect(getFundingStatus(fundingAgreement)).toBe(FUNDING_STATUS.ACCEPTED);
  });


});
