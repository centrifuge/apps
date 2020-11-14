import {
  Body,
  Controller, ForbiddenException,
  Get,
  NotFoundException,
  Param,
  Post,
  Put,
  Req,
  UseGuards,
} from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { CentrifugeService } from '../centrifuge-client/centrifuge.service';
import {
  CoreapiAttributeResponse,
  CoreapiCreateDocumentRequest,
  CoreapiDocumentResponse,
  CoreapiResponseHeader } from '@centrifuge/gateway-lib/centrifuge-node-client';
import {
  Document,
  DocumentStatus,
  NftStatus,
} from '@centrifuge/gateway-lib/models/document';
import { ROUTES } from '@centrifuge/gateway-lib/utils/constants';
import { SessionGuard } from '../auth/SessionGuard';
import { unflatten } from '@centrifuge/gateway-lib/utils/custom-attributes';
import { User } from '@centrifuge/gateway-lib/models/user';
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
  ) {}

  async getDocFromDB(docId: string): Promise<Document> {
    const documentFromDb: Document = await this.databaseService.documents.findOne(
      { _id: docId },
    );

    if (!documentFromDb)
      throw new NotFoundException(
        `Can not find document #${docId} in the database`,
      );
    return documentFromDb;
  }

  async commitDoc(document: Document, user: User) {
    if(!document._id)  {
      throw new ForbiddenException('Document must be first inserted in the database')
    }
    const commitResult = await this.centrifugeService.documents.commitDocumentV2(
      user.account,
      document.header.document_id,
    );

    const updated = await this.centrifugeService.pullForJobComplete(
      commitResult.header.job_id,
      user.account,
    );
    await this.databaseService.documents.update({'header.document_id': document.header.document_id}, {
      $set: {
        document_status:
          updated.status === 'success'
            ? DocumentStatus.Created
            : DocumentStatus.CreationFail,
      },
    });
    return commitResult
  }

  async saveDoc(document: Document, user: User) {
    const createResult: Document = await this.centrifugeService.documents.createDocumentV2(
      user.account,
      {
        attributes: document.attributes,
        read_access: document.header.read_access
          ? document.header.read_access
          : [],
        write_access: document.header.write_access
          ? document.header.write_access
          : [],
        scheme: CoreapiCreateDocumentRequest.SchemeEnum.Generic,
      },
    );

    return  await this.databaseService.documents.insert({
      ...createResult,
      attributes: unflatten(createResult.attributes),
      ownerId: user._id,
      document_status: DocumentStatus.Creating,
      nft_status: NftStatus.NoNft,
      organizationId: user.account,
    });
  }

  async cloneDoc(document: Document, template, user: User) {
    const cloneResult: Document = await this.centrifugeService.documents.cloneDocumentV2(
      user.account,
      {
        scheme: SchemeEnum.Generic,
      },
      template,
    );

    const updateResult: Document = await this.centrifugeService.documents.updateDocumentV2(
      user.account,
      {
        attributes: document.attributes,
        scheme: SchemeEnum.Generic,
      },
      cloneResult.header.document_id,
    );

    return  await this.databaseService.documents.insert({
      ...updateResult,
      ownerId: user._id,
      document_status: DocumentStatus.Creating,
      nft_status: NftStatus.NoNft,
      organizationId: user.account,
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
    return  await this.saveDoc(payload, request.user)
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
    return await this.cloneDoc(document,params.id,request.user);
  }

  @Put(':id/commit')
  /**
   * Anchor a document on chain
   * @async
   * @param {Param} params - the query params
   * @param request - the http request
   * @return {Promise<Document>} result
   */
  async commit(
    @Req() request,
    @Param() params,
  ): Promise<Document> {
    const doc = await this.getDocFromDB(params.id);
    return this.commitDoc(doc, request.user)
  }

  @Get()
  /**
   * Get the list of all documents
   * @async
   * @return {Promise<DocumentRequest[]>} result
   */
  async getList(@Req() request): Promise<Document[]> {
    return this.databaseService.documents
      .getCursor({
        organizationId: request.user.account,
      })
      .sort({ updatedAt: -1 })
      .exec();
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
      const docFromNode = await this.centrifugeService.documents.getDocument(
        request.user.account,
        document.header.document_id,
      );
      return {
        ...document,
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

    await this.centrifugeService.pullForJobComplete(
      updateResult.header.job_id,
      request.user.account,
    );
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
