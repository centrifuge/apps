import { Body, Controller, Post } from '@nestjs/common';
import { ROUTES } from '../../../src/common/constants';
import {
  FunFundingListResponse,
  NotificationNotificationMessage,
  UserapiTransferDetailListResponse,
} from '../../../clients/centrifuge-node';
import { DatabaseService } from '../database/database.service';
import { CentrifugeService } from '../centrifuge-client/centrifuge.service';
import { InvoiceResponse } from '../../../src/common/interfaces';
import { Document } from "../../../src/common/models/document";
import { unflatten } from "../../../src/common/custom-attributes";

export const documentTypes = {
  invoice:
    'http://github.com/centrifuge/centrifuge-protobufs/invoice/#invoice.InvoiceData',
  purchaseOrder:
    'http://github.com/centrifuge/centrifuge-protobufs/purchaseorder/#purchaseorder.PurchaseOrderData',
  genericDocument:
    'http://github.com/centrifuge/centrifuge-protobufs/generic/#generic.Generic',
};

export const eventTypes = {
  DOCUMENT: 1,
  JOB: 1,
  ERROR: 0,
};

@Controller(ROUTES.WEBHOOKS)
export class WebhooksController {
  constructor(
    private readonly centrifugeService: CentrifugeService,
    private readonly databaseService: DatabaseService,
  ) {
  }

  /**
   * Webhook endpoint for processing notifications from the centrifuge node.
   * Currently using ts-ignore due to casing issue with swagger definitions.
   * @param notification NotificationNotificationMessage - received notification
   */
  @Post()
  // TODO: refactor/rethink to remove code duplication in functionality
  async receiveMessage(@Body() notification: NotificationNotificationMessage) {
    console.log('Receive Webhook', notification);
    try {
      if (notification.event_type === eventTypes.DOCUMENT) {
        // Search for the user in the database
        const user = await this.databaseService.users.findOne({ $or: [{ account: notification.to_id.toLowerCase() }, { account: notification.to_id }] });
        if (!user) {
          throw new Error('User is not present in database');
        }
        if (notification.document_type === documentTypes.invoice) {
          const result = await this.centrifugeService.invoices.get(
            notification.document_id,
            user.account,
          );

          const invoice: InvoiceResponse = {
            ...result,
            ownerId: user._id,
          };
          if (invoice.attributes) {
            if (invoice.attributes.funding_agreement) {
              const fundingList: FunFundingListResponse = await this.centrifugeService.funding.getList(invoice.header.document_id, user.account);
              invoice.fundingAgreement = (fundingList.data ? fundingList.data.shift() : undefined);
            }
            if (invoice.attributes.transfer_details) {
              const transferList: UserapiTransferDetailListResponse = await this.centrifugeService.transfer.listTransferDetails(user.account, invoice.header.document_id);
              invoice.transferDetails = (transferList ? transferList.data : undefined);
            }

            // We need to delete the attributes prop because nedb does not allow for . in field names
            delete invoice.attributes;
          }

          await this.databaseService.invoices.update(
            { 'header.document_id': notification.document_id, 'ownerId': user._id },
            invoice,
            { upsert: true },
          );
          // TODO this should be similar to invoices. We do not care for now.
        } else if (notification.document_type === documentTypes.purchaseOrder) {
          const result = await this.centrifugeService.purchaseOrders.get(
            notification.document_id,
            user.account,
          );
          await this.databaseService.purchaseOrders.insert(result);
          // FlexDocs
        } else if (notification.document_type === documentTypes.genericDocument) {
          const result = await this.centrifugeService.documents.getDocument(
              user.account,
              notification.document_id,
          );

          const unflattenedAttributes = unflatten(result.attributes)
          await this.databaseService.documents.update(
              { 'header.document_id': notification.document_id, 'ownerId': user._id },
              {$set: {
                ownerId: user._id,
                header: result.header,
                data: result.data,
                attributes: unflattenedAttributes,
                scheme: result.scheme,
              }},
              { upsert: true },
          );
        }
      }
    } catch (e) {
      throw new Error(`Webhook Error: ${e.message}`);
    }
    return 'OK';
  }
}
