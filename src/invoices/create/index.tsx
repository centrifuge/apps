import React from 'react';

import { connect } from 'react-redux';

import CreateInvoice from './CreateInvoice';
import { createInvoice } from '../../actions/invoices';
import { Invoice } from '../../common/models/dto/invoice';
import { RouteComponentProps, withRouter } from 'react-router';

type ConnectedCreateInvoiceProps = {
  createInvoice: (invoice: Invoice) => void;
} & RouteComponentProps;

class ConnectedCreateInvoice extends React.Component<
  ConnectedCreateInvoiceProps
> {
  createInvoice = (invoice: Invoice) => {
    this.props.createInvoice(invoice);
  };

  onCancel = () => {
    this.props.history.goBack();
  };

  render() {
    return (
      <CreateInvoice
        onSubmit={this.createInvoice}
        onCancel={this.onCancel}
      />
    );
  }
}

export default connect(
  null,
  { createInvoice },
)(withRouter(ConnectedCreateInvoice));
