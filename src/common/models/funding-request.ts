export interface IFundingRequest {
  funder: string,
  wallet_address: string,
  funding_id?: string,
  amount: number,
  days:number,
  apr: number,
  fee: number,
  repayment_due_date: string,
  repayment_amount: number,
  currency: string
}


export class FundingRequest implements IFundingRequest {
  public funder: string = '';
  public wallet_address: string = '';
  public funding_id?: string;
  public amount: number = 0;
  public days:number = 0;
  public apr: number = 5;
  public fee: number = 0;
  public repayment_due_date: string = '';
  public repayment_amount: number = 0;
  public currency: string = '';
}
