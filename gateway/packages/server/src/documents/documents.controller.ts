import {
  CoreapiAttributeResponse,
  CoreapiDocumentResponse,
  CoreapiResponseHeader,
  V2CreateDocumentRequest as CoreapiCreateDocumentRequest,
} from '@centrifuge/gateway-lib/centrifuge-node-client'
import { Document, DocumentStatus, NftStatus } from '@centrifuge/gateway-lib/models/document'
import { User } from '@centrifuge/gateway-lib/models/user'
import { ROUTES } from '@centrifuge/gateway-lib/utils/constants'
import { unflatten } from '@centrifuge/gateway-lib/utils/custom-attributes'
import {
  Body,
  Controller,
  Get,
  MethodNotAllowedException,
  NotFoundException,
  Param,
  Post,
  Put,
  Req,
  UseGuards,
} from '@nestjs/common'
import { merge } from 'lodash'
import { JwtAuthGuard } from '../auth/jwt-auth.guard'
import { CentrifugeService } from '../centrifuge-client/centrifuge.service'
import { DatabaseService } from '../database/database.service'
import TypeEnum = CoreapiAttributeResponse.TypeEnum
import SchemeEnum = CoreapiDocumentResponse.SchemeEnum

export class CommitResp {
  commitResult: Document
  dbId: string
}

@Controller(ROUTES.DOCUMENTS)
@UseGuards(JwtAuthGuard)
export class DocumentsController {
  constructor(
    private readonly databaseService: DatabaseService,
    private readonly centrifugeService: CentrifugeService
  ) {}

  async getDocFromDB(docId: string): Promise<Document> {
    const documentFromDb: Document = await this.databaseService.documents.findOne({ _id: docId })

    if (!documentFromDb) throw new NotFoundException(`Can not find document #${docId} in the database`)
    return documentFromDb
  }

  async commitDoc(document: Document, user: User) {
    if (!document._id) {
      throw new MethodNotAllowedException('Document must be first inserted in the database')
    }

    const commitResult = await this.centrifugeService.documents.commitDocumentV2(
      user.account,
      document.header.document_id
    )

    const { jobStatus } = await this.centrifugeService.pullForJobComplete(commitResult.header.job_id, user.account)

    const updatedDocs = await this.databaseService.documents.update(
      {
        'header.document_id': document.header.document_id,
        organizationId: user.account.toLowerCase(),
      },
      {
        $set: {
          document_status: jobStatus ? DocumentStatus.Created : DocumentStatus.CreationFail,
        },
      },
      {
        multi: true,
        returnUpdatedDocs: true,
      }
    )

    return commitResult
  }
  /*
   * Can create a new doc or creates a new version of a doc
   * When a new version is created it updated the gateway db
   * */
  async saveDoc(document: Document, user: User) {
    let payload: any = {
      document_id: document.document_id,
      attributes: document.attributes,

      scheme: CoreapiCreateDocumentRequest.SchemeEnum.Generic,
    }

    if (document.header && document.header.readAccess) {
      payload = {
        ...payload,
        readAccess: document.header.readAccess,
      }
    }

    if (document.header && document.header.writeAccess) {
      payload = {
        ...payload,
        writeAccess: document.header.writeAccess,
      }
    }

    const createResult: Document = await this.centrifugeService.documents.createDocumentV2(payload, user.account)

    const updated = (await this.databaseService.documents.update(
      {
        'header.document_id': createResult.header.document_id,
        organizationId: user.account.toLowerCase(),
      },
      {
        ...createResult,
        attributes: unflatten(createResult.attributes),
        ownerId: user._id,
        // We use save doc also for update when we create a new version
        // In that case wo will not set this to Creating
        document_status: !document.document_status ? DocumentStatus.Creating : document.document_status,
        nft_status: NftStatus.NoNft,
        organizationId: user.account.toLowerCase(),
      },
      {
        returnUpdatedDocs: true,
        upsert: true,
      }
    )) as Document

    return updated
  }

  async cloneDoc(document: Document, template, user: User) {
    const cloneResult: Document = await this.centrifugeService.documents.cloneDocumentV2(
      {
        scheme: SchemeEnum.Generic,
      },
      user.account,
      template
    )

    /*
     * We add the document attributes in the database on clone even if the doc
     * does not have this on the node for a better UX.
     * At the moment a commit is required before and new version and this takes
     * time and blocks the interface
     * TODO this should be removed when we do not require a commit before each update
     * */
    const mergedDoc: Document = merge(cloneResult, document)
    const inserted = await this.databaseService.documents.insert({
      ...mergedDoc,
      ownerId: user._id,
      document_status: DocumentStatus.Creating,
      nft_status: NftStatus.NoNft,
      organizationId: user.account.toLowerCase(),
    })

    return inserted
  }

  @Post()
  /**
   * Creates a generic document or a new version and saves in the local database
   * If the document has a document_id prop it will create a new version
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
    }

    return await this.saveDoc(payload, request.user)
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
  async clone(@Req() request, @Body() document: Document, @Param() params): Promise<Document> {
    return await this.cloneDoc(document, params.id, request.user)
  }

  @Put(':id/commit')
  /**
   * Anchor a document on chain
   * @async
   * @param {Param} params - the query params
   * @param request - the http request
   * @return {Promise<Document>} result
   */
  async commit(@Req() request, @Param() params): Promise<Document> {
    const doc = await this.getDocFromDB(params.id)
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
        $or: [{ organizationId: { $regex: new RegExp(request.user.account, 'i') } }],
      })
      .sort({ createdAt: -1 })
      .exec()
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
    const document = await this.getDocFromDB(params.id)

    try {
      const docFromNode = await this.centrifugeService.documents.getCommittedDocument(
        request.user.account,
        document.header.document_id
      )

      docFromNode.attributes = {
        ...unflatten(docFromNode.attributes),
      }
      /*
       * Each time we load a doc for the doc update the gateway db.
       * The node is the source of truth for header and attributes
       * and it can happen that the webhook is not called
       * */
      const docs: any = await this.databaseService.documents.update(
        {
          'header.document_id': docFromNode.header.document_id,
          organizationId: request.user.account.toLowerCase(),
        },
        {
          $set: {
            attributes: docFromNode.attributes,
            header: docFromNode.header,
          },
        },
        {
          multi: true,
          returnUpdatedDocs: true,
        }
      )
      return docs.find((doc) => doc._id === params.id)
    } catch (error) {
      return document
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
  async updateById(@Param() params, @Req() request, @Body() updateDocRequest: Document) {
    const documentFromDb: Document = await this.getDocFromDB(params.id)

    // Node does not support signed attributes
    delete updateDocRequest.attributes.funding_agreement

    const mergedDoc: Document = merge(documentFromDb, updateDocRequest)
    const header: CoreapiResponseHeader = mergedDoc.header
    const updateResult: Document = await this.centrifugeService.documents.updateDocumentV2(
      {
        attributes: mergedDoc.attributes,
        readAccess: header ? header.readAccess : [],
        writeAccess: header ? header.writeAccess : [],
        scheme: SchemeEnum.Generic,
      },
      request.user.account,
      documentFromDb.header.document_id
    )
    const unflattenAttr = unflatten(updateResult.attributes)
    return await this.databaseService.documents.updateById(params.id, {
      $set: {
        header: updateResult.header,
        data: updateResult.data,
        attributes: unflattenAttr,
      },
    })
  }
}
