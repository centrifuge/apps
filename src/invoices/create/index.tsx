import React from 'react';

import { connect } from 'react-redux';

import CreateInvoice from './CreateInvoice';
import { createInvoice } from '../../actions/invoices';
import { Invoice } from '../../common/models/dto/invoice';
import { RouteComponentProps, withRouter } from 'react-router';
import { RequestState } from '../../reducers/http-request-reducer';
import { InvoiceInvoiceData } from '../../../clients/centrifuge-node/generated-client';

type ConnectedCreateInvoiceProps = {
  createInvoice: (invoice: Invoice) => void;
  loading: boolean;
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
    if (this.props.loading) {
      return 'Creating invoice';
    }

    return (
      <CreateInvoice onSubmit={this.createInvoice} onCancel={this.onCancel} />
    );
  }
}

export default connect(
  (state: { invoices: { create: RequestState<InvoiceInvoiceData> } }) => {
    return {
      loading: state.invoices.create.loading,
    };
  },
  { createInvoice },
)(withRouter(ConnectedCreateInvoice));
