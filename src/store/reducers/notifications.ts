import { AlertPayload, NOTIFICATION_ALERT_CLOSE, NOTIFICATION_ALERT_ERROR } from '../actions/notifications';

export type NotificationsState = {
  alert: AlertPayload | null;

};

const defaultState: NotificationsState = {
  alert: null,
};

const notifications = (
  state: NotificationsState = defaultState,
  { type, payload = null },
): NotificationsState => {
  switch (type) {

    case NOTIFICATION_ALERT_ERROR: {
      return {
        ...state,
        alert: payload,
      };
    }

    case NOTIFICATION_ALERT_CLOSE: {
      return {
        ...state,
        alert: null,
      };
    }

    default:
      return state;

  }
};

export default notifications;
