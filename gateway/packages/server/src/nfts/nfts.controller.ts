import {
  Body,
  Controller,
  InternalServerErrorException,
  Param,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { CentrifugeService } from '../centrifuge-client/centrifuge.service';
import { CoreapiMintNFTRequest } from '@centrifuge/gateway-lib/centrifuge-node-client';
import {
  DocumentRequest,
  NftStatus,
} from '@centrifuge/gateway-lib/models/document';
import { MintNftRequest } from '@centrifuge/gateway-lib/models/nfts';
import { ROUTES } from '@centrifuge/gateway-lib/utils/constants';
import { SessionGuard } from '../auth/SessionGuard';

@Controller(ROUTES.NFTS)
@UseGuards(SessionGuard)
export class NftsController {
  constructor(
    private readonly databaseService: DatabaseService,
    private readonly centrifugeService: CentrifugeService,
  ) {}

  /**
   * Mints a NFT for a document
   * @async
   * @param {Param} request - the http request
   * @param {MintNftRequest} body - minting information
   * @return {Promise<DocumentRequest>} result
   */
  @Post('/mint')
  async mintNFT(@Req() request, @Body() body: MintNftRequest) {
    const docId = body.document_id;
    const payload: CoreapiMintNFTRequest = {
      asset_manager_address: body.asset_manager_address,
      document_id: body.document_id,
      proof_fields: body.proof_fields,
      deposit_address: body.deposit_address,
    };
    const docFromDb: any = await this.databaseService.documents.update(
      { 'header.document_id': docId },
      {
        $set: {
          nft_status: NftStatus.Minting,
        },
      },
      {
        multi: true,
        returnUpdatedDocs: true,
      },
    );

    let mintingResult;
    try {
      mintingResult = await this.centrifugeService.nft.mintNft(
        request.user.account,
        body.registry_address,
        payload,
      );

      const mint = await this.centrifugeService.pullForJobComplete(
        mintingResult.header.job_id,
        request.user.account,
      );

      if (mint.status !== 'success') {
        throw new InternalServerErrorException('Minting job failed');
      }

      await this.databaseService.documents.update(
        { 'header.document_id': docId },
        {
          $set: {
            nft_status: NftStatus.Minted,
          },
        },
        {
          multi: true,
        },
      );
    } catch (e) {
      await this.databaseService.documents.update(
        { 'header.document_id': docId },
        {
          $set: {
            nft_status: NftStatus.MintingFail,
          },
        },
        {
          multi: true,
        },
      );
      console.log(e);
      return;
    }
    /*
     * TODO Improve handling for push to oracle. We can have an NFT and fail to push it
     * In this case we should not remint just repush the oracle.
     * Maybe we can use to document Status to have something like ready for funding?
     * Now the docuent gets blocked becase we have a Minted status and the user
     * can not edit
     * */

    if (
      !body.oracle_address ||
      body.oracle_address === '0x0000000000000000000000000000000000000000'
    ) {
      console.log('not pushing to oracle', mintingResult);
      return;
    }

    const oraclePushResult = await this.centrifugeService.nft.pushAttributeOracle(
      request.user.account,
      {
        // TODO: this attribute key is a hardcoded hash of 'result' --  we should update this when we have a UI mockup
        attribute_key:
          '0xf6a214f7a5fcda0c2cee9660b7fc29f5649e3c68aad48e20e950137c98913a68',
        oracle_address: body.oracle_address,
        token_id: mintingResult.token_id,
      },
      body.document_id,
    );

    const push = await this.centrifugeService.pullForJobComplete(
      oraclePushResult.job_id,
      request.user.account,
    );

    if (push.status === 'success') {
      console.log('pushing to oracle succeeded', oraclePushResult);
    } else {
      console.log('pushing to oracle failed', oraclePushResult);
      throw new InternalServerErrorException('Pushing to oracle failed');
    }

    return;
  }
}
