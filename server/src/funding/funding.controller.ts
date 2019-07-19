import { Body, Controller, HttpException, HttpStatus, Post, Request } from '@nestjs/common';
import { ROUTES } from '../../../src/common/constants';
import { DatabaseService } from '../database/database.service';
import { CentrifugeService } from '../centrifuge-client/centrifuge.service';
import { FundingRequest } from '../../../src/common/models/funding-request';
import {
  CoreapiTransferNFTResponse,
  FunFundingCreatePayload,
  FunFundingResponse,
  FunRequest,
  NftNFTMintInvoiceUnpaidRequest,
} from '../../../clients/centrifuge-node';

@Controller()
export class FundingController {
  constructor(
    private readonly databaseService: DatabaseService,
    private readonly centrifugeService: CentrifugeService,
  ) {
  }

  @Post(ROUTES.FUNDING.sign)
  async sign(@Body() payload: FunRequest, @Request() req): Promise<FunFundingResponse | null> {
    const signatureResponse = await this.centrifugeService.funding.sign(payload.document_id, payload.agreement_id, payload, req.user.account);
    await this.centrifugeService.pullForJobComplete(signatureResponse.header.job_id, req.user.account);
    const updatedInvoice = await this.centrifugeService.invoices.getInvoice(req.user.account, payload.document_id);
    delete updatedInvoice.attributes;
    // Find all the invoices for the document ID
    const invoiceWithNft = await this.databaseService.invoices.update(
      { 'header.document_id': payload.document_id, 'ownerId': req.user._id },
      {
        ...updatedInvoice,
        ownerId: req.user._id,
        fundingAgreement: signatureResponse.data,
      },
      { returnUpdatedDocs: true },
    );

    // transfer should eventually be its own method so we don't couple signing and transfer
    // this block needs to be adjusted, only accounts for two signatures for now, transfers the token to the second signature
    if (
      signatureResponse.data.signatures &&
      signatureResponse.data.signatures.length > 0
    ) {

      const nfts = invoiceWithNft.header.nfts;
      const nft = nfts.find(item => {
        return item.token_id === invoiceWithNft.fundingAgreement.funding.nft_address;
      });

      // to be enabled

      if (nft === undefined) {
        throw new HttpException(await 'NFT not attached to Invoice, NFT not found', HttpStatus.CONFLICT);
      }

      const registry = nft.registry;
      const tokenId = nft.token_id;
      const newOwner = invoiceWithNft.fundingAgreement.funding.funder_id;

      if (nft.owner.toLowerCase() === invoiceWithNft.fundingAgreement.funding.borrower_id.toLowerCase()) {
        const transferResponse = await this.centrifugeService.nft.transferNft(
          nft.owner,
          registry,
          tokenId,
          { to: newOwner },
          nft.owner,
        );

        await this.centrifugeService.pullForJobComplete(transferResponse.header.job_id, nft.owner);
      } else {
        throw new HttpException(await 'token owner does not correspond to the borrower', HttpStatus.FORBIDDEN);
      }
    }

    return signatureResponse;
  }

  @Post(ROUTES.FUNDING.settle)
  async settle(@Body() payload: FunRequest, @Request() req): Promise<CoreapiTransferNFTResponse | null> {
    // We only transfer the nft but we could more stuff here,
    // for ex we can sign the funding agreement again if necesary
    const fundingAgreement = await this.centrifugeService.funding.get(payload.document_id, payload.agreement_id, req.user.account);
    const nfts = fundingAgreement.header.nfts;
    const nft = nfts.find(item => {
      return item.token_id === fundingAgreement.data.funding.nft_address;
    });

    if (nft === undefined) {
      throw new HttpException(await 'NFT not attached to Invoice, NFT not found', HttpStatus.CONFLICT);
    }

    const registry = nft.registry;
    const tokenId = nft.token_id;
    const newOwner = fundingAgreement.data.funding.borrower_id;

    if (nft.owner.toLowerCase() === fundingAgreement.data.funding.funder_id.toLowerCase()) {
      const transferResponse = await this.centrifugeService.nft.transferNft(
        nft.owner,
        registry,
        tokenId,
        { to: newOwner },
        nft.owner,
      );

      await this.centrifugeService.pullForJobComplete(transferResponse.header.job_id, nft.owner);
      return transferResponse;
    } else {
      throw new HttpException(await 'token owner does not correspond to the Funder', HttpStatus.FORBIDDEN);
    }
  }

  @Post(ROUTES.FUNDING.base)
  async create(@Body() fundingRequest: FundingRequest, @Request() req): Promise<FunFundingResponse | null> {
    const nftPayload: NftNFTMintInvoiceUnpaidRequest = {
      document_id: fundingRequest.document_id,
      deposit_address: req.user.account,
    };

    // Mint an UnpaidInvoiceNFT.
    // TODO use the new invoice unpaid methods
    // This will fail if the document already has a nft minted
     const nftResult = await this.centrifugeService.invoices.invoiceUnpaidNft(req.user.account, nftPayload);

    // Pull to see when minting is complete. We need the token ID for the funding API
     await this.centrifugeService.pullForJobComplete(nftResult.header.job_id, req.user.account);
    // Get the new invoice data in order to get the NFT ID
    const invoiceWithNft = await this.centrifugeService.invoices.getInvoice(req.user.account, fundingRequest.document_id);
    const tokenId = invoiceWithNft.header.nfts[0].token_id;
    // Create funding payload
    const payload: FunFundingCreatePayload = {
      data: {
        amount: fundingRequest.amount.toString(),
        apr: fundingRequest.apr.toString(),
        days: fundingRequest.days.toString(),
        fee: fundingRequest.fee.toString(),
        repayment_due_date: fundingRequest.repayment_due_date,
        repayment_amount: fundingRequest.repayment_amount.toString(),
        currency: fundingRequest.currency,
        borrower_id: req.user.account,
        funder_id: fundingRequest.funder,
        nft_address: tokenId,
      },
    };

    const fundingResponse = await this.centrifugeService.funding.create(fundingRequest.document_id, payload, req.user.account);
    // Pull to see of the funding request has been created
    // THis will not be necessary when we implement JOb context and keep Job Status for documents
    await this.centrifugeService.pullForJobComplete(fundingResponse.header.job_id, req.user.account);

    const invoiceWithFunding = await this.centrifugeService.invoices.getInvoice(req.user.account, fundingRequest.document_id);
    // We need to delete the attributes prop because NEDB does not allow for . in field names
    // Ex: funding[0].amount
    delete invoiceWithFunding.attributes;
    // Update the document in the database
    await this.databaseService.invoices.update(
      { 'header.document_id': fundingRequest.document_id, 'ownerId': req.user._id },
      {
        ...invoiceWithFunding,
        ownerId: req.user._id,
        fundingAgreement: fundingResponse.data,
      },
    );

    return fundingResponse;
  }
}
