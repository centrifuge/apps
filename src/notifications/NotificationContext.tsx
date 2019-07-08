import React, { Component } from 'react';
import { Modal } from '@centrifuge/axis-modal';
import { Box, Button, Paragraph } from 'grommet';

export enum NOTIFICATION {
  DEFAULT = 'NOTIFICATION.DEFAULT',
  SUCCESS = 'NOTIFICATION.SUCCESS',
  WARNING = 'NOTIFICATION.WARNING',
  ERROR = 'NOTIFICATION.ERROR',
}


type NotificationApi = {
  notify: (options: NotificationOptions) => void;
  close: () => void;
}

let CONTEXT_API: NotificationApi = {
  notify: (options: NotificationOptions) => {
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
      close: this.close,
    };

  }

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

    // default notification content.
    let modalContent = <Paragraph>
      {options.message}
    </Paragraph>;
    // default notification actions
    let actions =  [
      <Button primary label={options.confirmLabel} fill={false} onClick={this.confirm}/>
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
          width={'medium'}
          title={options.title}
          {...modalProps}
        >
          <Box width={'medium'}>
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

