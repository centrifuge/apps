import { AlertPayload, closeAlert } from '../store/actions/notifications';
import { NotificationContext } from './NotificationContext';
import { connect } from 'react-redux';
import React from 'react';

export type NotificationsProps = {
  alert: AlertPayload,
  closeAlert: typeof closeAlert,
}


export class Notifications extends React.Component<NotificationsProps> {
  render() {

    const { alert, closeAlert } = this.props;
    const { notify } = this.context;
    setTimeout(()=> {
      if (alert) {
        const { title, type, message, options } = alert;
        notify({
          type,
          title,
          message,
          confirmLabel: 'Ok',
          onConfirm: () => {
            closeAlert(options!.onConfirmAction);
          },
        });
      }
    },0)


    return (
      <></>
    );
  }
}


Notifications.contextType = NotificationContext;

const mapStateToProps = (state) => {
  return {
    alert: state.notifications.alert,
  };
};


export const ConnectedNotifications = connect(
  mapStateToProps,
  {
    closeAlert,
  },
)(Notifications);

export default ConnectedNotifications;
