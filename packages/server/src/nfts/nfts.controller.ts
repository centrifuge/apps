import { Body, Controller, Param, Post, Req, UseGuards } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { CentrifugeService } from '../centrifuge-client/centrifuge.service';
import { CoreapiMintNFTRequest } from '@centrifuge/gateway-lib/centrifuge-node-client';
import { Document, DocumentRequest } from '@centrifuge/gateway-lib/models/document';
import { MintNftRequest, TransferNftRequest } from '@centrifuge/gateway-lib/models/nfts';
import { ROUTES } from '@centrifuge/gateway-lib/utils/constants';
import { SessionGuard } from '../auth/SessionGuard';

@Controller(ROUTES.NFTS)
@UseGuards(SessionGuard)
export class NftsController {
  constructor(
    private readonly databaseService: DatabaseService,
    private readonly centrifugeService: CentrifugeService,
  ) {
  }

  /**
   * Mints a NFT for a document
   * @async
   * @param {Param} request - the http request
   * @param {MintNftRequest} body - minting information
   * @return {Promise<DocumentRequest>} result
   */
  @Post('/mint')
  async mintNFT(
    @Req() request,
    @Body() body: MintNftRequest,
  ) {
    const payload: CoreapiMintNFTRequest = {
      // @ts-ignore
      asset_manager_address: body.asset_manager_address,
      document_id: body.document_id,
      proof_fields: body.proof_fields,
      deposit_address: body.deposit_address,
    };

    const mintingResult: Document = await this.centrifugeService.nft.mintNft(
      request.user.account,
      body.registry_address,
      payload,
    );

    // @ts-ignore
    await this.centrifugeService.pullForJobComplete(mintingResult.header.job_id, request.user.account);
    return mintingResult;
  }

  /**
   * Transfer a NFT to someone else
   * @async
   * @param {Param} request - the http request
   * @param {MintNftRequest} body - minting information
   * @return {Promise<DocumentRequest>} result
   */
  @Post('/transfer')
  async transfer(
    @Req() request,
    @Body() body: TransferNftRequest,
  ) {

    const transferResult = await this.centrifugeService.nft.transferNft(
      request.user.account,
      body.registry,
      body.token_id,
      {
        to: body.to,
      },
    );

    await this.centrifugeService.pullForJobComplete(transferResult.header.jobId, request.user.account);
    return transferResult;
  }
}
