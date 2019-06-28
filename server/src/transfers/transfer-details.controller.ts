import { Body, Controller, Post, Put, Request, UseGuards } from '@nestjs/common';
import { DatabaseService } from "../database/database.service";
import { CentrifugeService } from "../centrifuge-client/centrifuge.service";
import {
  UserapiCreateTransferDetailRequest,
  UserapiTransferDetailResponse,
  UserapiUpdateTransferDetailRequest
} from "../../../clients/centrifuge-node";
import { SessionGuard } from "../auth/SessionGuard";
import { TransferDetailsRequest } from "../../../src/common/models/transfer-details";
import { ROUTES } from "../../../src/common/constants";

@Controller(ROUTES.TRANSFER_DETAILS)
@UseGuards(SessionGuard)
export class TransferDetailsController {
  constructor(
      private readonly databaseService: DatabaseService,
      readonly centrifugeService: CentrifugeService,
      // commented out for now until we enable eth services
      // readonly ethService: EthService,
  ) {
  }

  @Post()
  /**
   * Creates a transfer detail from a TransferDetailRequest
   * @async
   * @return <UserapiTransferDetailResponse>} result
   */
  async create(@Body() transferDetailsRequest: TransferDetailsRequest, @Request() req) {
    const details: UserapiCreateTransferDetailRequest = {
      document_id: transferDetailsRequest.document_id,
      data: {
        sender_id: transferDetailsRequest.sender_id,
        recipient_id: transferDetailsRequest.recipient_id,
        amount: transferDetailsRequest.amount,
        currency: transferDetailsRequest.currency,
        scheduled_date: transferDetailsRequest.scheduled_date,
        settlement_date: transferDetailsRequest.settlement_date,
        settlement_reference: transferDetailsRequest.settlement_reference,
        transfer_type: transferDetailsRequest.transfer_type,
        status: transferDetailsRequest.status,
      }
    }

    const transferDetailsResponse: UserapiTransferDetailResponse = await this.centrifugeService.transfer.createTransferDetail(
        req.user.account,
        details,
        transferDetailsRequest.document_id
    )

    return await this.updateDbOnJobCompletion(transferDetailsResponse, req)
  }

  @Put()
  /**
   * Updates a transfer detail from an UpdateTransferDetailRequest
   * @async
   * @return <UserapiTransferDetailResponse>} result
   */
  async update(@Body() updateRequest: TransferDetailsRequest, @Request() req) {
    const details: UserapiUpdateTransferDetailRequest = {
      document_id: updateRequest.document_id,
      data: {
        transfer_id: updateRequest.transfer_id,
        sender_id: updateRequest.sender_id,
        recipient_id: updateRequest.recipient_id,
        amount: updateRequest.amount,
        currency: updateRequest.currency,
        scheduled_date: updateRequest.scheduled_date,
        settlement_date: updateRequest.settlement_date,
        settlement_reference: updateRequest.settlement_reference,
        transfer_type: updateRequest.transfer_type,
        status: updateRequest.status,
      }
    }

    const transferDetailsResponse: UserapiTransferDetailResponse = await this.centrifugeService.transfer.updateTransferDetail(
        req.user.account,
        details,
        updateRequest.document_id,
        updateRequest.transfer_id,
    )

    return await this.updateDbOnJobCompletion(transferDetailsResponse, req)
  }

  async updateDbOnJobCompletion (transferDetailsResponse: UserapiTransferDetailResponse, req) {
    await this.centrifugeService.pullForJobComplete(transferDetailsResponse.header.job_id, req.user.account);
    const invoiceWithTransferDetails = await this.centrifugeService.invoices.get(req.document_id, req.user.account);
    const transferList = await this.centrifugeService.transfer.listTransferDetails(req.user.account, req.document_id)
    // Update the document in the database
    await this.databaseService.invoices.update(
        { 'header.document_id': transferDetailsResponse.header.document_id, 'ownerId': req.user._id },
        {
          $set: {
            header: invoiceWithTransferDetails.header,
            transferDetails: transferList.data,
          },
        },
    );
    return transferDetailsResponse;
  }
}


