import { Body, Controller, Post, Request } from '@nestjs/common';
import { ROUTES } from '../../../src/common/constants';
import { DatabaseService } from '../database/database.service';
import { CentrifugeService } from '../centrifuge-client/centrifuge.service';
import { FundingRequest } from '../../../src/common/models/funding-request';
import { FunFundingCreatePayload, FunFundingResponse, FunRequest } from '../../../clients/centrifuge-node';

@Controller()
export class FundingController {
  constructor(
    private readonly databaseService: DatabaseService,
    private readonly centrifugeService: CentrifugeService,
  ) {
  }

  @Post(ROUTES.FUNDING.sign)
  async sign(@Body() payload: FunRequest, @Request() req): Promise<FunFundingResponse | null> {
    const signatureResponse = await this.centrifugeService.funding.sign(
      payload.document_id,
      payload.agreement_id,
      payload,
      req.user.account,
    );

    await this.centrifugeService.pullForJobComplete(
      signatureResponse.header.job_id,
      req.user.account,
    );

    return signatureResponse;
  }

  @Post(ROUTES.FUNDING.base)
  async create(@Body() fundingRequest: FundingRequest, @Request() req): Promise<FunFundingResponse | null> {

    const payload: FunFundingCreatePayload = {
      data: {
        amount: fundingRequest.amount.toString(),
        apr: fundingRequest.apr.toString(),
        days: fundingRequest.days.toString(),
        fee: fundingRequest.fee.toString(),
        repayment_due_date: fundingRequest.repayment_due_date,
        repayment_amount: fundingRequest.repayment_amount.toString(),
        currency: fundingRequest.currency.toString(),
        borrower_id: req.user.account.toString(),
        funder_id: fundingRequest.funder_id.toString(),
      },
    };

    if (fundingRequest.nft_address) payload.data.nft_address = fundingRequest.nft_address;

    const fundingResponse = await this.centrifugeService.funding.create(
      fundingRequest.document_id,
      payload,
      req.user.account,
    );

    await this.centrifugeService.pullForJobComplete(
      fundingResponse.header.job_id,
      req.user.account,
    );

    const signaturePayload = {
      document_id: fundingRequest.document_id,
      agreement_id: fundingResponse.data.funding.agreement_id,
    };
    const signatureResponse = await this.centrifugeService.funding.sign(
      signaturePayload.document_id, signaturePayload.agreement_id,
      signaturePayload, req.user.account,
    );
    await this.centrifugeService.pullForJobComplete(
      signatureResponse.header.job_id,
      req.user.account,
    );

    return signatureResponse;
  }
}
