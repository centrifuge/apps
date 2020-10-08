import { Body, Controller, Get, NotFoundException, Param, Post, Put, Req, UseGuards } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { CentrifugeService } from '../centrifuge-client/centrifuge.service';
import {
  CoreapiAttributeResponse,
  CoreapiCreateDocumentRequest, CoreapiDocumentResponse,
  CoreapiResponseHeader,
} from '@centrifuge/gateway-lib/centrifuge-node-client';
import { Document, DocumentStatus, NftStatus } from '@centrifuge/gateway-lib/models/document';
import { ROUTES } from '@centrifuge/gateway-lib/utils/constants';
import { SessionGuard } from '../auth/SessionGuard';
import { unflatten } from '@centrifuge/gateway-lib/utils/custom-attributes';
import TypeEnum = CoreapiAttributeResponse.TypeEnum;
import SchemeEnum = CoreapiDocumentResponse.SchemeEnum;

export class CommitResp {
  commitResult: Document;
  dbId: string;
}

@Controller(ROUTES.DOCUMENTS)
@UseGuards(SessionGuard)
export class DocumentsController {
  constructor(
    private readonly databaseService: DatabaseService,
    private readonly centrifugeService: CentrifugeService,
  ) {
  }

  async getDocFromDB(docId: string): Promise<Document> {
    const documentFromDb: Document = await this.databaseService.documents.findOne(
        { _id: docId },
    );

    if (!documentFromDb) throw new NotFoundException(`Can not find document #${docId} in the database`);
    return documentFromDb;
  }

  async commitPendingDoc(createResult: Document, request: any) {

    createResult.document_status = DocumentStatus.Creating;
    createResult.nft_status = NftStatus.NoNft;

    const created = await this.databaseService.documents.insert({
      ...createResult,
      ownerId: request.user._id,
    });

    createResult.attributes = unflatten(createResult.attributes);
    const commitResult = await this.centrifugeService.documents.commitDocumentV2(
        request.user.account,
        createResult.header.document_id,
    );

    const commitResp: CommitResp = {
      commitResult,
      dbId: created._id,
    };

    return commitResp;
  }

  async updateDBDoc(updateResult: Document, id: string, userID: string) {
    const updated = await this.centrifugeService.pullForJobComplete(updateResult.header.job_id, userID);
    return await this.databaseService.documents.updateById(id, {
      $set: {
        document_status: (updated.status === 'success')? DocumentStatus.Created : DocumentStatus.CreationFail,
      },
    });
  }

  @Post()
  /**
   * Create a generic document and save in the centrifuge node and the local database
   * @async
   * @param request - the http request
   * @param {Document} document - the body of the request
   * @return {Promise<Document>} result
   */
  async create(@Req() request, @Body() document: Document): Promise<Document> {

    const payload = {
      ...document,
      attributes: {
        ...document.attributes,
        // add created by custom field
        _createdBy: {
          type: TypeEnum.Bytes,
          value: request.user.account,
        },
      },
    };

    const createResult: Document = await this.centrifugeService.documents.createDocumentV2(
      request.user.account,
      {
        attributes: payload.attributes,
        read_access: payload.header.read_access ? payload.header.read_access : [],
        write_access: payload.header.write_access ? payload.header.write_access : [],
        scheme: CoreapiCreateDocumentRequest.SchemeEnum.Generic,
      },
    );

    const commitResp = await this.commitPendingDoc(createResult, request);
    return await this.updateDBDoc(commitResp.commitResult, commitResp.dbId, request.user.account);
  }

  @Post(':id/clone')
  /**
   * Create a generic document and save in the centrifuge node and the local database
   * @async
   * @param {Param} params - the query params
   * @param request - the http request
   * @param {Document} document - the body of the request
   * @return {Promise<Document>} result
   */
  async clone(
      @Req() request,
      @Body() document: Document,
      @Param() params,
  ): Promise<Document> {

    const cloneResult: Document = await this.centrifugeService.documents.cloneDocumentV2(
        request.user.account,
        {
          scheme: SchemeEnum.Generic,
        },
        params.id,
    );
    document.header = cloneResult.header;

    const commitResp = await this.commitPendingDoc(document, request);
    const commit = await this.centrifugeService.pullForJobComplete(commitResp.commitResult.header.job_id, request.user.account);
    if (commit.status === 'success') {
      const updateResult: Document = await this.centrifugeService.documents.updateDocument(
          request.user.account,
          cloneResult.header.document_id,
          {
            attributes: document.attributes,
            scheme: CoreapiCreateDocumentRequest.SchemeEnum.Generic,
          },
      );
      return await this.updateDBDoc(updateResult, commitResp.dbId, request.user.account);
    }
  }

  @Get()
  /**
   * Get the list of all documents
   * @async
   * @return {Promise<DocumentRequest[]>} result
   */
  async getList(@Req() request): Promise<Document[]> {
    return this.databaseService.documents.getCursor({
      ownerId: request.user._id,
    }).sort({ updatedAt: -1 }).exec();
  }

  @Get(':id')
  /**
   * Get a specific Doc by id
   * @async
   * @param params - the request parameters
   * @param request - the http request
   * @return {Promise<Document|null>} result
   */
  async getById(@Param() params, @Req() request): Promise<Document | null> {

    const document = await this.getDocFromDB(params.id);

    try {
      const docFromNode = await this.centrifugeService.documents.getDocument(request.user.account, document.header.document_id);
      return {
        _id: document._id,
        ...docFromNode,
        attributes: {
          ...unflatten(docFromNode.attributes),
        },
      };
    } catch (error) {
      return document;
    }
  }

  /**
   * Updates a doc and saves in the centrifuge node and local database
   * @async
   * @param {Param} params - the query params
   * @param {Param} request - the http request
   * @param {Document} updateDocRequest - the updated doc
   * @return {Promise<DocumentRequest>} result
   */
  @Put(':id')
  async updateById(
    @Param() params,
    @Req() request,
    @Body() updateDocRequest: Document,
  ) {

    const documentFromDb: Document = await this.getDocFromDB(params.id);
    const header: CoreapiResponseHeader = updateDocRequest.header;

    // Node does not support signed attributes
    delete updateDocRequest.attributes.funding_agreement;

    const updateResult: Document = await this.centrifugeService.documents.updateDocument(
      request.user.account,
        documentFromDb.header.document_id,
      {
        attributes: updateDocRequest.attributes,
        read_access: header ? header.read_access : [],
        write_access: header ? header.write_access : [],
        scheme: CoreapiCreateDocumentRequest.SchemeEnum.Generic,
      },
    );

    await this.centrifugeService.pullForJobComplete(updateResult.header.job_id, request.user.account);
    const unflattenAttr = unflatten(updateResult.attributes);

    return await this.databaseService.documents.updateById(params.id, {
      $set: {
        header: updateResult.header,
        data: updateResult.data,
        attributes: unflattenAttr,
      },
    });
  }

}
