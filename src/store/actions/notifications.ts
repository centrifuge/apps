import { NOTIFICATION } from '../../notifications/NotificationContext';
import { Action } from 'redux';

export const NOTIFICATION_ALERT_ERROR = 'NOTIFICATION_ALERT_ERROR';
export const NOTIFICATION_ALERT_CLOSE = 'NOTIFICATION_ALERT_CLOSE';
export const NOTIFICATION_ALERT_WARNING = 'NOTIFICATION_ALERT_WARNING';
export const NOTIFICATION_ALERT_SUCCESS = 'NOTIFICATION_ALERT_SUCCESS';
export const NOTIFICATION_ALERT_DEFAULT = 'NOTIFICATION_ALERT_DEFAULT';


export type AlertOptions = {
  onConfirmAction?: Action,
  onCloseAction?: Action,
}

export type AlertPayload = {
  type: NOTIFICATION
  title: string,
  message: string,
  options?: AlertOptions
}


export const alertError = (title: string, message: string, options?: AlertOptions) => {
  return {
    type: NOTIFICATION_ALERT_ERROR,
    payload: {
      type: NOTIFICATION.ERROR,
      title,
      message,
      options,
    },
  };
};


export const closeAlert = (action?: Action) => {
  return {
    type: NOTIFICATION_ALERT_CLOSE,
    payload: action,
  };
};
