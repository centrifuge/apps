import { Body, Controller, Get, NotFoundException, Param, Post, Put, Req, UseGuards } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { CentrifugeService } from '../centrifuge-client/centrifuge.service';
import {CoreapiCreateDocumentRequest, CoreapiDocumentResponse} from '@centrifuge/gateway-lib/centrifuge-node-client';
import {Document, DocumentRequest, DocumentStatus, NftStatus} from '@centrifuge/gateway-lib/models/document';
import { ROUTES } from '@centrifuge/gateway-lib/utils/constants';
import { SessionGuard } from '../auth/SessionGuard';
import { unflatten } from '@centrifuge/gateway-lib/utils/custom-attributes';

@Controller(ROUTES.DOCUMENTS)
@UseGuards(SessionGuard)
export class DocumentsController {
  constructor(
    private readonly databaseService: DatabaseService,
    private readonly centrifugeService: CentrifugeService,
  ) {
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
          type: 'bytes',
          value: request.user.account,
        },
      },
    };

    const createResult: Document = await this.centrifugeService.documents.createDocumentV2(
      request.user.account,
      {
        attributes: payload.attributes,
        // @ts-ignore
        read_access: payload.header.read_access ? payload.header.read_access : [],
        // @ts-ignore
        write_access: payload.header.write_access ? payload.header.write_access : [],
        scheme: CoreapiCreateDocumentRequest.SchemeEnum.Generic,
      },
    );

    createResult.document_status = DocumentStatus.Creating;
    createResult.nft_status = NftStatus.NoNft;

    const created = await this.databaseService.documents.insert({
      ...createResult,
      ownerId: request.user._id,
    });
    const createAttributes = unflatten(createResult.attributes);
    createResult.attributes = createAttributes;
    const commitResult = await this.centrifugeService.documents.commitDocumentV2(
        request.user.account,
        // @ts-ignore
        createResult.header.document_id,
    );

    // @ts-ignore
    const commit = await this.centrifugeService.pullForJobComplete(commitResult.header.job_id, request.user.account);
    if (commit.status === 'success') {
      return await this.databaseService.documents.updateById(created._id, {
        $set: {
          document_status: DocumentStatus.Created,
        },
      });
    } else {
      return await this.databaseService.documents.updateById(created._id, {
        $set: {
          document_status: DocumentStatus.CreationFail,
        },
      });
    }
  }

  @Get()
  /**
   * Get the list of all documents
   * @async
   * @return {Promise<DocumentRequest[]>} result
   */
  async getList(@Req() request): Promise<Document[]> {
    const documents = this.databaseService.documents.getCursor({
      ownerId: request.user._id,
    }).sort({ updatedAt: -1 }).exec();
    return documents;
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

    const document = await this.databaseService.documents.findOne({
      _id: params.id,
      ownerId: request.user._id,
    });

    if (!document) throw new NotFoundException('Document not found');
    try {
      // @ts-ignore
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
    @Body() document: Document,
  ) {

    const documentFromDb: Document = await this.databaseService.documents.findOne(
      { _id: params.id },
    );

    if (!documentFromDb) throw new NotFoundException(`Can not find document #${params.id} in the database`);

    // Node does not support signed attributes
    delete document.attributes.funding_agreement;

    const updateResult: Document = await this.centrifugeService.documents.updateDocument(
      request.user.account,
        // @ts-ignore
        documentFromDb.header.document_id,
      {
        attributes: document.attributes,
        // @ts-ignore
        read_access: document.header ? document.header.read_access : [],
        // @ts-ignore
        write_access: document.header ? document.header.write_access : [],
        scheme: CoreapiCreateDocumentRequest.SchemeEnum.Generic,
      },
    );

    // @ts-ignore
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
