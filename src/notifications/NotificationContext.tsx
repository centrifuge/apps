import React, { Component } from 'react';
import { Modal } from '@centrifuge/axis-modal';
import { Box, Button, Paragraph } from 'grommet';

export enum NOTIFICATION {
  DEFAULT = 'NOTIFICATION.DEFAULT',
  SUCCESS = 'NOTIFICATION.SUCCESS',
  WARNING = 'NOTIFICATION.WARNING',
  ERROR = 'NOTIFICATION.ERROR',
}


const CONTEXT_API = {
  notify: (title: string, message: string, options: NotificationOptions = {}) => {
  },
  close: () => {
  },

};

export const NotificationContext = React.createContext(CONTEXT_API);
export const NotificationConsumer = NotificationContext.Consumer;

interface NotificationState {
  opened: boolean,
  title: string,
  message: string,
  options: NotificationOptions
}

interface NotificationOptions {
  cancelable?: boolean, // modal can self close(x icon and click outside)
  type?: NOTIFICATION, // DEFAULT, SUCCESS, ERROR, WARNING
  confirmLabel?: string, // Label for the modal button
  onClose?: () => void, // callback for when the modal is closed.
  onConfirm?: () => void, // callback for when the modal is closed.
}


const DEFAULT_STATE: NotificationState = {
  opened: false,
  title: '',
  message: '',
  options: {
    cancelable: true,
    type: NOTIFICATION.DEFAULT,
    confirmLabel: 'OK',
  },
};

export class NotificationProvider extends Component<{}, NotificationState> {
  state = DEFAULT_STATE;

  constructor(props) {
    super(props);
  }

  notify = (title: string, message: string, options: NotificationOptions = {}) => {
    this.setState({
      opened: true,
      title,
      message,
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
    const { opened, title, message, options } = this.state;
    // TODO this can be exposed as provider values
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
    }

    return (
      <NotificationContext.Provider
        value={
          {
            notify: this.notify,
            close: this.close,
          }
        }
      >
        <Modal
          opened={opened}
          width={'medium'}
          title={title}
          {...modalProps}
        >
          <Box width={'medium'}>
            <Paragraph>
              {message}
            </Paragraph>
          </Box>

          <Box direction="row" gap="medium" justify={'end'}>
            <Button primary label={options.confirmLabel || 'OK'} fill={false} onClick={this.confirm}/>
          </Box>
        </Modal>
        {children}
      </NotificationContext.Provider>
    );
  }
}

