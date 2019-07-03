export interface IFundingRequest {
  document_id: string,
  funder: string,
  agreement_id?: string,
  amount: number,
  days: number,
  apr: number,
  fee: number,
  repayment_due_date: string,
  repayment_amount: number,
  currency: string
}


export class FundingRequest implements IFundingRequest {
  public invoice_id: string;
  public document_id: string;
  public funder: string = '';
  public agreement_id?: string;
  public amount: number = 0;
  public days: number = 0;
  public invoice_amount: number = 0;
  public apr: number = 0.05;
  public fee: number = 0;
  public repayment_due_date: string = '';
  public repayment_amount: number = 0;
  public currency: string = '';
}

