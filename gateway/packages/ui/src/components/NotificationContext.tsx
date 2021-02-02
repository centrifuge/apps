import React, { Component } from 'react';
import { Modal } from '@centrifuge/axis-modal';
import { Box, Button, Paragraph } from 'grommet';

export enum NOTIFICATION {
  DEFAULT = 'NOTIFICATION.DEFAULT',
  SUCCESS = 'NOTIFICATION.SUCCESS',
  WARNING = 'NOTIFICATION.WARNING',
  ERROR = 'NOTIFICATION.ERROR',
}


export type NotificationApi = {
  notify: (options: NotificationOptions) => void;
  alert: (options: AlertOptions) => void;
  close: () => void;
}

let CONTEXT_API: NotificationApi = {
  notify: (options: NotificationOptions) => {
  },
  alert: (options: AlertOptions) => {
  },
  close: () => {
  },

};

export const NotificationContext = React.createContext(CONTEXT_API);
export const NotificationConsumer = NotificationContext.Consumer;

export interface NotificationState {
  opened: boolean,
  options: NotificationOptions
}


export interface AlertOptions {
  title?: string,
  message?: string,
  cancelable?: boolean, // modal can self close(x icon and click outside)
  type?: NOTIFICATION, // DEFAULT, SUCCESS, ERROR, WARNING
  confirmLabel?: string, // Label for the modal button
  onClose?: () => void, // callback for when the modal is closed.
  onConfirm?: () => void, // callback for when the modal is closed.
}

export interface NotificationOptions {
  title?: string,
  message?: string,
  cancelable?: boolean, // modal can self close(x icon and click outside)
  type?: NOTIFICATION, // DEFAULT, SUCCESS, ERROR, WARNING
  confirmLabel?: string, // Label for the modal button
  onClose?: () => void, // callback for when the modal is closed.
  onConfirm?: () => void, // callback for when the modal is closed.
}


const DEFAULT_STATE: NotificationState = {
  opened: false,
  options: {
    title: '',
    message: '',
    cancelable: true,
    type: NOTIFICATION.DEFAULT,
    confirmLabel: 'OK',
  },
};

export class NotificationProvider extends Component<{}, NotificationState> {
  state = DEFAULT_STATE;

  constructor(props) {
    super(props);
    this.state = {
      ...DEFAULT_STATE,
    };

    CONTEXT_API = {
      notify: this.notify,
      alert: this.alert,
      close: this.close,
    };

  }


  alert = (options: AlertOptions) => {
    this.setState({
      opened: true,
      options: {
        ...this.state.options,
        ...options,
      },
    });
  };

  notify = (options: NotificationOptions) => {
    this.setState({
      opened: true,
      options: {
        ...this.state.options,
        ...options,
      },
    });
  };

  close = () => {
    this.state.options.onClose && this.state.options.onClose();
    this.setState(DEFAULT_STATE);
  };

  confirm = () => {
    this.state.options.onConfirm && this.state.options.onConfirm();
    this.close();
  };

  render() {
    const { children } = this.props;
    const { opened, options } = this.state;

    let modalProps: any = {
      headingProps: {
        level: 3,
        color: '',
      },
    };
    // Add close button to modal
    if (options.cancelable) {
      modalProps.onClose = this.close;
    }

    // default notification content.
    let modalContent = <Paragraph>
      {options.message}
    </Paragraph>;
    // default notification actions
    // We can extend to add more actions but we must be very careful at the keys
    let actions =  [
      <Button key={options.confirmLabel} primary label={options.confirmLabel} fill={false} onClick={this.confirm}/>
    ]

    // Compute the color of the modal title
    switch (options.type) {
      case NOTIFICATION.SUCCESS:
        modalProps.headingProps.color = 'status-ok';
        break;
      case NOTIFICATION.ERROR:
        modalProps.headingProps.color = 'status-error';
        break;
      case NOTIFICATION.WARNING:
        modalProps.headingProps.color = 'status-warning';
        break;

      default:
        actions = [];
        break
    }


    return (
      <NotificationContext.Provider
        value={CONTEXT_API}
      >
        <Modal
          opened={opened}
          title={options.title}
          {...modalProps}
        >
          <Box>
            {modalContent}
          </Box>

          <Box direction="row" gap="medium" justify={'end'}>
            {actions}
          </Box>
        </Modal>
        {children}
      </NotificationContext.Provider>
    );
  }
}

