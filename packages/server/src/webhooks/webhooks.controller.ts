import { Body, Controller, Post } from '@nestjs/common';
import { ROUTES } from '@centrifuge/gateway-lib/utils/constants';
import { NotificationMessage } from '@centrifuge/gateway-lib/centrifuge-node-client';
import { DatabaseService } from '../database/database.service';
import { CentrifugeService } from '../centrifuge-client/centrifuge.service';
import { unflatten } from '@centrifuge/gateway-lib/utils/custom-attributes';

// TODO add this in Common package
export enum DocumentTypes {
  INVOICE = 'http://github.com/centrifuge/centrifuge-protobufs/invoice/#invoice.InvoiceData',
  PURCHASE_ORDERS = 'http://github.com/centrifuge/centrifuge-protobufs/purchaseorder/#purchaseorder.PurchaseOrderData',
  GENERIC_DOCUMENT = 'http://github.com/centrifuge/centrifuge-protobufs/generic/#generic.Generic',
}

export enum EventTypes {
  DOCUMENT = 1,
  JOB = 1,
  ERROR = 0,
}

@Controller(ROUTES.WEBHOOKS)
export class WebhooksController {
  constructor(
    private readonly centrifugeService: CentrifugeService,
    private readonly databaseService: DatabaseService,
  ) {}

  /**
   * Webhook endpoint for processing notifications from the centrifuge node.
   * Currently using ts-ignore due to casing issue with swagger definitions.
   * @param notification NotificationNotificationMessage - received notification
   */
  @Post()
  // TODO: refactor/rethink to remove code duplication in functionality
  async receiveMessage(@Body() notification: NotificationMessage) {
    console.log('Receive Webhook', notification);
    try {
      if (notification.event_type === EventTypes.DOCUMENT) {
        // Search for the user in the database
        const user = await this.databaseService.users.findOne({
          $or: [
            { account: notification.to_id!.toLowerCase() },
            { account: notification.to_id },
          ],
        });
        if (!user) {
          throw new Error('User is not present in database');
        }

        if (notification.document_type === DocumentTypes.GENERIC_DOCUMENT) {
          console.log(
            `received webhook notification for document_id ${notification.document_id}`,
            notification,
          );
          const result = await this.centrifugeService.documents.getDocument(
            user.account,
            notification.document_id!,
          );

          console.log(
            `found document for document_id ${notification.document_id}, organizationId: ${user.account}`,
            result,
          );

          const unflattenedAttributes = unflatten(result.attributes);
          const updated = await this.databaseService.documents.update(
            {
              'header.document_id': notification.document_id,
              organizationId: user.account,
            },
            {
              $set: {
                ownerId: user._id,
                organizationId: user.account,
                header: result.header,
                data: result.data,
                attributes: unflattenedAttributes,
                scheme: result.scheme,
                fromId: notification.from_id,
              },
            },
            { upsert: true, returnUpdatedDocs: true },
          );

          if (typeof updated === 'number') {
            console.log(`updated document with result ${updated}`);
          } else {
            console.log(`updated documents`, updated);
          }
        } else {
          throw new Error(
            `Document type ${notification.document_type} not supported`,
          );
        }
      }
    } catch (e) {
      throw new Error(`Webhook Error: ${e.message}`);
    }
    return 'OK';
  }
}
