import { Body, Controller, Post } from '@nestjs/common';
import { ROUTES } from '../../../src/common/constants';
import { NotificationNotificationMessage } from '../../../clients/centrifuge-node';
import { DatabaseService } from '../database/database.service';
import config from '../config';
import { CentrifugeService } from '../centrifuge-client/centrifuge.service';

export const documentTypes = {
  invoice:
    'http://github.com/centrifuge/centrifuge-protobufs/invoice/#invoice.InvoiceData',
  purchaseOrder:
    'http://github.com/centrifuge/centrifuge-protobufs/purchaseorder/#purchaseorder.PurchaseOrderData',
};

export const eventTypes = {
  success: 1,
  error: 0,
};

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
  async receiveMessage(@Body() notification: NotificationNotificationMessage) {
    if (notification.event_type === eventTypes.success) {
      if (notification.document_type === documentTypes.invoice) {
        const result = await this.centrifugeService.invoices.get(
          notification.document_id,
          config.admin.account,
        );
        await this.databaseService.invoices.insert(result);
      } else if (notification.document_type === documentTypes.purchaseOrder) {
        const result = await this.centrifugeService.purchaseOrders.get(
          notification.document_id,
          config.admin.account,
        );
        await this.databaseService.purchaseOrders.insert(result);
      }
    }

    return 'OK';
  }
}
