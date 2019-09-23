export interface IFundingAgreement {
  funder_id: string,
  agreement_id?: string,
  amount: string,
  days: string,
  apr: string,
  fee: string,
  repayment_due_date: string,
  repayment_amount: string,
  currency: string
}


export class FundingAgreement implements IFundingAgreement {
  public funder_id: string = '';
  public agreement_id?: string;
  public amount: string = '0';
  public days: string = '0';
  public apr: string = '0.05';
  public fee: string = '0';
  public repayment_due_date: string = '';
  public repayment_amount: string = '0';
  public currency: string = 'USD';
  public nft_address: string = '';
}


export class FundingRequest extends FundingAgreement {
  public document_id: string;
}

