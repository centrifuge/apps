import { Body, Controller, Post, Request } from '@nestjs/common';
import { ROUTES } from '@centrifuge/gateway-lib/utils/constants';
import { DatabaseService } from '../database/database.service';
import { CentrifugeService } from '../centrifuge-client/centrifuge.service';
import { FundingRequest } from '@centrifuge/gateway-lib/models/funding-request';
import { UserapiFundingRequest, UserapiFundingResponse } from '@centrifuge/gateway-lib/centrifuge-node-client';
import { FundingSignatureRequest } from '@centrifuge/gateway-lib/models/funding-request';

@Controller()
export class FundingController {
  constructor(
    private readonly databaseService: DatabaseService,
    private readonly centrifugeService: CentrifugeService,
  ) {
  }

  @Post(ROUTES.FUNDING.sign)
  async sign(@Body() payload: FundingSignatureRequest, @Request() req): Promise<UserapiFundingResponse | null> {
    const signatureResponse = await this.centrifugeService.funding.signFundingAgreement(
      req.user.account,
      payload.document_id,
      payload.agreement_id,
    );

    await this.centrifugeService.pullForJobComplete(
      signatureResponse.header.job_id,
      req.user.account,
    );

    return signatureResponse;
  }

  @Post(ROUTES.FUNDING.base)
  async create(@Body() fundingRequest: FundingRequest, @Request() req): Promise<UserapiFundingResponse | null> {

    const payload: UserapiFundingRequest = {
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

    const fundingResponse = await this.centrifugeService.funding.createFundingAgreement(
      req.user.account,
      fundingRequest.document_id,
      payload,
    );

    await this.centrifugeService.pullForJobComplete(
      fundingResponse.header.job_id,
      req.user.account,
    );
    const signatureResponse = await this.centrifugeService.funding.signFundingAgreement(
      req.user.account,
      fundingRequest.document_id,
      fundingResponse.data.funding.agreement_id,
    );
    await this.centrifugeService.pullForJobComplete(
      signatureResponse.header.job_id,
      req.user.account,
    );

    return signatureResponse;
  }
}
