import { Body, Controller, Inject, Post } from '@nestjs/common';
import { ROUTES } from '../../../src/common/constants';
import {
  DocumentServiceApi,
  NotificationNotificationMessage,
} from '../../../clients/centrifuge-node/generated-client';
import { tokens } from '../centrifuge-client/centrifuge.constants';
import { tokens as databaseTokens } from '../database/database.constants';
import { DatabaseProvider } from '../database/database.providers';

export const documentTypes = {
  invoice:
    'http://github.com/centrifuge/centrifuge-protobufs/invoice/#invoice.InvoiceData',
};

export const eventTypes = {
  success: 1,
  error: 0,
};

@Controller(ROUTES.WEBHOOKS)
export class WebhooksController {
  constructor(
    @Inject(tokens.centrifugeClientFactory)
    private readonly centrifugeClient: DocumentServiceApi,
    @Inject(databaseTokens.databaseConnectionFactory)
    private readonly databaseService: DatabaseProvider,
  ) {}

  /**
   * Webhook endpoint for processing notifications from the centrifuge node.
   * Currently using ts-ignore due to casing issue with swagger definitions.
   * @param notification NotificationNotificationMessage - received notification
   */
  @Post()
  async receiveMessage(@Body() notification: NotificationNotificationMessage) {
    if (
      // @ts-ignore
      notification.documentType === documentTypes.invoice &&
      // @ts-ignore
      notification.eventType === eventTypes.success
    ) {
      //@ts-ignore
      const result = await this.centrifugeClient.get(notification.documentId);
      await this.databaseService.invoices.create(result);
    }

    return 'OK';
  }
}
