import { Body, Controller, Post } from '@nestjs/common';
import { ROUTES } from '../../../src/common/constants';
import { FunFundingListResponse, NotificationNotificationMessage } from '../../../clients/centrifuge-node';
import { DatabaseService } from '../database/database.service';
import config from '../../../src/common/config';
import { CentrifugeService } from '../centrifuge-client/centrifuge.service';
import { InvoiceResponse } from '../../../src/common/interfaces';

export const documentTypes = {
  invoice:
    'http://github.com/centrifuge/centrifuge-protobufs/invoice/#invoice.InvoiceData',
  purchaseOrder:
    'http://github.com/centrifuge/centrifuge-protobufs/purchaseorder/#purchaseorder.PurchaseOrderData',
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
  async receiveMessage(@Body() notification: NotificationNotificationMessage) {

    if (notification.event_type === eventTypes.DOCUMENT) {
      // Search for the user in the database
      const user = await this.databaseService.users.findOne({ account: notification.to_id });
      if (!user) {
        return 'User is not present in database';
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

        if (invoice.data.attributes && invoice.data.attributes.funding_agreement) {
          const fundingList: FunFundingListResponse = await this.centrifugeService.funding.getList(invoice.header.document_id, user.account);
          invoice.fundingAgreement = (fundingList.data ? fundingList.data.shift() : undefined);
          // We need to delete the attributes prop because nedb does not allow for . in field names
          delete invoice.data.attributes;
        }
        await this.databaseService.invoices.update(
          { 'header.document_id': notification.document_id, 'ownerId': user._id },
          invoice,
          { upsert: true },
        );

      } else if (notification.document_type === documentTypes.purchaseOrder) {
        const result = await this.centrifugeService.purchaseOrders.get(
          notification.document_id,
          user.account,
        );
        await this.databaseService.purchaseOrders.insert(result);
      }
    }

    return 'OK';
  }
}
